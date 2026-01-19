# Backend-Frontend Integration - Quick Reference

## 🚀 Getting Started (Copy-Paste)

### Terminal 1: Start Backend
```bash
cd control-plane
export DATABASE_URL="sqlite+aiosqlite:///./dev.db"
python -m app.main
# Wait for: Uvicorn running on http://localhost:8000
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
# Wait for: ✓ Ready in XXXms
```

### Browser
Open: `http://localhost:3000/dashboard`

**Status Check:** Open DevTools Console, you should see:
```
[API Client] Base URL: http://localhost:8000/api/v1
[API Request] GET /devices
[API Response] 200 /devices
```

## 🔌 What's Connected

```
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND PAGES & COMPONENTS                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Dashboard          →  Calls: /devices, /deployments        │
│  Devices Page       →  Calls: /devices                      │
│  Bundles Page       →  Calls: /bundles                      │
│  Deployments Page   →  Calls: /deployments                  │
│  Device Inspector   →  Calls: /devices/{id}                 │
│  Analytics Cards    →  Calls: Aggregated from all APIs      │
│  Success Rate Panel →  Calls: /deployments                  │
│  Charts             →  Calls: /deployments (7-day)          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           ↓ API Calls (Axios HTTP Client)
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND APIS                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GET  /health                   - Health check              │
│  GET  /devices                  - List all devices          │
│  GET  /devices/{device_id}      - Device details            │
│  GET  /bundles                  - List all bundles          │
│  POST /bundles                  - Upload bundle             │
│  GET  /deployments              - List deployments          │
│  POST /deployments              - Create deployment         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           ↓ SQL Queries (SQLAlchemy ORM)
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  devices table          - Device registrations              │
│  bundles table          - ML bundle versions                │
│  deployments table      - Deployment history                │
│  heartbeats table       - Device heartbeat logs             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 📊 API Endpoints Summary

| Endpoint | Method | Frontend Use | Response Time |
|----------|--------|---|---|
| `/health` | GET | Health check | <50ms |
| `/devices` | GET | Devices page, Dashboard | ~100-200ms |
| `/devices/{id}` | GET | Device inspector | ~100ms |
| `/bundles` | GET | Bundles page, Dashboard | ~100-200ms |
| `/bundles` | POST | Bundle upload form | ~500ms+ |
| `/deployments` | GET | Deployments page, Charts | ~100-200ms |
| `/deployments` | POST | Create deployment | ~200-300ms |

## 🔄 Data Flow Examples

### Example 1: Loading Dashboard
```
1. Page loads → React renders Dashboard component
2. useQuery('devices') hook executes
3. fetchDevices() function called
4. checkBackendHealth() → true (API responds)
5. fetchDevicesFromAPI() called → axios GET /devices
6. Backend returns 28 devices
7. Data mapped: backend schema → frontend schema
8. Component re-renders with live data
9. User sees "Total Devices: 28" in dashboard
```

### Example 2: Backend Unavailable
```
1. Page loads → React renders Dashboard component
2. useQuery('devices') hook executes
3. fetchDevices() function called
4. checkBackendHealth() → false (no response)
5. Catches error, falls back to mockDevices
6. Component re-renders with mock data
7. User sees "Total Devices: 5" (from mock)
8. Console shows: "API call failed, falling back to mock data"
```

## 🧪 Validation Commands

### Check Backend Health
```bash
curl http://localhost:8000/api/v1/health
# Response: {"status":"ok"}
```

### Get Device List
```bash
curl http://localhost:8000/api/v1/devices
# Response: {"devices":[...], "total":28}
```

### Browser Console Validation
```javascript
// Open DevTools F12 → Console tab
validateBackendIntegration()
// Shows detailed test report
```

## 📝 Configuration

### Environment Variables

**Development** (`.env.local`):
```bash
# Default - no need to set
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Docker** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://control-plane:8000/api/v1
```

**Production** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://api.kernex.dev/api/v1
```

## 🐛 Troubleshooting Checklist

- [ ] Backend running? `python -m app.main` in control-plane
- [ ] Backend on :8000? Check terminal output
- [ ] Frontend running? `npm run dev` in frontend
- [ ] Frontend on :3000? Check terminal output
- [ ] Can reach backend? `curl http://localhost:8000/api/v1/health`
- [ ] API URL set correct? Check `.env.local`
- [ ] DevTools show API calls? Check Network tab
- [ ] Mock data showing? Backend might be down, check console

## 💡 Tips & Tricks

### See All API Calls
1. DevTools F12 → Network tab
2. Filter: XHR/Fetch
3. Refresh page
4. See all API requests/responses

### Enable Debug Logging
Check `src/lib/api/client.ts` - logging already enabled in dev mode

### Test Specific API
```javascript
// In browser console
apiClient.get('/devices').then(r => console.log(r.data))
```

### Force Mock Data
```javascript
// In browser console
localStorage.setItem('forceBackendFail', 'true')
// Refresh page - will use mock data
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `BACKEND_INTEGRATION.md` | Detailed integration guide |
| `BACKEND_CONNECTION_SETUP.md` | Step-by-step setup instructions |
| `INTEGRATION_SUMMARY.md` | Complete implementation summary |
| `README.md` | Project overview |

## ✅ Integration Verification Checklist

- [x] Backend API running
- [x] Frontend connected to backend
- [x] Devices data showing on dashboard
- [x] Bundles data showing (if any uploaded)
- [x] Deployments data showing (if any created)
- [x] Metrics cards showing live data
- [x] Charts showing deployment history
- [x] Device inspector working
- [x] Fallback to mock data working
- [x] Error handling working
- [x] Logging visible in console

## 🎯 Next Actions

1. **Verify Connection** (5 min)
   - Start backend & frontend
   - Open dashboard
   - Check DevTools console

2. **Load Real Data** (10 min)
   - Register a device (from runtime)
   - Upload a bundle
   - Create a deployment

3. **Monitor Integration** (ongoing)
   - Watch Network tab for API calls
   - Check Console for errors
   - Use validation tool weekly

4. **Optimize** (optional)
   - Adjust refetch intervals
   - Configure cache times
   - Add filtering/pagination

## 🚨 Emergency Fixes

### "Cannot connect to backend"
```bash
# Kill and restart
cd control-plane
pkill -f "python -m app.main"
python -m app.main
```

### "Frontend showing mock data"
```bash
# Backend is down - check:
curl http://localhost:8000/api/v1/health
# If no response, restart backend
```

### "CORS errors"
Backend needs CORS enabled. Add to control-plane/app/main.py:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

**Last Updated:** January 18, 2026
**Status:** ✅ FULLY INTEGRATED
**Version:** 1.0.0

