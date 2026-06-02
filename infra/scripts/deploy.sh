#!/bin/bash
# deploy.sh — run on EC2 to pull latest code and restart
# Usage: ssh into EC2, then run: bash deploy.sh

set -e

APP_DIR="/home/ubuntu/signal-garden"
cd "$APP_DIR"

echo "📦 Pulling latest code..."
git pull origin main

echo "📥 Installing dependencies..."
npm ci --production=false

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🏗️  Building application..."
npm run build

echo "🔄 Restarting application..."
pm2 restart signal-garden || pm2 start npm --name "signal-garden" -- start

echo "✅ Deployment complete!"
pm2 status
