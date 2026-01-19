# DigitalOcean Droplet - Quick Setup Guide

**Your Current Setup**: Kernex backend running on DO droplet, Frontend on Vercel

---

## 🎯 What You Need to Know

1. **Droplet Details** (from image):
   - Memory: 1GB
   - Disk: 25GB
   - OS: Ubuntu 25.10 x64
   - Region: SFO3 (San Francisco)
   - Cost: ~$6/month

2. **Services Running**:
   - PostgreSQL database (Docker)
   - FastAPI backend (Docker)
   - Docker Compose orchestration

3. **Frontend**: Deployed to Vercel at https://kernex-ai.vercel.app

---

## 📍 Access Your Droplet

### SSH into the droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Replace `YOUR_DROPLET_IP` with the IP shown in DigitalOcean Console.

---

## 🔍 Check Backend Status

### See if everything is running:
```bash
cd ~/kernex/infra
docker-compose ps
```

**Expected output**:
```
NAME                COMMAND                  SERVICE      STATUS
kernex-postgres     "docker-entrypoint.s…"   postgres     Up 2 minutes (healthy)
kernex-api          "uvicorn app.main:app"   api          Up 2 minutes
```

### Test backend health:
```bash
curl http://localhost:8000/api/v1/health
```

**Expected response**:
```json
{"status":"ok"}
```

---

## 🔧 If Backend is Down

### 1. Check logs:
```bash
docker-compose logs api | tail -50
```

### 2. Restart backend:
```bash
docker-compose restart api
```

### 3. Restart everything:
```bash
docker-compose down
docker-compose up -d
```

### 4. View running containers:
```bash
docker ps
```

---

## 📤 Deploy New Changes

### After pushing code to GitHub:

```bash
cd ~/kernex

# 1. Pull latest code
git pull origin main

# 2. Rebuild backend image
cd infra
docker-compose build api

# 3. Restart with new image
docker-compose up -d api

# 4. Verify it's running
docker-compose ps

# 5. Check logs
docker-compose logs -f api
```

---

## 🗄️ Database Management

### Connect to database directly:
```bash
docker exec -it kernex-postgres psql -U kernex -d kernex_db
```

### Common database commands:
```sql
-- List all tables
\dt

-- List users
SELECT * FROM device;

-- List bundles
SELECT * FROM bundle;

-- List deployments
SELECT * FROM deployment;

-- Exit
\q
```

### Backup database:
```bash
docker exec kernex-postgres pg_dump -U kernex -d kernex_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from backup:
```bash
docker exec -i kernex-postgres psql -U kernex -d kernex_db < backup_20260119_120000.sql
```

---

## 🌐 Frontend Connection

### Frontend is deployed to Vercel
- **URL**: https://kernex-ai.vercel.app
- **API Endpoint**: https://api.kernex.dev/api/v1 (or your droplet IP)
- **Environment Variable**: `NEXT_PUBLIC_API_URL`

### If frontend can't reach backend:

1. **Check backend is accessible from internet**:
   ```bash
   # From your local machine (not SSH)
   curl http://YOUR_DROPLET_IP:8000/api/v1/health
   ```

2. **Check firewall allows port 8000**:
   - Go to DigitalOcean Console
   - Click on your Droplet
   - Go to **Networking** tab
   - Check that port 8000 is not blocked

3. **Update Vercel environment variable** if needed:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your backend URL

4. **Verify CORS is configured**:
   - Backend allows requests from: https://kernex-ai.vercel.app
   - (Already configured in `control-plane/app/security.py`)

---

## 🚀 Advanced: Use Domain + Nginx + SSL

### Why do this?
- Professional domain instead of IP address
- HTTPS encryption
- Better security
- Easier to remember

### Quick setup (5 minutes):

```bash
# 1. Install Nginx and Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx config
sudo tee /etc/nginx/sites-available/kernex-api > /dev/null <<EOF
server {
    listen 80;
    server_name api.kernex.dev;  # Change to your domain
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name api.kernex.dev;  # Change to your domain

    ssl_certificate /etc/letsencrypt/live/api.kernex.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kernex.dev/privkey.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
    }
}
EOF

# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/kernex-api /etc/nginx/sites-enabled/

# 4. Test Nginx config
sudo nginx -t

# 5. Get SSL certificate (requires DNS to point to this droplet)
sudo certbot --nginx -d api.kernex.dev

# 6. Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 7. Test it
curl https://api.kernex.dev/api/v1/health
```

### Then update Vercel:
```
NEXT_PUBLIC_API_URL = https://api.kernex.dev/api/v1
```

---

## 📊 Monitoring

### View real-time logs:
```bash
docker-compose logs -f api
```

### View backend resource usage:
```bash
docker stats kernex-api
```

### Check droplet health from DigitalOcean Console:
1. Log into https://cloud.digitalocean.com
2. Click your droplet name
3. See CPU, Memory, Disk usage graphs

---

## 🆘 Emergency Commands

### If backend is crashing repeatedly:

```bash
# 1. Stop everything
docker-compose down

# 2. Check database
docker-compose up -d postgres
docker-compose logs postgres

# 3. Restart backend
docker-compose up -d api
docker-compose logs -f api
```

### If port 8000 is already in use:

```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Restart backend
docker-compose restart api
```

### If running out of disk space:

```bash
# Check disk usage
df -h

# Clean up old Docker images/containers
docker system prune -a --volumes

# Check database size
docker exec kernex-postgres du -sh /var/lib/postgresql/data
```

---

## 📋 Maintenance Schedule

### Daily:
- Monitor droplet metrics (DigitalOcean Console)
- Check backend logs if there are issues

### Weekly:
- Backup database: `docker exec kernex-postgres pg_dump -U kernex -d kernex_db > backup.sql`

### Monthly:
- Update system: `sudo apt update && sudo apt upgrade -y`
- Update Docker images: `docker-compose pull && docker-compose up -d`

---

## 🔐 Security Best Practices

### 1. Keep system updated:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Use firewall (optional):
```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP
sudo ufw allow 80

# Allow HTTPS
sudo ufw allow 443

# Allow API port
sudo ufw allow 8000

# Enable firewall
sudo ufw enable
```

### 3. Use strong passwords:
- Database password (already set in docker-compose.yml)
- SSH key authentication (recommended)

### 4. Keep secrets safe:
- Don't commit API keys to git
- Use environment variables for sensitive data
- Rotate credentials regularly

---

## 📞 Quick Support

### Can't SSH to droplet?
- Check IP address in DigitalOcean Console
- Check SSH key is added to droplet
- Check firewall allows port 22

### Backend won't start?
1. `docker-compose logs api` - view error message
2. Check database is healthy: `docker-compose ps postgres`
3. Check port 8000 is available: `sudo lsof -i :8000`

### Frontend can't reach backend?
1. `curl http://YOUR_DROPLET_IP:8000/api/v1/health` - test from your machine
2. Check CORS allows Vercel: `https://kernex-ai.vercel.app`
3. Check firewall allows inbound on port 8000

### Frontend shows "localhost" API URL?
- This means env var isn't set correctly in Vercel
- Go to Vercel Dashboard → Settings → Environment Variables
- Verify `NEXT_PUBLIC_API_URL` is set and redeploy

---

## 📚 Related Files

- [Production Setup Guide](./PRODUCTION_SETUP.md) - Full architecture overview
- [Backend Connection Guide](./FRONTEND_BACKEND_CONNECTION.md) - How frontend connects
- [Backend Docs](./control-plane/README.md) - Backend development

---

**Last Updated**: January 19, 2026  
**Setup**: DO Droplet + Vercel ✅
