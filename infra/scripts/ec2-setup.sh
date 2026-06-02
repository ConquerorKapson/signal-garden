#!/bin/bash
# ec2-setup.sh — First-time EC2 setup for Signal Garden
# Run this ONCE after SSHing into a fresh Ubuntu EC2 instance
# Usage: bash ec2-setup.sh

set -e

echo "=== EC2 Setup for Signal Garden ==="

# 1. System updates
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js LTS via NodeSource
echo "📦 Installing Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

# 3. Install NGINX
echo "📦 Installing NGINX..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 4. Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# 5. Install PostgreSQL client (for testing RDS connection)
echo "📦 Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# 6. Install Certbot for HTTPS
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 7. Create swap file (t2.micro only has 1GB RAM — builds need more)
echo "💾 Creating 2GB swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 8. Create app directory
echo "📁 Creating app directory..."
mkdir -p /home/ubuntu/signal-garden

# 9. Configure firewall (UFW)
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Clone your repo: git clone <your-repo-url> /home/ubuntu/signal-garden"
echo "2. Create .env file with production values"
echo "3. Run: cd /home/ubuntu/signal-garden && npm ci && npm run build"
echo "4. Configure NGINX (see infra/nginx/signal-garden.conf)"
echo "5. Start app: pm2 start npm --name signal-garden -- start"
echo "6. Setup SSL: sudo certbot --nginx -d yourdomain.com"
