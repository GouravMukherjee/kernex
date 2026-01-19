# 🎯 Kernex Current Deployment - Quick Reference

## Where Everything Is

| Component | Location | URL | Status |
|-----------|----------|-----|--------|
| **Frontend** | Vercel | https://kernex-ai.vercel.app | ✅ Live |
| **Backend API** | DO Droplet (SFO3) | http://YOUR-DROPLET-IP:8000/api/v1 | ✅ Running |
| **Database** | DO Droplet (Docker) | Internal port 5432 | ✅ Running |

---

## 🚀 Start Using

### Access the frontend
```
https://kernex-ai.vercel.app
```

### Check backend health
```bash
curl http://YOUR-DROPLET-IP:8000/api/v1/health
# Response: {"status":"ok"}
```

---

## 🔧 Access Droplet (SSH)

```bash
ssh root@YOUR-DROPLET-IP
cd ~/kernex/infra
```

---

## 📊 Monitor Backend

```bash
# View logs
docker-compose logs -f api

# Check status
docker-compose ps

# Restart
docker-compose restart api
```

---

## 🔌 Connection Architecture

```
User Browser
  ↓ (visits)
Vercel (kernex-ai.vercel.app)
  ↓ (API calls via NEXT_PUBLIC_API_URL)
Backend (DO Droplet port 8000)
  ↓ (queries)
PostgreSQL Database
```

---

## ⚡ Common Tasks

### Update backend code:
```bash
git pull origin main
cd infra
docker-compose build api
docker-compose up -d api
```

### Backup database:
```bash
docker exec kernex-postgres pg_dump -U kernex -d kernex_db > backup.sql
```

### View database:
```bash
docker exec -it kernex-postgres psql -U kernex -d kernex_db
```

### Check what's running:
```bash
docker ps
docker-compose ps
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend down | `docker-compose restart api` |
| Can't reach API | Check firewall allows port 8000 |
| Frontend shows errors | Check `NEXT_PUBLIC_API_URL` in Vercel env vars |
| Database issues | `docker-compose logs postgres` |
| Out of disk space | `docker system prune -a --volumes` |

---

## 📚 Read These First

1. **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Full architecture & setup
2. **[DROPLET_OPERATIONS.md](./DROPLET_OPERATIONS.md)** - How to manage the droplet
3. **[FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)** - Connection details

---

## 🆘 Help

**Backend won't start?**
```bash
docker-compose logs api | tail -50
```

**Frontend can't connect?**
```bash
# Check from your machine (not droplet)
curl http://YOUR-DROPLET-IP:8000/api/v1/health
```

**Lost SSH access?**
- Use DigitalOcean Console → Droplet → Access → Console

---

**Last Updated**: January 19, 2026  
**Status**: ✅ Production Deployment Active
