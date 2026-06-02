# AWS Deployment Walkthrough — Signal Garden

> A hands-on guide that deploys Signal Garden to AWS while explaining every concept.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (VPC)                          │
│                                                                  │
│  ┌─── Public Subnet ───────────────────────────────────────┐    │
│  │                                                          │    │
│  │   ┌──────────────┐         ┌──────────────────────┐     │    │
│  │   │   Internet   │────────▶│  EC2 (Ubuntu 22.04)  │     │    │
│  │   │   Gateway    │         │  - NGINX (port 80/443)│    │    │
│  │   └──────────────┘         │  - Next.js (port 3000)│    │    │
│  │                            │  - PM2 (process mgr)  │     │    │
│  │                            └──────────┬───────────┘     │    │
│  └───────────────────────────────────────┼──────────────────┘    │
│                                          │                       │
│  ┌─── Private Subnet ───────────────────┼──────────────────┐    │
│  │                                       ▼                  │    │
│  │                    ┌──────────────────────┐              │    │
│  │                    │  RDS (PostgreSQL 16)  │              │    │
│  │                    │  - Multi-AZ optional  │              │    │
│  │                    │  - Encrypted at rest  │              │    │
│  │                    └──────────────────────┘              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

User → Route 53 (DNS) → EC2 (NGINX → Next.js) → RDS (PostgreSQL)
```

---

## Key Concepts You'll Learn

| Concept | Why It Matters |
|---------|---------------|
| **VPC** | Your private network in AWS — isolates your resources |
| **Subnets** | Public (internet-facing) vs Private (database, no direct internet) |
| **Security Groups** | Firewall rules at the instance level |
| **EC2** | Virtual server — runs your app code |
| **RDS** | Managed database — AWS handles backups, patches, failover |
| **NGINX** | Reverse proxy — routes traffic, terminates TLS, serves static |
| **PM2** | Process manager — keeps Node.js alive, auto-restarts on crash |
| **Certbot** | Free HTTPS certificates from Let's Encrypt |

---

## Phase 1: AWS Console Setup (One-Time)

### Step 1: Create a VPC

**Concept:** A VPC (Virtual Private Cloud) is your own isolated network within AWS. Think of it as your own data center with its own IP range.

1. Go to **VPC Console** → Create VPC
2. Choose **"VPC and more"** (auto-creates subnets, route tables, gateway)
3. Settings:
   - Name: `signal-garden-vpc`
   - IPv4 CIDR: `10.0.0.0/16` (gives you 65,536 IPs)
   - AZs: 2
   - Public subnets: 2 (for EC2 + load balancer if needed later)
   - Private subnets: 2 (for RDS — it requires 2 AZs)
   - NAT gateways: None (saves ~$30/month — not needed for our setup)
   - VPC endpoints: None

**Learning point:** The `/16` CIDR means the first 16 bits are fixed (10.0.x.x). Your subnets will carve up the remaining space — e.g., `10.0.1.0/24` (256 IPs) for public, `10.0.3.0/24` for private.

---

### Step 2: Create Security Groups

**Concept:** Security Groups are stateful firewalls. "Stateful" means if you allow inbound traffic, the response is automatically allowed out.

#### SG 1: `sg-web` (for EC2)

| Type | Port | Source | Why |
|------|------|--------|-----|
| SSH | 22 | Your IP | So only you can SSH in |
| HTTP | 80 | 0.0.0.0/0 | Public web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Public web traffic (TLS) |

#### SG 2: `sg-database` (for RDS)

| Type | Port | Source | Why |
|------|------|--------|-----|
| PostgreSQL | 5432 | sg-web | Only EC2 can reach the database |

**Learning point:** Notice the database SG references the *web SG*, not an IP. This means any instance in `sg-web` can connect. If you replace your EC2, the new one auto-gains access.

---

### Step 3: Launch RDS (PostgreSQL)

**Concept:** RDS is a managed database service. AWS handles OS patches, automated backups, point-in-time recovery — you just connect and query.

1. Go to **RDS Console** → Create database
2. Settings:
   - Engine: PostgreSQL 16
   - Template: **Free tier** (or Dev/Test if you want more power)
   - DB instance identifier: `signal-garden-db`
   - Master username: `postgres`
   - Master password: (generate a strong one, save it!)
   - Instance class: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB gp3
   - VPC: `signal-garden-vpc`
   - Subnet group: Select the private subnets
   - Public access: **No** (critical for security!)
   - Security group: `sg-database`
   - Initial database name: `signal_garden`

3. Wait ~5 mins for it to provision
4. Note the **Endpoint** (e.g., `signal-garden-db.abc123.us-east-1.rds.amazonaws.com`)

**Learning point:** "Public access: No" means RDS has no public IP. It can ONLY be reached from within the VPC (i.e., your EC2). This is defense-in-depth — even if credentials leak, attackers can't connect from outside.

---

### Step 4: Launch EC2

**Concept:** EC2 (Elastic Compute Cloud) is a virtual machine. You pick the OS, size, and storage. You're responsible for everything on the box.

1. Go to **EC2 Console** → Launch instance
2. Settings:
   - Name: `signal-garden-app`
   - AMI: **Ubuntu 22.04 LTS** (free tier eligible)
   - Instance type: `t2.micro` (free tier) or `t3.small` (better for Node.js builds)
   - Key pair: Create new → `signal-garden-key` → Download `.pem` file
   - Network: `signal-garden-vpc`, **public subnet**
   - Auto-assign public IP: **Enable**
   - Security group: `sg-web`
   - Storage: 20 GB gp3

3. Launch! Note the **Public IPv4** address.

**Learning point:** The `.pem` file is your SSH private key. Guard it like a password. Anyone with this file + your public IP can access your server.

---

## Phase 2: Server Setup (SSH into EC2)

### Step 5: SSH into your instance

```bash
# From your local machine (PowerShell or Git Bash)
ssh -i "signal-garden-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

