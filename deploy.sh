#!/bin/bash
# DigitalOcean Deployment Script for Kernex
# Run this on your DigitalOcean Droplet after SSH login
# Usage: bash deploy.sh

set -e

echo "=========================================="
echo "Kernex Phase 2 - DigitalOcean Deployment"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# =====================================
# Step 1: System Update
# =====================================
log_step "Step 1: Updating system packages..."
apt-get update -y
apt-get upgrade -y
log_success "System updated"
echo ""

# =====================================
# Step 2: Verify Docker
# =====================================
log_step "Step 2: Verifying Docker installation..."
if command -v docker &> /dev/null; then
    log_success "Docker is installed: $(docker --version)"
else
    log_warning "Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    log_success "Docker installed"
fi
echo ""

# =====================================
# Step 3: Verify Docker Compose
# =====================================
log_step "Step 3: Verifying Docker Compose..."
if command -v docker-compose &> /dev/null; then
    log_success "Docker Compose installed: $(docker-compose --version)"
else
    log_warning "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installed"
fi
echo ""

# =====================================
# Step 4: Clone Repository
# =====================================
log_step "Step 4: Cloning Kernex repository..."
read -p "Enter GitHub username (or press Enter to skip if already cloned): " GITHUB_USER

if [ ! -z "$GITHUB_USER" ]; then
    cd /root
    git clone https://github.com/$GITHUB_USER/Project-Kernex.git
    cd Project-Kernex
    log_success "Repository cloned to /root/Project-Kernex"
else
    if [ -d "/root/Project-Kernex" ]; then
        cd /root/Project-Kernex
        log_success "Using existing repository at /root/Project-Kernex"
    else
        log_warning "No repository found. Please clone manually or provide GitHub username."
        exit 1
    fi
fi
echo ""

# =====================================
# Step 5: Create Environment File
# =====================================
log_step "Step 5: Creating environment configuration..."

# Generate random SECRET_KEY
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Get droplet IP
DROPLET_IP=$(hostname -I | awk '{print $1}')

read -p "Enter your domain (or press Enter for IP-only: $DROPLET_IP): " CUSTOM_DOMAIN
if [ -z "$CUSTOM_DOMAIN" ]; then
    DOMAIN=$DROPLET_IP
else
    DOMAIN=$CUSTOM_DOMAIN
fi

# Create .env file
cat > control-plane/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://kernex:kernex_pass_$(date +%s)@localhost:5432/kernex

# Security
SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=["http://$DROPLET_IP", "https://$DOMAIN"]

# API Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF

log_success "Environment file created at control-plane/.env"
echo "Generated SECRET_KEY: $SECRET_KEY"
echo ""

# =====================================
# Step 6: Setup PostgreSQL
# =====================================
log_step "Step 6: Setting up PostgreSQL database..."

DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")

docker pull postgres:15
docker run -d \
    --name kernex-db \
    -e POSTGRES_USER=kernex \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=kernex \
    -p 5432:5432 \
    -v kernex_postgres:/var/lib/postgresql/data \
    postgres:15

# Update .env with correct password
sed -i "s/kernex_pass_[0-9]*/kernex:$DB_PASSWORD/g" control-plane/.env

log_success "PostgreSQL started"
sleep 5

# Test connection
log_step "Testing database connection..."
docker run --rm \
    --network host \
    postgres:15 \
    psql -h localhost -U kernex -d kernex -c "SELECT 1" \
    -w -e PGPASSWORD=$DB_PASSWORD

log_success "Database connection verified"
echo ""

# =====================================
# Step 7: Run Migrations
# =====================================
log_step "Step 7: Running database migrations..."
cd /root/Project-Kernex/control-plane

docker run --rm \
    --env-file .env \
    --network host \
    -v $(pwd):/app \
    -w /app \
    python:3.11 bash -c "pip install -q -r requirements.txt && alembic upgrade head"

