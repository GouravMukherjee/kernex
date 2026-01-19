# Complete Backend-Frontend Connection Guide

## Quick Start (5 minutes)

### Step 1: Start the Backend
```bash
cd control-plane
export DATABASE_URL="sqlite+aiosqlite:///./dev.db"
python -m app.main
```

Expected output:
```
✓ Starting...
✓ Ready in XXXms
Uvicorn running on http://localhost:8000
```

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
✓ Ready in XXXms
Local: http://localhost:3000
```

### Step 3: Verify Connection
1. Open http://localhost:3000/dashboard
2. Open DevTools (F12) → Console tab
3. You should see:
   ```
   [API Client] Base URL: http://localhost:8000/api/v1
   [API Request] GET /devices
   [API Response] 200 /devices
   ```

4. If you see API calls, **connection is working!** ✅

## Component-by-Component Integration

### Dashboard Page (`src/app/(app)/dashboard/page.tsx`)
```typescript
// Data sources:
// 1. Metrics: useQuery(['metrics']) → fetchMetrics()
// 2. Chart: useQuery(['chartData']) → fetchChartData()
// 3. Success Rate: useQuery(['successRate']) → fetchSuccessRate()
// 4. Devices: useQuery(['devices']) → fetchDevices()
// 5. Deployments: useQuery(['deployments']) → fetchDeployments()

// Each query tries backend first, falls back to mock data
```

**What it shows:**
- Total Devices (from `/devices` count)
- Active Bundles (from `/bundles` count)
- Deployments 24h (filtered from `/deployments`)
- Avg Rollback Time (calculated metric)
- 7-day deployment chart (aggregated from `/deployments`)
- Success rate panel (calculated from deployments)
- Recent devices table (latest 5 from `/devices`)
- Deployment success trend (from `/deployments`)

### Devices Page (`src/app/(app)/devices/page.tsx`)
```typescript
// Data source: useQuery(['devices']) → fetchDevices()
// Calls: GET /devices
// Shows: Live device list with status, version, location
// Click device → Opens inspector with details
```

### Bundles Page (`src/app/(app)/bundles/page.tsx`)
```typescript
// Data source: useQuery(['bundles']) → fetchBundles()
// Calls: GET /bundles
// Shows: All uploaded bundles with versions and deployment count
```

### Deployments Page (`src/app/(app)/deployments/page.tsx`)
```typescript
// Data source: useQuery(['deployments']) → fetchDeployments()
// Calls: GET /deployments
// Shows: Deployment history with status, targets, success rate
```

## Environment Configuration

### Development Setup

Create `frontend/.env.local`:
```bash
# For local backend (default)
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# For Docker backend
NEXT_PUBLIC_API_URL=http://control-plane:8000/api/v1

# For production
NEXT_PUBLIC_API_URL=https://api.kernex.dev/api/v1
```

### Docker Setup

1. **Backend** (control-plane):
   ```dockerfile
   FROM python:3.11
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["python", "-m", "app.main"]
   ```

2. **Frontend** (frontend):
   ```dockerfile
   FROM node:20
   WORKDIR /app
   COPY package*.json .
   RUN npm install
   COPY . .
   ENV NEXT_PUBLIC_API_URL=http://control-plane:8000/api/v1
   CMD ["npm", "run", "dev"]
   ```

3. **Docker Compose**:
   ```yaml
   version: "3.8"
   services:
     control-plane:
       build: ./control-plane
       ports:
         - "8000:8000"
       environment:
         DATABASE_URL: sqlite+aiosqlite:///./dev.db
     
     frontend:
       build: ./frontend
       ports:
         - "3000:3000"
       environment:
         NEXT_PUBLIC_API_URL: http://control-plane:8000/api/v1
       depends_on:
         - control-plane
   ```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard/Pages (React Components)                         │
│         ↓                                                   │
│  React Query Hooks (useQuery)                               │
│         ↓                                                   │
│  fetch* Functions (fetchDevices, fetchBundles, etc)        │
│         ↓                                                   │
│  API Services (src/lib/api/services.ts)                    │
│         ├─ Try: Call Backend API                            │
│         └─ Fallback: Use Mock Data                          │
│         ↓                                                   │
│  Axios Client (apiClient)                                   │
│         ↓                                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Routes (/api/v1/devices, /bundles, /deployments)          │
│         ↓                                                   │
│  Database Models (SQLAlchemy ORM)                           │
│         ↓                                                   │
│  SQLite / PostgreSQL Database                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Reference

| Method | Endpoint | Frontend Usage | Purpose |
|--------|----------|-----------------|---------|
| GET | `/health` | Health check | Verify backend is running |
| GET | `/devices` | Dashboard, Devices page | List all devices |
| GET | `/devices/{id}` | Device inspector | Get device details |
| POST | `/devices/{id}/heartbeat` | Runtime agent | Send device heartbeat |
| GET | `/bundles` | Dashboard, Bundles page | List all bundles |
| POST | `/bundles` | Bundle upload | Upload new bundle |
| GET | `/deployments` | Dashboard, Deployments | List deployments |
| POST | `/deployments` | Deploy bundle | Create deployment |

## Debugging & Troubleshooting

### Check Backend is Running
```bash
curl -v http://localhost:8000/api/v1/health
# Should return: {"status": "ok"}
```

### Check Frontend Can Reach Backend
1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see:
   ```
   [API Client] Base URL: http://localhost:8000/api/v1
   ```

4. If you don't see this, check `.env.local`

### View Real API Calls
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Refresh page
4. You should see calls like:
   - `health` (200)
   - `devices` (200)
   - `deployments` (200)
   - etc.

### View Data Transformation
1. Open DevTools → Console
2. Run:
   ```javascript
   validateBackendIntegration()
   ```

3. Review the validation report

### Common Issues

#### "Failed to fetch" error
- ✅ Backend not running → Start backend
- ✅ Wrong port → Check NEXT_PUBLIC_API_URL
- ✅ CORS issue → Add CORS to FastAPI

#### Empty data tables
- ✅ Database is empty → Insert test data
- ✅ Wrong URL → Check env var
- ✅ API error → Check backend logs

#### "Cannot GET /api/v1/devices"
- ✅ API route not implemented → Check backend
- ✅ Frontend calling wrong endpoint → Check API service

## Performance Tips

1. **Reduce API Calls**: Increase React Query refetchInterval
   ```typescript
   useQuery({
     queryKey: ['devices'],
     queryFn: fetchDevices,
     refetchInterval: 30000, // 30 seconds instead of 10
   })
   ```

2. **Cache API Responses**: Configure staleTime
   ```typescript
   useQuery({
     queryKey: ['bundles'],
     queryFn: fetchBundles,
     staleTime: 5 * 60 * 1000, // 5 minutes
   })
   ```

3. **Batch API Calls**: Fetch multiple resources in one request (future improvement)

## Next Steps

- [ ] Add authentication (JWT tokens)
- [ ] Implement real-time updates (WebSocket)
- [ ] Add pagination for large lists
- [ ] Implement filtering & search
- [ ] Add data export functionality
- [ ] Deploy to production environment

