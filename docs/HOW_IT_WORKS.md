# How Signal Garden Works — Full Architecture Deep Dive

> Everything that happens under the hood when your app runs on AWS.

---

## 1. The Complete Request Lifecycle

When someone visits `http://13.234.33.134/dashboard`, here's **every single step**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          THE JOURNEY OF A REQUEST                              │
└──────────────────────────────────────────────────────────────────────────────┘

👤 Browser types: http://13.234.33.134/dashboard
        │
        ▼
┌─── INTERNET ────────────────────────────────────────────────────────────────┐
│  DNS resolves 13.234.33.134 → already an IP, no DNS needed                  │
│  TCP 3-way handshake (SYN → SYN-ACK → ACK) on port 80                      │
│  HTTP GET /dashboard                                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─── AWS NETWORK LAYER ───────────────────────────────────────────────────────┐
│                                                                              │
│  Internet Gateway (igw-01dc80db10178b5d4)                                   │
│  Routes traffic from public internet → VPC                                  │
│       │                                                                      │
│       ▼                                                                      │
│  Security Group (sg-web) checks:                                            │
│  "Is port 80 from 0.0.0.0/0 allowed?" → ✅ YES                             │
│       │                                                                      │
│       ▼                                                                      │
│  Packet arrives at EC2's ENI (Elastic Network Interface)                    │
│  Private IP: 10.0.0.10 (public IP 13.234.33.134 is NAT'd by AWS)          │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─── EC2 INSTANCE (Ubuntu 24.04) ────────────────────────────────────────────┐
│                                                                              │
│  ┌── UFW Firewall ──┐                                                       │
│  │ Port 80 allowed? │ → ✅                                                  │
│  └────────┬─────────┘                                                       │
│           ▼                                                                  │
│  ┌── NGINX (port 80) ──────────────────────────────────────────────┐        │
│  │                                                                  │        │
│  │  1. Receives: GET /dashboard HTTP/1.1                           │        │
│  │  2. Matches: location / { proxy_pass http://localhost:3000 }    │        │
│  │  3. Adds headers:                                                │        │
│  │     X-Real-IP: 122.161.242.51 (your real IP)                    │        │
│  │     X-Forwarded-For: 122.161.242.51                             │        │
│  │     X-Forwarded-Proto: http                                      │        │
│  │  4. Opens NEW connection to localhost:3000                       │        │
│  │  5. Forwards the request                                         │        │
│  │                                                                  │        │
│  └────────────────────────────────┬─────────────────────────────────┘        │
│                                   │                                          │
│                                   ▼                                          │
│  ┌── PM2 (God Process) ─────────────────────────────────────────────┐       │
│  │  PID 1234 — watches child processes                               │       │
│  │  If child dies → spawns new one in <1s                            │       │
│  │  Logs → /home/ubuntu/.pm2/logs/                                   │       │
│  │                                                                    │       │
│  │  ┌── Node.js Process (PID 397) ──────────────────────────────┐   │       │
│  │  │                                                            │   │       │
│  │  │  ┌── Next.js 15.5.18 Server ─────────────────────────┐   │   │       │
│  │  │  │                                                     │   │   │       │
│  │  │  │  1. Request enters Next.js router                   │   │   │       │
│  │  │  │  2. MIDDLEWARE runs first (src/middleware.ts):       │   │   │       │
│  │  │  │     → clerkMiddleware() intercepts                  │   │   │       │
│  │  │  │     → Checks: is /dashboard protected? YES          │   │   │       │
│  │  │  │     → Reads session cookie: __session               │   │   │       │
│  │  │  │     → Verifies JWT with Clerk's public key          │   │   │       │
│  │  │  │     → If valid → attach user to request            │   │   │       │
│  │  │  │     → If invalid → redirect to /sign-in            │   │   │       │
│  │  │  │                                                     │   │   │       │
│  │  │  │  3. Route handler: /dashboard/page.tsx              │   │   │       │
│  │  │  │     → Server renders React component                │   │   │       │
│  │  │  │     → Client components marked "use client"         │   │   │       │
│  │  │  │       get serialized as JS bundles                  │   │   │       │
│  │  │  │                                                     │   │   │       │
│  │  │  │  4. Returns HTML + JS chunks to NGINX               │   │   │       │
│  │  │  └─────────────────────────────────────────────────────┘   │   │       │
│  │  └────────────────────────────────────────────────────────────┘   │       │
│  └────────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼ Response flows back: Node → PM2 → NGINX → Internet → Browser

👤 Browser receives HTML, renders the page, downloads JS bundles
   React hydrates → page becomes interactive
```

---

## 2. How EC2 Connects to RDS — The Network Path

```
┌─── signal-garden-vpc (10.0.0.0/16) ────────────────────────────────────────┐
│                                                                              │
│  ┌── Public Subnet (10.0.0.0/24) ──┐    ┌── Private Subnet (10.0.1.0/24)──┐│
│  │                                   │    │                                  ││
│  │  EC2: 10.0.0.10                  │    │  RDS: 10.0.1.xx                  ││
│  │  (has public IP + IGW route)     │    │  (NO public IP, NO IGW route)    ││
│  │                                   │    │                                  ││
│  │  sg-web allows:                   │    │  sg-database allows:             ││
│  │    IN: 22,80,443 from internet   │    │    IN: 5432 from sg-web ONLY     ││
│  │    OUT: all                       │    │    OUT: all                       ││
│  │                                   │    │                                  ││
│  └───────────────┬───────────────────┘    └──────────────┬───────────────────┘│
│                  │                                        │                    │
│                  │         PRIVATE NETWORK LINK           │                    │
│                  └────────────────────────────────────────┘                    │
│                       Both in same VPC = can talk                              │
│                       via private IPs (10.0.x.x)                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**How the connection actually works:**

1. Your Next.js app reads `DATABASE_URL` from `.env`:
   ```
   postgresql://postgres:PASSWORD@signal-garden-db.clac6cmc8op6.ap-south-1.rds.amazonaws.com:5432/signal_garden
   ```

2. DNS resolves that hostname → `10.0.1.xx` (RDS private IP within your VPC)

3. TCP connection: `10.0.0.10:random_port` → `10.0.1.xx:5432`

4. Security Group check:
   - "Is the source in `sg-web`?" → EC2 is in sg-web → ✅ ALLOWED

5. PostgreSQL auth: username `postgres`, password from URL → ✅

6. Connection established. Prisma keeps a **connection pool** (default 5 connections open, reused across requests)

**Why no one from the internet can reach your database:**
- RDS has no public IP
- RDS subnet has no Internet Gateway route
- sg-database only allows port 5432 from sg-web
- Even if someone guesses the RDS hostname, DNS won't resolve it outside the VPC

**Three walls between internet and your data:**
```
Internet ──✗── No public IP
Internet ──✗── No route (private subnet)
Internet ──✗── Security group blocks all except sg-web on 5432
```

---

## 3. How Tables Got Created — Prisma → RDS

When you ran `npx prisma db push` on EC2:

```
┌─────────────────────────────────────────────────────────────────┐
│  Your schema.prisma file:                                        │
│                                                                   │
│  model Signal {                                                   │
│    id          String   @id @default(cuid())                     │
│    clerkUserId String                                            │
│    content     String   @db.VarChar(240)                         │
│    mood        Mood                                              │
│    isPublic    Boolean  @default(false)                          │
│    dateKey     DateTime @db.Date                                 │
│    createdAt   DateTime @default(now())                          │
│    @@unique([clerkUserId, dateKey])                              │
│  }                                                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Prisma reads this
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Prisma compares schema vs current database state:               │
│                                                                   │
│  Current DB: empty (no tables)                                   │
│  Schema wants: Signal table + Mood enum                          │
│  Diff: CREATE everything                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    Generates SQL
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SQL sent to RDS over the private VPC connection:                │
│                                                                   │
│  CREATE TYPE "Mood" AS ENUM (                                    │
│    'NEUTRAL', 'HAPPY', 'SAD', 'ANXIOUS',                        │
│    'ENERGETIC', 'CALM', 'GRATEFUL'                               │
│  );                                                               │
│                                                                   │
│  CREATE TABLE "Signal" (                                          │
│    "id" TEXT NOT NULL,                                            │
│    "clerkUserId" TEXT NOT NULL,                                   │
│    "content" VARCHAR(240) NOT NULL,                               │
│    "mood" "Mood" NOT NULL,                                        │
│    "isPublic" BOOLEAN NOT NULL DEFAULT false,                    │
│    "dateKey" DATE NOT NULL,                                       │
│    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,  │
│    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")                   │
│  );                                                               │
│                                                                   │
│  CREATE UNIQUE INDEX "Signal_clerkUserId_dateKey_key"            │
│    ON "Signal"("clerkUserId", "dateKey");                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                    RDS executes it
                           │
                           ▼
                    Tables exist! ✅
```

**`prisma db push` vs `prisma migrate deploy`:**
- `db push` — compares schema to DB, generates + runs SQL immediately. No migration history. Good for prototyping.
- `migrate deploy` — runs saved migration files (in `prisma/migrations/`). Has history. Good for production with multiple developers.

---

## 4. How Clerk Works — No Ngrok Needed in Production!

This is the key insight: **ngrok was only needed for LOCAL development**.

### Why ngrok was needed locally:
```
Clerk's servers need to send webhooks TO your app.
Your laptop: 192.168.1.x (not reachable from internet)
Solution: ngrok creates a public URL that tunnels to localhost:3000
```

### Why ngrok is NOT needed on AWS:
```
Your EC2: 13.234.33.134 (already publicly reachable!)
Clerk can directly hit: http://13.234.33.134/api/webhooks/clerk
No tunnel needed.
```

### How Clerk auth works in production:

```
┌── SIGN-IN FLOW ──────────────────────────────────────────────────────────────┐
│                                                                               │
│  1. User visits /sign-in                                                      │
│     → Clerk's <SignIn/> component renders                                    │
│     → Component loads Clerk.js from Clerk's CDN                              │
│                                                                               │
│  2. User enters email + password                                              │
│     → Clerk.js sends credentials directly to Clerk's API                     │
│       (https://one-tuna-81.clerk.accounts.dev)                               │
│     → NOT to your server! Your server never sees the password.               │
│                                                                               │
│  3. Clerk validates → returns a signed JWT (session token)                   │
│     → Stored as __session cookie on your domain                              │
│                                                                               │
│  4. Browser redirects to /dashboard (with cookie)                            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌── EVERY SUBSEQUENT REQUEST ──────────────────────────────────────────────────┐
│                                                                               │
│  Browser → GET /dashboard (carries __session cookie)                          │
│       │                                                                       │
│       ▼                                                                       │
│  Middleware (src/middleware.ts):                                               │
│    1. Extract __session cookie                                                │
│    2. Decode JWT: { sub: "user_2abc...", exp: 1717200000, ... }              │
│    3. Verify signature using Clerk's public key                               │
│       (downloaded once and cached — no API call to Clerk!)                   │
│    4. Check: is token expired? No → ✅                                        │
│    5. Attach userId to request context                                        │
│                                                                               │
│  Dashboard page:                                                              │
│    useUser() → reads from the verified JWT → no API call                     │
│    Fetches /api/signals → uses clerkUserId from JWT                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌── WEBHOOK FLOW (user created/updated) ───────────────────────────────────────┐
│                                                                               │
│  1. Someone signs up on your app                                              │
│  2. Clerk processes it on their side                                          │
│  3. Clerk's server POSTs to:                                                  │
│       http://13.234.33.134/api/webhooks/clerk                                │
│     with body: { type: "user.created", data: { id: "user_2abc..." } }       │
│     with headers: svix-id, svix-timestamp, svix-signature                    │
│                                                                               │
│  4. Your webhook handler:                                                     │
│     a. Reads CLERK_WEBHOOK_SECRET from .env                                  │
│     b. Uses svix library to verify the signature                             │
│        (proves it actually came from Clerk, not an attacker)                 │
│     c. Processes the event (e.g., log new user)                              │
│                                                                               │
│  NOTE: You need to add your EC2 URL as a webhook endpoint in Clerk Dashboard │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. How PM2 Keeps Everything Alive

```
┌── SYSTEM BOOT SEQUENCE ─────────────────────────────────────────┐
│                                                                   │
│  1. Ubuntu starts (EC2 powers on / reboots)                      │
│  2. systemd starts services:                                      │
│     → nginx.service (you ran: systemctl enable nginx)            │
│     → pm2-ubuntu.service (you ran: pm2 startup + pm2 save)      │
│                                                                   │
│  3. PM2 starts → reads saved process list:                       │
│     "signal-garden" → npm start → cwd: /home/ubuntu/signal-garden│
│                                                                   │
│  4. App is running without anyone SSH'ing in!                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌── CRASH RECOVERY ───────────────────────────────────────────────┐
│                                                                   │
│  App crashes (unhandled exception, OOM, etc.)                    │
│       │                                                           │
│  PM2 detects child process exited                                │
│       │                                                           │
│  PM2 waits 100ms → spawns new process                            │
│       │                                                           │
│  App is back online. Total downtime: ~1-2 seconds.              │
│                                                                   │
│  If app crash-loops (16 restarts in <1 min):                     │
│  PM2 enters "errored" state → stops restarting                   │
│  You check: pm2 logs → fix the bug → pm2 restart                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Full Data Flow — Creating a Signal

When a user writes a daily signal on the dashboard:

```
Browser (React)                    EC2                              RDS
     │                              │                                │
     │  POST /api/signals           │                                │
     │  Body: {                     │                                │
     │    content: "Feeling good",  │                                │
     │    mood: "HAPPY",            │                                │
     │    isPublic: true            │                                │
     │  }                           │                                │
     │  Cookie: __session=eyJhb...  │                                │
     │─────────────────────────────▶│                                │
     │                              │                                │
     │                    NGINX receives on :80                      │
     │                    Proxies to localhost:3000                   │
     │                              │                                │
     │                    Next.js receives request                   │
     │                    Middleware verifies JWT ✅                  │
     │                    Extracts: userId = "user_2abc..."          │
     │                              │                                │
     │                    Route handler: /api/signals/route.ts       │
     │                    1. Validates: content ≤ 240 chars          │
     │                    2. Generates dateKey: "2026-06-02"         │
     │                    3. Calls Prisma:                           │
     │                              │                                │
     │                              │  SQL over TCP (private IP):    │
     │                              │  INSERT INTO "Signal"          │
     │                              │  (id, clerkUserId, content,    │
     │                              │   mood, isPublic, dateKey,     │
     │                              │   createdAt)                   │
     │                              │  VALUES (...)                  │
     │                              │──────────────────────────────▶│
     │                              │                                │
     │                              │              Security Group    │
     │                              │              checks source:    │
     │                              │              sg-web? ✅        │
     │                              │                                │
     │                              │                    PostgreSQL: │
     │                              │                    Check unique│
     │                              │                    constraint: │
     │                              │                    (userId +   │
     │                              │                     dateKey)   │
     │                              │                    Not dupe ✅ │
     │                              │                    INSERT ✅   │
     │                              │◀──────────────────────────────│
     │                              │  Returns: { rows: 1 }         │
     │                              │                                │
     │                    Prisma maps row → Signal object            │
     │                    Returns JSON: 201 Created                  │
     │◀─────────────────────────────│                                │
     │                              │                                │
     │  React updates state                                          │
     │  AnimatePresence animates                                     │
     │  new signal card in                                           │
```

---

## 7. The `.env` File — Why It's the Brain

```
DATABASE_URL ──────→ Tells Prisma where the database lives
                     Without this: "Can't reach database" crash

CLERK_SECRET_KEY ──→ Used by middleware to verify JWTs
                     Without this: everyone gets 401 Unauthorized

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ──→ Used by browser (Clerk.js)
                     to know which Clerk app to authenticate against
                     Without this: sign-in page shows nothing

NODE_ENV=production ──→ Tells Next.js to use .next/ build output
                        instead of compiling on-the-fly (dev mode)
```

---

## 8. Summary — The Stack in One Picture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  BROWSER          →  Clerk.js handles auth UI                           │
│  (React + Framer)    JWT stored as cookie                               │
│       │                                                                  │
│       ▼                                                                  │
│  NGINX (:80)      →  Reverse proxy, security headers, future TLS       │
│       │                                                                  │
│       ▼                                                                  │
│  PM2              →  Process guardian (restart, logs, boot persist)      │
│       │                                                                  │
│       ▼                                                                  │
│  NEXT.JS (:3000)  →  SSR + API routes + middleware (JWT verification)   │
│       │                                                                  │
│       ▼                                                                  │
│  PRISMA           →  ORM, connection pool, type-safe queries            │
│       │                                                                  │
│       ▼                                                                  │
│  RDS (PostgreSQL) →  Data persistence, constraints, indexes             │
│                      Private subnet — unreachable from internet          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Key Takeaway — Separation of Concerns

Every layer has ONE job and trusts the layer above/below it:

| Layer | Job | Doesn't know about |
|-------|-----|-------------------|
| NGINX | Forward traffic, TLS, headers | Auth, business logic |
| PM2 | Keep process alive | HTTP, databases |
| Next.js | Process requests, render pages | Network security, process management |
| Prisma | Translate objects to SQL | Business rules |
| RDS | Store and retrieve data | Your app's existence |
| Security Groups | Allow/deny packets | What those packets contain |

This is what makes the system **maintainable** and **secure**. Each piece can be replaced independently without touching the others.
