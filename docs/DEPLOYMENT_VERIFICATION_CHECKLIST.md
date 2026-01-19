# ✅ Deployment Verification Checklist

**Date**: January 19, 2026  
**Purpose**: Verify your Kernex production deployment is complete and working

---

## 🚀 Pre-Flight Check (Before Operations)

### Frontend (Vercel)
- [ ] Frontend URL accessible: https://kernex-ai.vercel.app
- [ ] Page loads without errors
- [ ] Dashboard displays (not showing 404 or errors)
- [ ] Navigation bar visible with menu items
- [ ] No console errors (open DevTools → Console)

### Backend (DigitalOcean)
- [ ] Can SSH to droplet: `ssh root@YOUR-IP`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Repository cloned: `ls ~/kernex`
- [ ] Docker Compose file exists: `ls ~/kernex/infra/docker-compose.yml`

### Connection Test
- [ ] Backend responds to health check: `curl http://localhost:8000/api/v1/health`
- [ ] No CORS errors in frontend console
- [ ] API calls appear in Network tab with 200 status

---

## 🎯 System Verification (Core Functionality)

### Frontend Features
- [ ] Dashboard loads with data
- [ ] Metrics cards display (Total Devices, Active Bundles, etc.)
- [ ] Charts render correctly
- [ ] Tables show data (Devices, Bundles, Deployments)
- [ ] Navigation to other pages works
- [ ] Device inspector opens when clicking rows

### Backend Services
- [ ] All Docker containers running: `docker-compose ps`
  - [ ] kernex-postgres (healthy)
  - [ ] kernex-api (up)
- [ ] Backend health check passes: `/api/v1/health`
- [ ] Database is responsive: `docker exec kernex-postgres pg_isready`
- [ ] API endpoints responding (check Network tab in browser)

### Database
- [ ] PostgreSQL container running
- [ ] Can connect to database
- [ ] Tables exist (devices, bundles, deployments, etc.)
- [ ] No permission errors in logs

---

## 🔌 Connection Verification

### CORS Configuration
- [ ] Backend CORS includes Vercel domain
- [ ] No CORS errors in console
- [ ] API requests from frontend succeed
- [ ] OPTIONS preflight requests pass

### Environment Variables
- [ ] Vercel has `NEXT_PUBLIC_API_URL` set
- [ ] Value points to correct backend
- [ ] Frontend reads correct URL in console
- [ ] Backend CORS allows frontend URL

### Network Connectivity
- [ ] Frontend can reach backend
- [ ] Test from your machine: `curl http://YOUR-DROPLET-IP:8000/api/v1/health`
- [ ] Firewall allows port 8000
- [ ] No network timeouts

---

## 📊 Data Verification

### Sample Data Present
- [ ] At least 1 device exists in database
- [ ] At least 1 bundle exists in database
- [ ] Dashboard shows non-zero metrics
- [ ] Device list not empty
- [ ] Tables show real data (not mock)

### API Endpoints Working
- [ ] `GET /api/v1/devices` returns list
- [ ] `GET /api/v1/bundles` returns list
- [ ] `GET /api/v1/deployments` returns list
- [ ] `GET /api/v1/health` returns `{"status":"ok"}`

### Frontend-Backend Data Flow
- [ ] Browser Network tab shows successful requests
- [ ] Responses contain expected JSON
- [ ] Frontend parses and displays data
- [ ] No parsing errors in console

---

## 🔐 Security Verification

### CORS
- [ ] Frontend domain in CORS allowed origins
- [ ] No wildcard `*` for origins (except in dev)
- [ ] Only necessary methods allowed
- [ ] Security headers present

### Rate Limiting
- [ ] Rate limit middleware active
- [ ] Limits set to reasonable value (60/min)
- [ ] No legitimate requests getting blocked

### Input Validation
- [ ] Security headers present:
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security

### Database Security
- [ ] Database not exposed externally
- [ ] Strong credentials set
- [ ] No default passwords
- [ ] Database in private Docker network

---

## 📈 Performance Check

### Frontend Performance
- [ ] Page loads in < 3 seconds
- [ ] No memory leaks (DevTools → Memory)
- [ ] Smooth scrolling
- [ ] No janky animations
- [ ] Charts render smoothly

### Backend Performance
- [ ] API response time < 200ms
- [ ] Database queries < 100ms
- [ ] CPU usage normal (not maxed)
- [ ] Memory usage stable (not growing)

### Network Performance
- [ ] Request/response transfer is fast
- [ ] No large payloads
- [ ] Compression enabled (gzip)
- [ ] Optimal bundle size

