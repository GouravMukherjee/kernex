# 📖 Kernex Documentation Index

## 🚀 Start Here

**New to the deployment?** Read these in order:

1. **[CURRENT_DEPLOYMENT_STATUS.md](./CURRENT_DEPLOYMENT_STATUS.md)** ⭐ START HERE
   - Quick overview of your setup
   - Where everything is located
   - Quick reference commands

2. **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)**
   - Complete architecture explanation
   - How frontend connects to backend
   - Environment variables
   - Troubleshooting guide

3. **[DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md)**
   - How to SSH into your droplet
   - Common Docker commands
   - How to manage the backend
   - Database operations

---

## 📋 Documentation by Topic

### Current Deployment Status
- **[CURRENT_DEPLOYMENT_STATUS.md](./CURRENT_DEPLOYMENT_STATUS.md)** - Quick reference card
- **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Full setup details
- **[SETUP_UPDATE_SUMMARY.md](./SETUP_UPDATE_SUMMARY.md)** - What changed recently

### Droplet & Backend Management
- **[DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md)** - Day-to-day droplet management
- **[control-plane/README.md](./control-plane/README.md)** - Backend development guide
- **[docs/api-spec.md](./docs/api-spec.md)** - API endpoint documentation

### Frontend
- **[frontend/HOW_TO_RUN.md](./frontend/HOW_TO_RUN.md)** - Frontend setup & running
- **[frontend/BACKEND_CONNECTION_SETUP.md](./frontend/BACKEND_CONNECTION_SETUP.md)** - Frontend-backend integration
- **[FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)** - Connection guide

### Development
- **[docs/architecture.md](./docs/architecture.md)** - System architecture
- **[docs/bundle-spec.md](./docs/bundle-spec.md)** - Bundle specifications
- **[docs/troubleshooting.md](./docs/troubleshooting.md)** - Common issues & solutions

---

## 🎯 Find What You Need

### "I want to..."

#### ...check if the backend is running
→ [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md) - "Check Backend Status" section

#### ...deploy new code to the droplet
→ [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md) - "Deploy New Changes" section

