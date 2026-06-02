# AWS Setup Guide — Zero to Running

This guide walks you through setting up EC2 + RDS from scratch with zero experience.

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com and create an account
2. You need a credit card (won't be charged if staying in free tier)
3. Choose "Personal" account type

## Step 2: Secure Your Account (DO THIS FIRST)

```
Root Account → IAM → Enable MFA → Add authenticator app
```

Then create an IAM admin user:
1. Go to IAM → Users → Create User
2. Name: `admin`
3. Attach policy: `AdministratorAccess`
4. Enable console access
5. Save credentials
6. **Log out of root. Always use this IAM user going forward.**

## Step 3: Set Budget Alarms

1. Go to Billing → Budgets → Create Budget
2. Set monthly budget: $5
3. Alert at 50% and 80%
4. This prevents surprise charges

## Step 4: Create Key Pair for SSH

1. Go to EC2 → Key Pairs → Create Key Pair
2. Name: `signal-garden-key`
3. Type: RSA
4. Format: .pem
5. Download and save securely (you'll need this to SSH in)

## Step 5: Launch EC2 Instance

1. Go to EC2 → Launch Instance
2. Settings:
   - Name: `signal-garden-server`
   - AMI: Ubuntu Server 24.04 LTS (Free tier eligible)
   - Instance type: `t2.micro` (Free tier)
   - Key pair: select `signal-garden-key`
   - Network: default VPC
   - Auto-assign public IP: Enable
   - Security Group: Create new
     - Rule 1: SSH (22) → My IP only
     - Rule 2: HTTP (80) → Anywhere
     - Rule 3: HTTPS (443) → Anywhere
   - Storage: 8 GB gp3 (free tier allows up to 30GB)
3. Launch!

## Step 6: Allocate Elastic IP

1. Go to EC2 → Elastic IPs → Allocate
2. Associate it with your instance
3. Now your server has a permanent public IP

## Step 7: SSH Into Your Server

```bash
# Make key read-only (Linux/Mac)
chmod 400 signal-garden-key.pem

# Connect
ssh -i signal-garden-key.pem ubuntu@<your-elastic-ip>
```

On Windows (PowerShell):
```powershell
ssh -i .\signal-garden-key.pem ubuntu@<your-elastic-ip>
```

## Step 8: Create RDS PostgreSQL

1. Go to RDS → Create Database
2. Settings:
   - Engine: PostgreSQL
   - Template: Free tier
   - DB instance identifier: `signal-garden-db`
   - Master username: `postgres`
   - Master password: (choose a strong one, save it!)
   - Instance class: `db.t3.micro`
   - Storage: 20 GB gp2
   - Public access: **No** (critical for security)
   - VPC: Same as your EC2
   - Create new Security Group: `signal-garden-rds-sg`
3. Create database

## Step 9: Configure RDS Security Group

After RDS is created:
1. Go to RDS instance → Connectivity & Security
2. Click on the Security Group
3. Edit inbound rules:
   - Type: PostgreSQL (5432)
   - Source: Select the **EC2 Security Group** (not an IP!)
4. This means ONLY your EC2 can reach the database

## Step 10: Test Connectivity

SSH into EC2 and test:
```bash
# Install psql client (if not already done by ec2-setup.sh)
sudo apt install -y postgresql-client

# Test connection to RDS
psql -h <your-rds-endpoint> -U postgres -d postgres
# Enter your password when prompted
```

If it connects, your networking is correct!

## Step 11: Deploy the App

On your EC2:
```bash
# Clone the repo
git clone <your-repo-url> /home/ubuntu/signal-garden
cd /home/ubuntu/signal-garden

# Run the setup script
bash infra/scripts/ec2-setup.sh

# Create production env file
cat > .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXXX
CLERK_SECRET_KEY=sk_live_XXXX
CLERK_WEBHOOK_SECRET=whsec_XXXX
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/signal_garden
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
EOF

# Install, migrate, build, start
npm ci
npx prisma migrate deploy
npm run build
pm2 start npm --name signal-garden -- start
pm2 save
pm2 startup
```

## Step 12: Configure NGINX

```bash
sudo cp infra/nginx/signal-garden.conf /etc/nginx/sites-available/signal-garden
sudo ln -s /etc/nginx/sites-available/signal-garden /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Step 13: Add Domain + HTTPS

1. Buy a domain or use a free subdomain service
2. Point A record to your Elastic IP
3. Wait for DNS propagation (5-30 min)
4. Then:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 14: Validate Everything

- [ ] Visit https://yourdomain.com — landing page loads
- [ ] Sign in with Clerk works
- [ ] Create a signal — data persists
- [ ] Public feed shows public signals
- [ ] SSH still works from your IP

## Common Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't SSH | Check SG allows port 22 from your IP |
| Can't reach website | Check SG allows 80/443, NGINX is running |
| App can't reach RDS | Check RDS SG source is EC2 SG, not an IP |
| Clerk login fails | Update Clerk allowed origins to your domain |
| 502 Bad Gateway | App isn't running — check `pm2 status` |

## Cost Awareness

Free tier (12 months):
- 750 hours/month EC2 t2.micro
- 750 hours/month RDS db.t3.micro
- 20 GB RDS storage
- 30 GB EBS storage
- 15 GB data transfer out

**Always stop instances when not using them to stay within limits.**
