# Signal Garden — Dev Startup Script
# Run: .\dev-start.ps1
# Starts: PostgreSQL → Prisma sync → ngrok → Next.js dev server

$ErrorActionPreference = "Stop"
$project = $PSScriptRoot
Set-Location $project
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

Write-Host "`n🌱 Signal Garden — Starting development environment...`n" -ForegroundColor Green

# ─── Step 1: Ensure PostgreSQL is running ───
Write-Host "[1/5] Checking PostgreSQL..." -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "  Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
} elseif (-not $pgService) {
    Write-Host "  No PostgreSQL service found, starting via Docker..." -ForegroundColor Yellow
    docker compose -f "$project\docker-compose.yml" up -d db
    Start-Sleep -Seconds 5
}

# ─── Step 2: Wait for DB to accept connections ───
Write-Host "[2/5] Waiting for database..." -ForegroundColor Cyan
$pgReady = $false
for ($i = 0; $i -lt 10; $i++) {
    & "C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h localhost -p 5432 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $pgReady = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $pgReady) {
    Write-Host "  ✗ PostgreSQL not responding on localhost:5432" -ForegroundColor Red
    Write-Host "    Make sure PostgreSQL is installed and running." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ PostgreSQL accepting connections" -ForegroundColor Green

# ─── Step 3: Sync Prisma schema ───
Write-Host "[3/5] Syncing database schema..." -ForegroundColor Cyan
npx prisma db push --skip-generate 2>&1 | Out-Null
npx prisma generate 2>&1 | Out-Null
Write-Host "  ✓ Database schema synced" -ForegroundColor Green

# ─── Step 4: Start ngrok in background ───
Write-Host "[4/5] Starting ngrok tunnel..." -ForegroundColor Cyan
$ngrokRunning = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokRunning) {
    Write-Host "  ✓ ngrok already running (PID $($ngrokRunning.Id))" -ForegroundColor Green
} else {
    Start-Process ngrok -ArgumentList "http", "3000" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    # Fetch the public URL from ngrok's local API
    try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" }).public_url
        Write-Host "  ✓ ngrok tunnel: $ngrokUrl" -ForegroundColor Green
        Write-Host "  → Webhook URL: $ngrokUrl/api/webhooks/clerk" -ForegroundColor Yellow
    } catch {
        Write-Host "  ⚠ ngrok started but couldn't fetch URL. Check http://127.0.0.1:4040" -ForegroundColor Yellow
    }
}

# ─── Step 5: Start Next.js dev server ───
Write-Host "[5/5] Starting Next.js dev server..." -ForegroundColor Cyan
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  🌱 App:        http://localhost:3000" -ForegroundColor Green
Write-Host "  🔗 ngrok:      http://127.0.0.1:4040 (inspect)" -ForegroundColor DarkGray
Write-Host "  📊 DB Studio:  npx prisma studio  (run separately)" -ForegroundColor DarkGray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

npm run dev