---

## 🔄 Deployment Verification

### Docker Setup
- [ ] Docker Compose file valid
- [ ] All images build successfully
- [ ] Containers start in correct order
- [ ] Health checks passing
- [ ] No permission errors

### Code Deployment
- [ ] Latest code pulled: `git log --oneline -1`
- [ ] No uncommitted changes: `git status`
- [ ] Backend built successfully
- [ ] No build errors in logs

### Service Restart
- [ ] Services restart cleanly
- [ ] No errors on restart
- [ ] Services come back online
- [ ] Data persists after restart

---

## 📝 Documentation Verification

### Documentation Present
- [ ] PRODUCTION_READY.md exists
- [ ] CURRENT_DEPLOYMENT_STATUS.md exists
- [ ] PRODUCTION_SETUP.md exists
- [ ] DROPLET_OPERATIONS.md exists
- [ ] DOCUMENTATION_INDEX.md exists

### Documentation Quality
- [ ] All links work
- [ ] Code examples are correct
- [ ] Commands are tested
- [ ] Information is current

### Code Changes Documented
- [ ] CORS changes documented
- [ ] Configuration documented
- [ ] Setup instructions clear
- [ ] Troubleshooting guide complete

---

## 🚨 Emergency Procedures

### Can you restart the backend?
```bash
[ ] docker-compose restart api
[ ] Container comes back up
[ ] Health check passes
```

### Can you view logs?
```bash
[ ] docker-compose logs api
[ ] Logs show no errors
[ ] Can identify issues from logs
```

### Can you access the database?
```bash
[ ] docker exec -it kernex-postgres psql -U kernex -d kernex_db
[ ] Can run SQL queries
[ ] Can see tables and data
```

### Can you backup the database?
```bash
[ ] docker exec kernex-postgres pg_dump ... > backup.sql
[ ] Backup file created
[ ] Backup contains data
```

### Can you restore from backup?
```bash
[ ] docker exec -i kernex-postgres psql ... < backup.sql
[ ] Data restores successfully
[ ] No errors during restore
```

---

## 📋 Daily Operations Check

### Morning Check (5 minutes)
- [ ] SSH to droplet
- [ ] Check containers: `docker-compose ps`
- [ ] Check logs for errors: `docker-compose logs`
- [ ] Verify frontend loads: `https://kernex-ai.vercel.app`
- [ ] Check health: `curl http://localhost:8000/api/v1/health`

### Weekly Check (15 minutes)
- [ ] Review logs for warnings
- [ ] Check resource usage: `docker stats`
- [ ] Verify all features working
- [ ] Check database size
- [ ] Review Vercel deployment status

### Monthly Check (30 minutes)
- [ ] Full system test
- [ ] Database backup
- [ ] System update: `apt update && apt upgrade`
- [ ] Docker cleanup: `docker system prune`
- [ ] Review metrics and usage patterns

---

## ✅ Sign-Off

When all checks above are complete:

- [ ] System is fully operational
- [ ] All components working
- [ ] Documentation complete
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Ready for production use

**Status**: _______________ (Date)  
**Verified By**: _______________ (Name)  
**Notes**: _______________________________________________

---

## 🔍 Troubleshooting Checklist

### If something fails, check these in order:

1. [ ] Is backend running? `docker-compose ps`
2. [ ] Are there logs/errors? `docker-compose logs`
3. [ ] Is database healthy? `docker-compose logs postgres`
4. [ ] Can you SSH to droplet?
5. [ ] Is port 8000 open? `sudo lsof -i :8000`
6. [ ] Is firewall blocking? Check DigitalOcean Console
7. [ ] Is CORS configured? Check security.py
8. [ ] Is env var set? Check Vercel Settings
9. [ ] Are containers healthy? Check docker health checks
10. [ ] Is disk space low? `df -h`

If still stuck: Read [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) troubleshooting section

---

## 📞 Quick Help

| Issue | Fix |
|-------|-----|
| Backend won't start | `docker-compose logs api \| tail -50` |
| Can't reach API | `curl http://localhost:8000/api/v1/health` |
| CORS errors | Check `NEXT_PUBLIC_API_URL` in Vercel |
| Database issues | `docker-compose logs postgres` |
| SSH fails | Use DigitalOcean Console (web terminal) |
| Port in use | `sudo lsof -i :8000 && kill -9 <PID>` |

---

**Checklist Date**: January 19, 2026  
**Valid Until**: Whenever code changes  
**Review Frequency**: Before each deployment  
**Maintenance**: Update as system evolves