If you get a permissions error on Windows:
```powershell
icacls "signal-garden-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

---

### Step 6: Run the EC2 setup script

```bash
# On the EC2 instance:
# Option A: Clone your repo first, then run the script
git clone https://github.com/YOUR_USERNAME/signal-garden.git /home/ubuntu/signal-garden
cd /home/ubuntu/signal-garden
bash infra/scripts/ec2-setup.sh
```

This installs: Node.js LTS, NGINX, PM2, PostgreSQL client, Certbot, UFW firewall.

**What each tool does:**
- **Node.js** — runs your Next.js app
- **NGINX** — sits in front on port 80/443, proxies to Node.js on port 3000
- **PM2** — keeps your app alive (auto-restart on crash, boot startup)
- **Certbot** — issues free TLS certs from Let's Encrypt
- **UFW** — Ubuntu's firewall (redundant with SG, but defense-in-depth)

---

### Step 7: Create the production `.env` file

```bash
cd /home/ubuntu/signal-garden
nano .env
```

Paste this (with YOUR real values):

```env
# Production environment
NODE_ENV=production

# Clerk (same keys work in prod unless you have a prod Clerk instance)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# RDS PostgreSQL (use the endpoint from Step 3)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@signal-garden-db.abc123.us-east-1.rds.amazonaws.com:5432/signal_garden?schema=public"
```

**Learning point:** In production, Clerk recommends separate "Production" instance with keys starting `pk_live_` / `sk_live_`. For learning, dev keys work fine.

---

### Step 8: Build and start the app

```bash
cd /home/ubuntu/signal-garden

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Push schema to RDS (first time — creates tables)
npx prisma db push

# Build the production bundle
npm run build

# Start with PM2
pm2 start npm --name "signal-garden" -- start

# Make PM2 survive reboots
pm2 startup    # follow the printed command
pm2 save
```

**Concept — PM2:**
```
pm2 list              # see running processes
pm2 logs signal-garden # tail logs
pm2 restart signal-garden
pm2 monit             # real-time CPU/RAM monitor
```

---

### Step 9: Configure NGINX

```bash
# Copy the config
sudo cp /home/ubuntu/signal-garden/infra/nginx/signal-garden.conf /etc/nginx/sites-available/signal-garden

# Edit the server_name to your domain (or EC2 public IP for now)
sudo nano /etc/nginx/sites-available/signal-garden
# Change: server_name yourdomain.com; → server_name YOUR_EC2_IP;

# Enable the site
sudo ln -s /etc/nginx/sites-available/signal-garden /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # remove default page

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

**Concept — Why NGINX in front of Node.js?**
1. **TLS termination** — handles HTTPS, Node.js only deals with plain HTTP
2. **Static file serving** — faster than Node.js for images/CSS/JS
3. **Connection handling** — buffers slow clients, protects Node.js
4. **Security** — hides Node.js version, adds security headers

---

