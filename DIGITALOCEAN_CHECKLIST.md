# DigitalOcean Deployment Checklist

## Pre-Deployment ✅

- [ ] GitHub Student Developer Pack verified
- [ ] $200 DigitalOcean credit activated
- [ ] Project Kernex cloned locally
- [ ] All Phase 2 tests passing (23/23)
- [ ] Environment variables documented

## Deployment Steps

### Step 1: DigitalOcean Setup
- [ ] Claim $200 credit from GitHub Pack
- [ ] Create DigitalOcean account
- [ ] Activate promo code
- [ ] Create Docker Droplet ($6.99/mo)
- [ ] Save SSH private key securely
- [ ] Get Droplet IP address

### Step 2: SSH & Environment
- [ ] SSH into Droplet successfully
- [ ] Git clone project
- [ ] Create `.env` file with credentials
- [ ] Set SECRET_KEY (random 32+ chars)
- [ ] Set DATABASE_URL for PostgreSQL
- [ ] Set CORS_ORIGINS

### Step 3: Database Setup
- [ ] Pull PostgreSQL image
- [ ] Run PostgreSQL container
- [ ] Verify DB is running (`docker ps`)
- [ ] Test connection
- [ ] Run Alembic migrations (`alembic upgrade head`)

### Step 4: Deploy API
- [ ] Build Docker image for control-plane
- [ ] Run API container
- [ ] Verify API is running (`docker ps`)
- [ ] Check logs (`docker logs kernex-api`)
- [ ] Test health endpoint (`curl http://IP:8000/health`)

### Step 5: Testing
- [ ] Health check works (`/health` returns `{"status":"ok"}`)
- [ ] Metrics endpoint works (`/metrics` returns Prometheus format)
- [ ] Register user works (`POST /api/v1/auth/register`)
- [ ] Login works (`POST /api/v1/auth/login`)
- [ ] Get current user works (`GET /api/v1/auth/me`)
- [ ] Rate limiting works (60 req/min)

### Step 6: Domain & SSL
- [ ] Domain registered (Namecheap, GoDaddy, etc.)
- [ ] Add domain in DigitalOcean (Networking → Domains)
- [ ] Update nameservers to DigitalOcean
- [ ] Install Certbot for SSL
- [ ] Generate SSL certificate (`certbot certonly --standalone`)
- [ ] Certificate auto-renewal configured

### Step 7: Reverse Proxy (Nginx)
- [ ] Install Nginx
- [ ] Configure `/etc/nginx/sites-available/kernex`
- [ ] Enable site (symlink to sites-enabled)
- [ ] Test Nginx config (`nginx -t`)
- [ ] Restart Nginx
- [ ] Test domain access (should work with HTTPS)

### Step 8: Auto-Restart
- [ ] Create systemd service for kernex-api
- [ ] Enable service (`systemctl enable`)
- [ ] Verify auto-restart works
- [ ] Test crash recovery

### Step 9: Monitoring
- [ ] Datadog account created (GitHub Pack)
- [ ] Datadog agent installed
- [ ] Configured to scrape `/metrics`
- [ ] OR Prometheus running at `http://IP:9090`
- [ ] Verify metrics being collected

### Step 10: Final Validation
- [ ] API responds at `https://your-domain.com/health`
- [ ] Metrics available at `https://your-domain.com/metrics`
- [ ] Auth endpoints working
- [ ] Database connected
- [ ] SSL certificate valid
- [ ] Auto-restart verified

## Post-Deployment

### Week 1: Monitor
- [ ] Check logs daily for errors
- [ ] Verify metrics being collected
- [ ] Test device registration (backward compatibility)
- [ ] Monitor error rates (should be ~0%)

### Week 2: Optimize
- [ ] Setup log aggregation
- [ ] Configure alerting thresholds
- [ ] Enable DigitalOcean automated backups
- [ ] Document runbooks

### Week 3: Plan Phase 3
- [ ] Review production metrics
- [ ] Plan advanced authorization features
- [ ] Start Phase 3 development

## Production Checklist

- [ ] SECRET_KEY is strong (32+ chars, random)
- [ ] DATABASE_URL uses strong password
- [ ] CORS_ORIGINS restricted to your domain
- [ ] SSH key stored securely
- [ ] Auto-backups enabled
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Runbooks documented
- [ ] Team has access to Droplet

## Cost Verification

- [ ] $6.99/month Droplet selected
- [ ] PostgreSQL included (no extra cost)
- [ ] $200 credit applied
- [ ] Verify billing shows credit balance
- [ ] Set up payment method for after credits expire

---

## Quick Reference

**Droplet IP**: `___________________`

**Domain**: `___________________`

**SSH Command**: `ssh -i ~/path/to/key.pem root@YOUR_IP`

**API Endpoint**: `https://your-domain.com/api/v1`

**Metrics**: `https://your-domain.com/metrics`

**Datadog Dashboard**: `https://app.datadoghq.com`

---

## Timeline

| Step | Time | Cumulative |
|------|------|-----------|
| Setup DO Account | 5 min | 5 min |
| Create Droplet | 5 min | 10 min |
| SSH & Clone | 5 min | 15 min |
| Setup DB + API | 10 min | 25 min |
| Test | 5 min | 30 min |
| Domain Setup | 5 min | 35 min |
| SSL + Nginx | 5 min | 40 min |
| Monitoring | 5 min | 45 min |

**Total Time**: ~45 minutes

---

## Success Criteria

✅ All boxes above checked  
✅ API responding at `https://your-domain.com/health`  
✅ All tests passing in production  
✅ Monitoring active  
✅ Zero errors in logs  
✅ Cost: $0 (covered by credit)  

**Status**: READY FOR DEPLOYMENT 🚀
