# Signal Garden 🌱

A micro-journaling app where you plant one signal per day. Track your moods, build streaks, and optionally share with the community.

## Tech Stack

- **Frontend:** Next.js 15 + Tailwind CSS 4 + Framer Motion
- **Auth:** Clerk
- **Database:** PostgreSQL 17 + Prisma ORM
- **Tunneling:** ngrok (for Clerk webhooks in local dev)
- **Deployment:** EC2 + RDS + NGINX + PM2

---

## Quick Start (After Restart)

**Single command — does everything:**

```powershell
cd d:\prep\aws-clerk-ngrok-ec2-rds-learning-lab\signal-garden
.\dev-start.ps1
```

This script automatically:
1. ✅ Checks PostgreSQL is running (Windows service auto-starts)
2. ✅ Syncs Prisma schema to database
3. ✅ Launches ngrok tunnel (for Clerk webhooks)
4. ✅ Starts Next.js dev server on http://localhost:3000

---

## First-Time Setup (Fresh Machine)

### Prerequisites

| Tool | Install |
|------|---------|
| Node.js 20+ | https://nodejs.org |
| PostgreSQL 17 | https://www.postgresql.org/download/windows/ |
| ngrok | `winget install ngrok.ngrok` then `ngrok config add-authtoken YOUR_TOKEN` |
| Clerk account | https://clerk.com (free tier) |

### Step-by-step

```powershell
# 1. Clone and install dependencies
git clone <your-repo-url>
cd signal-garden
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"  # corporate network
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local — fill in:
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
#   CLERK_SECRET_KEY=sk_test_...
#   CLERK_WEBHOOK_SECRET=whsec_...  (from Clerk Dashboard → Webhooks)
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signal_garden?schema=public"

# 3. Create database and sync schema
npx prisma db push

# 4. Run the app
.\dev-start.ps1
```

### Configure Clerk Webhook (one-time)

1. Run `.\dev-start.ps1` — note the ngrok URL printed in terminal
2. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks → Add Endpoint
3. Set URL to: `https://YOUR-NGROK-ID.ngrok-free.app/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the Signing Secret → paste into `.env.local` as `CLERK_WEBHOOK_SECRET`

> **Note:** ngrok URL changes every restart (free tier). Update the webhook endpoint in Clerk Dashboard each time, or use a paid ngrok plan with a fixed domain.

---

## Manual Steps (if not using dev-start.ps1)

```powershell
# Terminal 1 — Database (usually auto-starts with Windows)
# Verify: pg_isready -h localhost -p 5432

# Terminal 2 — ngrok tunnel
ngrok http 3000

# Terminal 3 — Next.js dev server
cd d:\prep\aws-clerk-ngrok-ec2-rds-learning-lab\signal-garden
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npx prisma db push
npm run dev
```

---

## Useful Commands

| Command | What it does |
|---------|-------------|
| `.\dev-start.ps1` | Start everything (DB + ngrok + app) |
| `npx prisma studio` | Open database GUI at localhost:5555 |
| `npx prisma db push` | Sync schema.prisma → database |
| `npx prisma migrate dev` | Create a migration file |
| `npm run build` | Production build |
| `npm run start` | Start production server |

---

## Project Structure

```
signal-garden/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── signals/       # Signal CRUD API
│   │   │   └── webhooks/      # Clerk webhook handler
│   │   ├── dashboard/         # Protected dashboard page
│   │   ├── feed/              # Public feed page
│   │   ├── sign-in/           # Clerk sign-in
│   │   ├── sign-up/           # Clerk sign-up
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── SignalCard.tsx
│   │   └── SignalForm.tsx
│   ├── lib/
│   │   └── prisma.ts          # Prisma client singleton
│   └── middleware.ts          # Clerk auth middleware
├── infra/
│   ├── nginx/
│   └── scripts/
└── .github/workflows/
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `CLERK_WEBHOOK_SECRET` | For verifying webhook signatures |
| `DATABASE_URL` | PostgreSQL connection string |

## Learning Goals

This project teaches:
1. Full-stack auth with Clerk (social login, JWT, webhooks)
2. PostgreSQL schema design with Prisma
3. AWS networking (VPC, subnets, security groups)
4. EC2 deployment and process management
5. RDS connectivity from private subnets
6. NGINX reverse proxy and TLS termination
7. CI/CD with GitHub Actions
