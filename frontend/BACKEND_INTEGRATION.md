# Backend-Frontend Integration Guide

## Overview

The frontend is now fully integrated with the backend. The system uses a **fallback architecture** where:
- Primary: Live backend API
- Fallback: Mock data (if backend is unavailable)

## Architecture

### Data Flow
```
Frontend Components
    ↓
React Query (TanStack)
    ↓
fetch* functions (src/lib/data/mock.ts)
    ↓
API Services (src/lib/api/services.ts)
    ↓
Axios Client (src/lib/api/client.ts)
    ↓
Backend API (control-plane:8000/api/v1)
    ↓
(Fallback to mock data if API fails)
```

## API Endpoints Connected

### Devices
- `GET /devices` → List all devices
- `GET /devices/{device_id}` → Get device details
- **Frontend Usage**: Dashboard, Devices page, Inspector drawer

### Bundles
- `GET /bundles` → List all bundles
- **Frontend Usage**: Bundles page, Deployment forms

### Deployments
- `GET /deployments` → List all deployments
- `POST /deployments` → Create new deployment
- **Frontend Usage**: Deployments page, Analytics

### Analytics
- Metrics calculated from: Devices + Bundles + Deployments
- **Frontend Usage**: Dashboard metrics cards

## Configuration

### Environment Variables

Create `.env.local` in `frontend/` directory:

```bash
# Local Development (default)
# No need to set - defaults to http://localhost:8000/api/v1

# Production
NEXT_PUBLIC_API_URL=https://api.kernex.dev/api/v1

# Docker Development
NEXT_PUBLIC_API_URL=http://control-plane:8000/api/v1
```

## Backend Requirements

The backend (control-plane) must be running with:

```bash
cd control-plane
export DATABASE_URL="sqlite+aiosqlite:///./dev.db"  # or Postgres
python -m app.main
```

API runs at: `http://localhost:8000/api/v1`
Health check: `GET http://localhost:8000/api/v1/health`

## Data Mapping

### Devices
```
Backend Device → Frontend Device
├── device_id → id
├── device_id → name (formatted)
├── status → status
├── current_bundle_version → bundleVersion
├── last_heartbeat → lastSeen
├── hardware_metadata.cpu_percent → cpuUsage
├── hardware_metadata.memory_percent → memoryUsage
├── hardware_metadata.region → location
└── hardware_metadata.ip_address → ipAddress
```

### Bundles
```
Backend Bundle → Frontend Bundle
├── id → id
├── version → version
├── manifest.name → name
├── manifest.size → size
├── created_at → uploadedAt
├── deployment_count → deployedCount
└── manifest.status → status
```

### Deployments
```
Backend Deployment → Frontend Deployment
├── id → id
├── bundle_version → bundleVersion
├── target_devices.length → targetDevices
├── target_devices[status=success].length → successCount
├── target_devices[status=failed].length → failedCount
├── status → status
├── created_at → startedAt
└── completed_at → completedAt
```

## Testing

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **List Devices**
   ```bash
   curl http://localhost:8000/api/v1/devices
   ```

3. **List Bundles**
   ```bash
   curl http://localhost:8000/api/v1/bundles
   ```

4. **List Deployments**
   ```bash
   curl http://localhost:8000/api/v1/deployments
   ```

### Browser Testing

1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit http://localhost:3000/dashboard
4. Check API calls in Network tab
5. Check Console for [API Request] logs

## Features Implemented

✅ Devices page - shows live device list from backend
✅ Bundles page - shows uploaded bundles from backend
✅ Deployments page - shows deployment history from backend
✅ Dashboard metrics - aggregated from backend data
✅ Analytics charts - based on deployment history
✅ Success rate panel - calculated from deployments
✅ Recent devices table - pulls latest devices
✅ Device inspector - shows device details
✅ Health check - validates backend availability
✅ Fallback to mock data - graceful degradation

## Error Handling

The system handles errors gracefully:

1. **Connection Error** → Falls back to mock data, shows warning in console
2. **404 Not Found** → Logged as warning, fallback to mock
3. **500 Server Error** → Logged as error, fallback to mock
4. **Timeout (15s)** → Request aborted, fallback to mock

## Debugging

Enable debug logging by checking browser Console:

```
[API Client] Base URL: http://localhost:8000/api/v1
[API Request] GET /devices
[API Response] 200 /devices
[API Request] GET /deployments
[API Response] 200 /deployments
```

## Next Steps

1. **Authentication**: Uncomment token handling in `src/lib/api/client.ts`
2. **Real-time Updates**: Add WebSocket support for heartbeats
3. **Error Notifications**: Add toast notifications for API errors
4. **Request Caching**: Configure React Query stale time settings
5. **Pagination**: Add pagination for large device/bundle lists
6. **Filtering**: Add device/bundle filtering on backend

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/api/client.ts` | Axios HTTP client configuration |
| `src/lib/api/services.ts` | API service functions |
| `src/lib/data/mock.ts` | Mock data + fallback logic |
| `src/app/(app)/dashboard/page.tsx` | Dashboard with real data |
| `src/app/(app)/devices/page.tsx` | Devices list page |
| `src/app/(app)/bundles/page.tsx` | Bundles list page |
| `src/app/(app)/deployments/page.tsx` | Deployments page |

## Troubleshooting

### "Backend health check failed"
- Ensure control-plane is running: `python -m app.main`
- Check if running on correct port: `localhost:8000`
- Check `NEXT_PUBLIC_API_URL` env var

### "API call failed" in console
- Check Network tab in DevTools
- Verify CORS headers in backend
- Check if backend database is initialized

### Empty data tables
- Verify backend has data (check with `curl`)
- Check mock data in console
- Review React Query status in DevTools