log_success "Database migrations completed"
echo ""

# =====================================
# Step 8: Build & Deploy API
# =====================================
log_step "Step 8: Building Docker image for Control Plane API..."
docker build -t kernex-api:latest .

log_success "Docker image built"
echo ""

log_step "Step 9: Starting Control Plane API container..."
docker run -d \
    --name kernex-api \
    --env-file .env \
    -p 8000:8000 \
    --network host \
    --restart unless-stopped \
    kernex-api:latest

log_success "API container started"
sleep 3

# Test API
log_step "Testing API health endpoint..."
if curl -s http://localhost:8000/health | grep -q "ok"; then
    log_success "API is healthy!"
else
    log_warning "Health check failed. Checking logs..."
    docker logs kernex-api
fi
echo ""

# =====================================
# Step 9: Install Nginx
# =====================================
log_step "Step 10: Installing Nginx reverse proxy..."
apt-get install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/kernex << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kernex /etc/nginx/sites-enabled/kernex
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

log_success "Nginx configured and started"
echo ""

# =====================================
# Step 10: Install Certbot (SSL)
# =====================================
log_step "Step 11: Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx

if [ "$DOMAIN" != "$DROPLET_IP" ]; then
    log_warning "SSL requires a valid domain. Run this when ready:"
    echo "  sudo certbot certonly --nginx -d $DOMAIN"
else
    log_warning "Using IP address. SSL not available for IP-only access."
fi
echo ""

# =====================================
# Summary
# =====================================
echo "=========================================="
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "📊 Kernex Phase 2 is now running!"
echo ""
echo "📍 Access Points:"
echo "  • API: http://$DROPLET_IP:8000"
echo "  • Metrics: http://$DROPLET_IP:8000/metrics"
echo "  • Health: http://$DROPLET_IP:8000/health"
echo ""
if [ "$DOMAIN" != "$DROPLET_IP" ]; then
    echo "🌐 With Domain ($DOMAIN):"
    echo "  • Setup DNS to point to: $DROPLET_IP"
    echo "  • Install SSL: sudo certbot certonly --nginx -d $DOMAIN"
    echo "  • Then restart Nginx: sudo systemctl restart nginx"
fi
echo ""
echo "📝 Environment File: /root/Project-Kernex/control-plane/.env"
echo "🐳 Docker Status: docker ps"
echo "📋 API Logs: docker logs kernex-api"
echo "🗄️  Database: docker logs kernex-db"
echo ""
echo "🧪 Test the API:"
echo "  curl http://$DROPLET_IP:8000/health"
echo ""
echo "✅ Next Steps:"
echo "  1. Configure your domain DNS records"
echo "  2. Setup SSL certificate with Certbot"
echo "  3. Setup monitoring (Datadog/Prometheus)"
echo "  4. Configure auto-backups"
echo ""
echo "=========================================="
echo ""

# Save credentials
cat > /root/kernex-deployment-info.txt << EOF
Kernex Deployment Information
Generated: $(date)

Droplet IP: $DROPLET_IP
Domain: $DOMAIN
Database: kernex_db (PostgreSQL 15)
API Container: kernex-api

Credentials saved for reference:
- Database User: kernex
- Database Name: kernex
- Database Password: (check .env file)
- SECRET_KEY: (check .env file)

Important Paths:
- Project: /root/Project-Kernex
- Config: /root/Project-Kernex/control-plane/.env
- Nginx: /etc/nginx/sites-available/kernex

Docker Commands:
- View API logs: docker logs kernex-api
- View DB logs: docker logs kernex-db
- Restart API: docker restart kernex-api
- Stop all: docker stop kernex-api kernex-db
- Start all: docker start kernex-db kernex-api

Status Check:
- curl http://localhost:8000/health
- curl http://localhost:8000/metrics
EOF

log_success "Deployment info saved to /root/kernex-deployment-info.txt"

echo "Done! 🚀"
