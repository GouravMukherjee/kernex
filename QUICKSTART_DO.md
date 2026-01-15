# 🚀 Quick Start: Deploy Kernex to DigitalOcean

## In 3 Steps (45 minutes)

### Step 1️⃣ Activate Credit & Create Droplet (10 min)

```bash
1. Go to education.github.com
2. Find "DigitalOcean" → Click "Get access"
3. Sign in with GitHub
4. Copy your $200 credit code
5. Go to DigitalOcean.com → Sign up
6. Billing → Promo Code → Enter code
7. Create Droplet → Docker image → $6.99/mo plan
8. Copy Droplet IP address
```

**You now have**: Droplet running with Docker pre-installed

---

### Step 2️⃣ SSH & Deploy (5 min)

```bash
# On your local machine:
ssh -i ~/path/to/do_key.pem root@YOUR_DROPLET_IP

# In the Droplet terminal:
cd /root
git clone https://github.com/YOUR_USERNAME/Project-Kernex.git
cd Project-Kernex

# Run deployment script (automated)
bash deploy.sh

# Follow prompts:
# - Enter GitHub username (or skip if already cloned)
# - Enter domain (or press Enter for IP-only)
# Script will:
#   ✅ Setup PostgreSQL
#   ✅ Build Docker images
#   ✅ Start API
#   ✅ Configure Nginx
#   ✅ Generate SSL (when domain ready)
```

**Done!** Your API is running.

---

### Step 3️⃣ Test & Configure (10 min)

```bash
# Test from local machine:
curl http://YOUR_DROPLET_IP:8000/health
# Should return: {"status":"ok"}

# Register a user:
curl -X POST http://YOUR_DROPLET_IP:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Configure domain (optional):
1. Go to your domain registrar
2. Point DNS to DigitalOcean nameservers
3. In Droplet: sudo certbot certonly --nginx -d your-domain.com
4. Restart Nginx: sudo systemctl restart nginx
```

---

## ✅ What You Get

| Item | Status | Access |
|------|--------|--------|
| **API** | ✅ Running | `http://YOUR_IP:8000` |
| **Database** | ✅ PostgreSQL | Included in Droplet |
| **Auth** | ✅ JWT Ready | `/api/v1/auth/*` |
| **Metrics** | ✅ Prometheus | `/metrics` |
| **Health** | ✅ Check | `/health` |
| **Cost** | ✅ FREE | $200 credit |

---

## 📋 Quick Command Reference

```bash
# SSH into Droplet
ssh -i ~/key.pem root@YOUR_IP

# Check running containers
docker ps

# View API logs
docker logs kernex-api

# View database logs
docker logs kernex-db

# Restart API
docker restart kernex-api

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/metrics
curl http://localhost:8000/api/v1/auth/register

# Stop everything
docker stop kernex-api kernex-db

# Start everything
docker start kernex-db kernex-api
```

---

## 🔧 Common Issues

### "Connection refused"
- API might still be starting (wait 5 seconds)
- Check logs: `docker logs kernex-api`

### "Database error"
- Check PostgreSQL: `docker logs kernex-db`
- Ensure `.env` has correct DATABASE_URL

### "Domain not resolving"
- DNS takes 24-48 hours to propagate
- Check: `dig your-domain.com`

### "SSL certificate error"
- Wait for DNS to propagate first
- Then: `sudo certbot certonly --nginx -d your-domain.com`

---

## 📊 Cost Breakdown

| Item | Cost |
|------|------|
| Droplet ($6.99/mo) | $0 (covered by $200 credit) |
| PostgreSQL | $0 (included in Droplet) |
| SSL Certificate | $0 (Let's Encrypt free) |
| Domain (optional) | $10-15/year |
| **Year 1 Total** | **$0-15** |
| **Year 2+** | **~$85/year** |

---

## 🎯 Next Steps

After deployment:

1. **Monitor**: Setup Datadog/Prometheus
2. **Backups**: Enable DigitalOcean automated backups
3. **Logging**: Configure log aggregation
4. **Alerts**: Setup error/performance alerts
5. **Frontend**: Deploy Next.js frontend (Phase 3)

---

## 📚 Detailed Guides

- Full guide: [DIGITALOCEAN_DEPLOYMENT.md](./docs/DIGITALOCEAN_DEPLOYMENT.md)
- Checklist: [DIGITALOCEAN_CHECKLIST.md](./DIGITALOCEAN_CHECKLIST.md)
- Phase 2 info: [PHASE2_COMPLETE.md](./docs/PHASE2_COMPLETE.md)

---

## 💡 Pro Tips

✅ **Save your Droplet IP** somewhere safe
✅ **Keep .env file secure** (don't commit to Git)
✅ **Use a strong domain** for production
✅ **Enable auto-backups** immediately
✅ **Monitor metrics** regularly
✅ **Set up alerts** for errors

---

## 🎉 You're Done!

**Kernex Phase 2 is now LIVE! 🚀**

API endpoint: `http://YOUR_DROPLET_IP:8000`  
Health check: `http://YOUR_DROPLET_IP:8000/health`  
Cost: **FREE** for 1 year!

---

**Need help?** See detailed deployment guide: [DIGITALOCEAN_DEPLOYMENT.md](./docs/DIGITALOCEAN_DEPLOYMENT.md)
