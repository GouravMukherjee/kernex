# Railway.app Deployment Guide

**Status**: Ready to deploy Kernex to Railway.app (FREE tier)  
**Platform**: Railway.app (GitHub Student Developer Pack)  
**Cost**: $0/month (free tier) → $5/month if usage exceeds

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- GitHub account
- GitHub Student Developer Pack verified (https://education.github.com/pack)
- Railway account (https://railway.app)

### Step 1: Create Railway Project

1. Go to https://railway.app and sign in with GitHub
2. Click **"Create new project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your repos
5. Select the **kernex** repository

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click **"+ Add"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically provision a free PostgreSQL instance
4. Copy the database URL (shown in the database plugin)

### Step 3: Configure Environment Variables

In Railway, go to **Variables** and add:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
ENVIRONMENT=production
APP_NAME=Kernex Control Plane
API_PREFIX=/api/v1
BUNDLE_STORAGE_PATH=/data/bundles
```

The `DATABASE_URL` is automatically set by Railway's PostgreSQL plugin.

### Step 4: Deploy

1. Railway automatically deploys when you push to main branch
2. Check deployment status in Railway dashboard
3. Access your API at `https://kernex-api.railway.app`

---

## 📋 Detailed Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add -A
git commit -m "Production deployment: Docker + Alembic migrations"
git push origin main
```

### Step 2: Create Railway Project

```
1. Go to https://railway.app/dashboard
2. Click "Create" → "New Project"
3. Select "GitHub" as source
4. Search for "kernex" repository
5. Connect the repository
```

### Step 3: Add Services

#### PostgreSQL Database
```
1. Click "Add a Database"
2. Select "PostgreSQL"
3. Railway creates database automatically
4. Note the DATABASE_URL
```

#### Control Plane API Service

Railway will auto-detect the Dockerfile and deploy it. To customize:

```
1. Go to Project Settings
2. Set Root Directory to `./control-plane`
3. Set Dockerfile location to `./Dockerfile`
4. Set Start Command to: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
```

#### Frontend Service (Optional)

For frontend deployment:
```
1. Add another service
2. Root Directory: `./frontend`
3. Dockerfile: `./Dockerfile`
4. Set NEXT_PUBLIC_API_URL environment variable
```

### Step 4: Run Database Migrations

After deployment, run migrations:

```bash
# SSH into Railway container
railway run bash

# Run Alembic migrations
alembic upgrade head

# Exit
exit
```

Or add to startup script in Railway:

```
# Create railway.json
{
  "build": {
    "builder": "dockerfile",
    "context": "./control-plane"
  },
  "start": "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
}
```

### Step 5: Verify Deployment

```bash
# Check API is running
curl https://kernex-api.railway.app/health
# Response: {"status":"ok"}

# Check API endpoints
curl https://kernex-api.railway.app/api/v1/health
```

---

## 🔧 Configuration Files Needed

### `railway.json` (optional, for advanced config)

Create at project root:

```json
{
  "version": 1,
  "build": {
    "builder": "dockerfile",
    "context": "./control-plane"
  },
  "variables": {
    "ENVIRONMENT": "production",
    "APP_NAME": "Kernex Control Plane"
  },
  "hooks": {
    "startup": "alembic upgrade head"
  }
}
```

### `Procfile` (alternative to Dockerfile)

If using Railway with Procfile instead of Docker:

```procfile
web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 📦 Deployment Architecture on Railway

```
┌─────────────────────────────────────┐
│         Railway Dashboard           │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐   │
│  │  Control Plane API Service   │   │
│  │  (Python 3.11 + FastAPI)     │   │
│  │  Port: $PORT (auto-assigned)  │   │
│  └──────────────────────────────┘   │
│           ↓                         │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Database        │   │
│  │   (Automatic backups)        │   │
│  │   5GB free storage           │   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🌐 Custom Domain Setup

1. Get free `.me` domain from GitHub Student Pack (Namecheap)
2. In Railway, go to **Settings** → **Domain**
3. Add custom domain: `api.yourdomain.me`
4. Follow DNS configuration instructions

---

## 📊 Monitoring on Railway

Railway includes built-in:
- ✅ Deployment logs
- ✅ CPU/Memory metrics
- ✅ HTTP request logs
- ✅ Error tracking

View in Railway dashboard under **Monitoring** tab.

---

## 🚨 Troubleshooting

### Deployment fails: "Dockerfile not found"
```
Solution: Ensure Dockerfile is in control-plane directory
Check: control-plane/Dockerfile exists
```

### Database connection error
```
Solution: Verify DATABASE_URL is set correctly
Command: railway logs
```

### Port binding error
```
Solution: Use $PORT environment variable (Railway auto-sets)
Wrong: --port 8000
Right: --port $PORT
```

### Migrations not running
```
Solution: Add migration command to startup
Modify: Start command in Railway settings
Add: alembic upgrade head &&
```

---

## 📈 Scaling & Performance

### Free Tier Limits (Generous!)
- **Compute**: Shared CPU-1x, 256MB RAM (sufficient for MVP)
- **Database**: PostgreSQL with 5GB storage
- **Bandwidth**: Unlimited
- **Cost**: Free until 500 hours/month ($5/month after)

### Upgrade Path (when growing)
```
Free Tier     → Basic Tier    → Pro Tier
─────────────────────────────────────────
256MB RAM      → 512MB RAM    → 2GB+ RAM
Shared CPU    → Dedicated CPU → High CPU
5GB DB        → 20GB+ DB     → Custom
$0/mo         → $5/mo        → $20+/mo
```

### Optimization Tips
1. Use async/await (already done ✅)
2. Connection pooling on PostgreSQL (add pgbouncer if needed)
3. Caching layer (add Redis if needed)
4. Database query optimization (add indexes)

---

## 🔐 Security Checklist

- [ ] HTTPS enforced (Railway auto-provides)
- [ ] Environment variables for secrets ✅
- [ ] Database password set ✅
- [ ] API authentication implemented (next step)
- [ ] Rate limiting configured (next step)
- [ ] CORS properly configured ✅
- [ ] SQL injection protection (SQLAlchemy ORM) ✅

---

## 📝 Environment Variables Reference

### Required
- `DATABASE_URL`: PostgreSQL connection string

### Optional
- `ENVIRONMENT`: development/production
- `APP_NAME`: API title
- `API_PREFIX`: API route prefix (default: `/api/v1`)
- `BUNDLE_STORAGE_PATH`: Where to store bundles (use Railway volume)

### Example .env
```env
DATABASE_URL=postgresql://user:password@host:5432/kernex_db
ENVIRONMENT=production
APP_NAME=Kernex Control Plane
API_PREFIX=/api/v1
BUNDLE_STORAGE_PATH=/data/bundles
```

---

## 🚀 Next Steps After Deployment

1. **Setup Health Checks**
   - Configure Railway health check to `/health`
   - Set timeout to 30 seconds

2. **Enable Automatic Restarts**
   - Railway auto-restarts failed services

3. **Setup Monitoring Alerts**
   - Monitor deployment logs
   - Alert on deployment failures

4. **Database Backups**
   - Railway auto-backs up PostgreSQL daily
   - Retention: 7 days

5. **Add Frontend**
   - Deploy frontend to Railway second service
   - Set NEXT_PUBLIC_API_URL to your API domain

---

## 💡 Tips for Students

1. **Always use GitHub Student Pack benefits** (free tier)
2. **Monitor your usage** (https://railway.app/account/billing)
3. **Keep free tier as long as possible** (500 hrs/mo is a lot!)
4. **Scale to paid when needed**, not before
5. **Document your infrastructure decisions** (great for portfolio!)

---

## 📞 Support & Resources

- Railway Docs: https://docs.railway.app
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- PostgreSQL + Railway: https://docs.railway.app/databases/postgresql
- GitHub Student Pack: https://education.github.com/pack

---

## ✅ Deployment Checklist

- [ ] All tests passing (23/23 ✅)
- [ ] Dockerfile created ✅
- [ ] Alembic migrations setup ✅
- [ ] Requirements.txt updated ✅
- [ ] GitHub repo ready
- [ ] Railway account created
- [ ] PostgreSQL provisioned
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Health check verified
- [ ] Database migrations ran
- [ ] API endpoints tested
- [ ] Custom domain configured
- [ ] Monitoring enabled

---

**Estimated Time to Deploy**: 15-20 minutes  
**Cost**: FREE (GitHub Student Developer Pack)  
**Status**: Ready to deploy! 🚀