#### ...understand how frontend connects to backend
→ [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Connection Flow section

#### ...fix "Cannot reach API" error
→ [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Troubleshooting section

#### ...access the database
→ [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md) - "Database Management" section

#### ...set up a custom domain with SSL
→ [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - "Use Domain + Nginx + SSL" section

#### ...backup the database
→ [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md) - "Backup database" command

#### ...SSH into the droplet
→ [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md) - "Access Your Droplet" section

#### ...see what environment variables are needed
→ [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - "Configuration Details" section

#### ...understand the full architecture
→ [docs/architecture.md](./docs/architecture.md) - System architecture

#### ...develop the backend locally
→ [control-plane/README.md](./control-plane/README.md)

#### ...develop the frontend locally
→ [frontend/HOW_TO_RUN.md](./frontend/HOW_TO_RUN.md)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│              User's Browser                     │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ Vercel Frontend     │
        │ (Next.js)           │
        │ kernex-ai.vercel.app│
        └──────────┬──────────┘
                   │ HTTPS
        ┌──────────▼──────────────────┐
        │ DigitalOcean Droplet (SFO3) │
        │ Ubuntu 25.10 x64            │
        │ 1GB Memory / 25GB Disk      │
        ├─────────────────────────────┤
        │ • FastAPI Backend (port 8000)│
        │ • PostgreSQL Database       │
        │ • Docker Compose            │
        └─────────────────────────────┘
```

---

## 🔄 Quick Commands Reference

### Access droplet:
```bash
ssh root@YOUR-DROPLET-IP
cd ~/kernex/infra
```

### Check status:
```bash
docker-compose ps
docker-compose logs -f api
```

### Deploy changes:
```bash
git pull
docker-compose build api
docker-compose up -d api
```

### Database operations:
```bash
# Connect to database
docker exec -it kernex-postgres psql -U kernex -d kernex_db

# Backup
docker exec kernex-postgres pg_dump -U kernex -d kernex_db > backup.sql

# Restore
docker exec -i kernex-postgres psql -U kernex -d kernex_db < backup.sql
```

---

## 📊 Current Status

| Component | Status | Location |
|-----------|--------|----------|
| Frontend | ✅ Live | https://kernex-ai.vercel.app |
| Backend | ✅ Running | DO Droplet (port 8000) |
| Database | ✅ Running | DO Droplet (Docker) |
| CORS | ✅ Configured | Allows Vercel domain |
| SSL/TLS | ⚠️ Optional | Use Nginx + Let's Encrypt |

---

## 🆘 Troubleshooting Quick Links

| Issue | Link |
|-------|------|
| Backend down | [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md#-if-backend-is-down) |
| Can't reach API | [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md#troubleshooting) |
| Frontend errors | [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md) |
| Database issues | [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md#-database-management) |
| CORS errors | [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md#issue-cors-errors-in-console) |

---

## 📚 File Organization

```
Project Root/
├── CURRENT_DEPLOYMENT_STATUS.md       ⭐ Quick reference
├── PRODUCTION_SETUP.md                📋 Full setup guide
├── DROPLET_OPERATIONS.md              🔧 Daily management
├── SETUP_UPDATE_SUMMARY.md            ✅ What changed
│
├── control-plane/                     🐍 Backend (Python/FastAPI)
│   ├── README.md
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── main.py
│       ├── security.py                ← CORS configuration here
│       └── api/
│
├── frontend/                          ⚛️ Frontend (Next.js)
│   ├── HOW_TO_RUN.md
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       └── lib/
│           └── api/
│               └── client.ts          ← API connection here
│
├── infra/                             🐳 Docker & Infrastructure
│   ├── docker-compose.yml             ← Main deployment config
│   └── terraform/                     ← IaC (optional)
│
└── docs/                              📖 Additional documentation
    ├── architecture.md
    ├── api-spec.md
    ├── bundle-spec.md
    └── troubleshooting.md
```

---

## 🔐 Environment Variables Summary

### Backend (DigitalOcean Droplet)
```
FRONTEND_URL=https://kernex-ai.vercel.app
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...
BUNDLE_STORAGE_PATH=/data/bundles
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.kernex.dev/api/v1
# OR: http://YOUR-DROPLET-IP:8000/api/v1
```

---

## 🎓 Learning Paths

### Backend Developer
1. [control-plane/README.md](./control-plane/README.md)
2. [docs/api-spec.md](./docs/api-spec.md)
3. [docs/architecture.md](./docs/architecture.md)
4. [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md)

### Frontend Developer
1. [frontend/HOW_TO_RUN.md](./frontend/HOW_TO_RUN.md)
2. [frontend/BACKEND_CONNECTION_SETUP.md](./frontend/BACKEND_CONNECTION_SETUP.md)
3. [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
4. [docs/api-spec.md](./docs/api-spec.md)

### DevOps/System Admin
1. [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
2. [DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md)
3. [docs/deployment-guide.md](./docs/deployment-guide.md)
4. [infra/docker-compose.yml](./infra/docker-compose.yml)

### Troubleshooting
1. [CURRENT_DEPLOYMENT_STATUS.md](./CURRENT_DEPLOYMENT_STATUS.md) - Quick fixes
2. [docs/troubleshooting.md](./docs/troubleshooting.md) - Common issues
3. [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) - Detailed troubleshooting

---

## 📞 Support Resources

- **DigitalOcean Support**: https://www.digitalocean.com/support
- **Vercel Support**: https://vercel.com/support
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com/

---

## ✅ Setup Checklist

Use this to verify your deployment is complete:

- [ ] Backend running on DigitalOcean droplet
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel environment variables
- [ ] Backend CORS allows Vercel domain
- [ ] Frontend can successfully fetch data from backend
- [ ] Dashboard displays live metrics
- [ ] Devices page shows real devices
- [ ] Bundles page shows real bundles
- [ ] Deployments page shows real deployments

---

**Last Updated**: January 19, 2026  
**Documentation Version**: 2.0 (Current)  
**Status**: ✅ Production Ready