### Step 10: Verify it works

```bash
# Test from EC2 itself
curl http://localhost:3000   # Direct to Next.js (should return HTML)
curl http://localhost        # Through NGINX (same HTML)
```

From your browser: `http://YOUR_EC2_PUBLIC_IP`

You should see Signal Garden's landing page!

---

## Phase 3: HTTPS + Domain (Optional but Recommended)

### Step 11: Point a domain to EC2

1. Buy/use a domain (Route 53, Namecheap, Cloudflare, etc.)
2. Create an **A record** pointing to your EC2's public IP:
   - `signal-garden.yourdomain.com` → `3.14.xxx.xxx`

### Step 12: Get free TLS certificate

```bash
# Update NGINX server_name to your domain first
sudo nano /etc/nginx/sites-available/signal-garden
# server_name signal-garden.yourdomain.com;
sudo nginx -t && sudo systemctl reload nginx

# Run Certbot
sudo certbot --nginx -d signal-garden.yourdomain.com
```

Certbot automatically:
- Gets a certificate from Let's Encrypt
- Modifies NGINX config to redirect HTTP → HTTPS
- Sets up auto-renewal (cert expires every 90 days)

**Learning point:** TLS (the 'S' in HTTPS) encrypts traffic between browser and server. Without it, passwords and data are sent in plaintext. Also required for Clerk to work in production.

---

## Phase 4: Update Clerk Webhook for Production

1. Go to Clerk Dashboard → Webhooks
2. Add a new endpoint: `https://signal-garden.yourdomain.com/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.updated`, `user.deleted`
4. Copy the new Signing Secret → update `.env` on EC2
5. Restart: `pm2 restart signal-garden`

---

## Phase 5: CI/CD (Auto-Deploy on Push)

The GitHub Actions workflow is already at `.github/workflows/deploy.yml`. To activate it:

### Add GitHub Secrets

Go to your repo → Settings → Secrets → Actions. Add:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | Your EC2 public IP (or domain) |
| `EC2_SSH_KEY` | Contents of `signal-garden-key.pem` |

Now every push to `main` will:
1. Lint → Build (catches errors before deploying)
2. SSH into EC2 → pull → install → migrate → build → restart

**Learning point:** This is a "push-based" deployment. The CI server reaches out to EC2 via SSH. The alternative is "pull-based" (EC2 polls for changes) — less common for simple setups.

---

## Cost Breakdown (Free Tier Eligible)

| Resource | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| EC2 t2.micro | 750 hrs/month (12 months) | ~$8.50/month |
| RDS db.t3.micro | 750 hrs/month (12 months) | ~$13/month |
| Storage (EBS + RDS) | 30 GB + 20 GB | ~$4/month |
| Data transfer | 100 GB/month out | $0.09/GB |
| **Total** | **$0/month** | **~$26/month** |

---

## Quick Reference — Commands Cheat Sheet

```bash
# SSH into EC2
ssh -i "signal-garden-key.pem" ubuntu@YOUR_IP

# Check app status
pm2 status
pm2 logs signal-garden --lines 50

# Manual deploy (if not using CI/CD)
cd /home/ubuntu/signal-garden
bash infra/scripts/deploy.sh

# Database connection test
psql "postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/signal_garden"

# NGINX
sudo nginx -t                  # test config
sudo systemctl reload nginx    # apply changes
sudo tail -f /var/log/nginx/error.log

# TLS cert renewal (auto, but manual test)
sudo certbot renew --dry-run
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't SSH | Check SG allows port 22 from your IP. Check .pem permissions. |
| App not loading in browser | Check `pm2 status` (is it running?). Check `sudo nginx -t`. |
| Can't connect to RDS | Verify EC2 and RDS are in same VPC. Check `sg-database` allows `sg-web` on 5432. |
| Clerk auth not working | Need HTTPS for production Clerk. Use certbot. |
| 502 Bad Gateway | Next.js crashed. Run `pm2 logs`. Usually a missing env var. |
| Build fails on EC2 | t2.micro has 1 GB RAM. Try: `NODE_OPTIONS="--max-old-space-size=512" npm run build` |

---

## What's Next After Deployment?

- **Elastic IP** — so your EC2 IP doesn't change on reboot
- **CloudFront CDN** — cache static assets globally
- **Route 53 health checks** — alert if your site goes down
- **CloudWatch alarms** — CPU/memory alerts
- **Multi-AZ RDS** — database survives AZ failures
