# 🚀 Fresh DigitalOcean Droplet Deployment Guide

## Overview

This guide walks you through deploying Kernex on a fresh DigitalOcean droplet. The system consists of:
- **Backend**: FastAPI Control Plane (port 8000)
- **Database**: PostgreSQL (port 5432)
- **Runtime Agent**: Device registration and heartbeat service
- **Frontend**: Deployed to Vercel (not on droplet)

---

## Prerequisites

✅ Fresh DigitalOcean Ubuntu 25.10 droplet (1GB RAM, 25GB SSD)
✅ SSH access to droplet
✅ Git installed on droplet
✅ Domain or IP address for backend API

---

## Step 1: Initial Droplet Setup

### 1.1 SSH into your droplet

```bash
ssh root@<DROPLET_IP>
```

### 1.2 Update system packages

```bash
apt-get update
apt-get upgrade -y
apt-get install -y curl git
```

### 1.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add root to docker group (to run without sudo)
usermod -aG docker root

# Verify Docker installation
docker --version
docker-compose --version
```

### 1.4 Create application directory

```bash
mkdir -p /opt/kernex
cd /opt/kernex
```

---

## Step 2: Clone Repository

```bash
# Clone the Kernex repository
git clone https://github.com/GouravMukherjee/kernex.git .

# Verify directory structure
ls -la
# Should show: control-plane/, frontend/, runtime/, infra/, docs/, etc.
```

---

## Step 3: Configure Environment

### 3.1 Copy and edit environment file

```bash
cp .env.example .env
nano .env
```

### 3.2 Update .env with production values

```env
# Database - Change to a STRONG password!
DB_PASSWORD=your_very_secure_postgres_password_here

# Environment
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS - Update with your domain
CORS_ALLOWED_ORIGINS=http://<DROPLET_IP>:8000,https://kernex-ai.vercel.app

# Control Plane URL (internal Docker network)
CONTROL_PLANE_URL=http://api:8000/api/v1

# Runtime
HEARTBEAT_INTERVAL=60

# PgAdmin (optional database GUI)
PGADMIN_EMAIL=admin@kernex.local
PGADMIN_PASSWORD=your_pgadmin_password
```

**Save the file** (Ctrl+X, Y, Enter in nano)

### 3.3 Set proper permissions

```bash
chmod 600 .env
```

---

## Step 4: Create Data Directories

```bash
# Create necessary directories for persistent data
mkdir -p control-plane/data/bundles
mkdir -p control-plane/logs
mkdir -p runtime/.kernex
mkdir -p runtime/logs
mkdir -p backups

# Set permissions
chmod 755 control-plane/data control-plane/data/bundles
chmod 755 control-plane/logs
chmod 700 runtime/.kernex
chmod 755 runtime/logs
chmod 755 backups
```

---

## Step 5: Start Services with Docker Compose

### 5.1 Build images

```bash
cd /opt/kernex
docker-compose build
```

### 5.2 Start services

```bash
# Start all services in detached mode
docker-compose up -d

# Monitor startup (Ctrl+C to exit)
docker-compose logs -f
```

### 5.3 Verify services are running

```bash
# List running containers
docker-compose ps

# Should show:
# - kernex-postgres (healthy after ~10 seconds)
# - kernex-api (healthy after ~40 seconds)
# - kernex-runtime (running)
# - kernex-pgadmin (running)
```

---

## Step 6: Verify Backend is Running

### 6.1 Check API health

```bash
# Check API health endpoint
curl http://localhost:8000/api/v1/health

# Should return: {"status":"ok"}
```

### 6.2 Check logs

```bash
# View API logs
docker-compose logs api

# View Runtime logs
docker-compose logs runtime

# View Database logs
docker-compose logs postgres
```

---

## Step 7: Test Backend-Frontend Connection

### 7.1 Update Vercel environment variable

Go to Vercel project settings:
1. Navigate to Settings → Environment Variables
2. Set/update `NEXT_PUBLIC_API_URL`:
   - For IP: `http://<DROPLET_IP>:8000/api/v1`
   - For domain: `https://api.yourdomain.com/api/v1`

### 7.2 Redeploy frontend

```bash
# In Vercel, trigger a new deployment
# Or push a commit to main branch to auto-trigger
```

### 7.3 Test connection from frontend

```bash
# Test from droplet (substitute Vercel URL)
curl -H "Origin: https://kernex-ai.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8000/api/v1/health
```

Expected CORS headers in response:
```
Access-Control-Allow-Origin: https://kernex-ai.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## Step 8: Database Access (Optional)

### 8.1 PgAdmin Web Interface

Access at: `http://<DROPLET_IP>:5050`
- Email: `admin@kernex.local`
- Password: `<PGADMIN_PASSWORD from .env>`

### 8.2 Direct PostgreSQL Connection

```bash
# Connect to database using psql
docker-compose exec postgres psql -U kernex -d kernex_db

# List tables
\dt

# Exit
\q
```

---

## Step 9: Monitoring and Maintenance

### 9.1 Monitor logs in real-time

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f runtime
```

### 9.2 Check resource usage

```bash
# Docker stats
docker stats

# System resources
free -h
df -h
```

### 9.3 Backup database

```bash
# Manual backup
docker-compose exec postgres pg_dump -U kernex kernex_db > /opt/kernex/backups/kernex_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /opt/kernex/backups/
```

---

## Step 10: Common Operations

### 10.1 Restart services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart postgres
```

### 10.2 Stop services

```bash
# Stop all services (data persists)
docker-compose stop

# Stop specific service
docker-compose stop api
```

### 10.3 Start services

```bash
# Start all services
docker-compose start

# Start specific service
docker-compose start api
```

### 10.4 View container logs

```bash
# Recent logs with timestamps
docker-compose logs --timestamps api

# Last 100 lines
docker-compose logs --tail=100 api

# Follow logs (real-time)
docker-compose logs -f api
```

---

## Troubleshooting

### Issue: Database connection failed

```bash
# Check database logs
docker-compose logs postgres

# Check API logs for connection errors
docker-compose logs api

# Verify DATABASE_URL in .env
grep DATABASE_URL .env

# Restart database
docker-compose restart postgres
docker-compose restart api
```

### Issue: API not responding

```bash
# Check if container is running
docker-compose ps api

# Check API logs
docker-compose logs api

# Check health endpoint
curl http://localhost:8000/api/v1/health

# Restart API
docker-compose restart api
```

### Issue: Frontend CORS errors

```bash
# Verify CORS_ALLOWED_ORIGINS in .env
grep CORS_ALLOWED_ORIGINS .env

# Check API security logs
docker-compose logs api | grep -i cors

# Restart API to apply new CORS settings
docker-compose restart api
```

### Issue: Runtime not connecting

```bash
# Check runtime logs
docker-compose logs runtime

# Verify CONTROL_PLANE_URL in .env
grep CONTROL_PLANE_URL .env

# Check if API is healthy first
curl http://localhost:8000/api/v1/health

# Restart runtime
docker-compose restart runtime
```

---

## Production Considerations

### Security Improvements

- [ ] Change all default passwords in `.env`
- [ ] Configure firewall rules (only allow SSH, 8000, 443)
- [ ] Set up SSL/TLS with Let's Encrypt (Nginx reverse proxy)
- [ ] Enable automatic backups in DigitalOcean
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### Performance Improvements

- [ ] Use DigitalOcean Managed PostgreSQL (instead of container)
- [ ] Add Redis for caching
- [ ] Configure Nginx reverse proxy with caching
- [ ] Set up CDN for static assets
- [ ] Monitor and optimize database queries

### High Availability

- [ ] Multi-droplet setup with load balancer
- [ ] Database replication/clustering
- [ ] Automated backup and disaster recovery
- [ ] Health monitoring and auto-recovery

---

## Useful Commands Reference

```bash
# Service management
docker-compose up -d          # Start services
docker-compose down           # Stop and remove containers
docker-compose logs -f        # Follow logs
docker-compose ps             # List services
docker-compose restart api    # Restart service

# Database operations
docker-compose exec postgres psql -U kernex -d kernex_db
docker-compose exec postgres pg_dump -U kernex kernex_db > backup.sql

# Debug
docker-compose exec api bash
docker-compose exec postgres bash
docker stats
docker images

# Cleanup
docker-compose down -v        # Remove containers and volumes
docker system prune -a        # Remove unused images/containers
```

---

## Next Steps

After deployment:

1. ✅ Verify all services are healthy
2. ✅ Test API endpoints from frontend
3. ✅ Register test devices via API
4. ✅ Verify device heartbeats in logs
5. ✅ Test bundle uploads and deployments
6. ✅ Monitor system performance
7. ✅ Set up automated backups
8. ✅ Configure monitoring and alerting

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review documentation: `docs/PRODUCTION_SETUP.md`
3. Verify environment variables: `cat .env`
4. Check system resources: `free -h`, `df -h`

---

**Last Updated**: January 19, 2026
**Version**: 1.0 - Fresh Droplet Deployment
