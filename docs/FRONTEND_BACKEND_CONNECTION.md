# Frontend-Backend Connection Guide

## ✅ Changes Made

1. **Dashboard Title**: Changed from "Dashboard" to "Kernex"
2. **API Client**: Added console logging to verify connection
3. **Environment Config**: Created `.env.local` for local development
4. **CORS**: Updated backend to accept frontend requests

## 🚀 Setup Instructions

### 1. Local Development Setup

**Frontend:**
```bash
cd frontend
npm run dev
# Visit: http://localhost:3000
```

The frontend is configured to connect to `http://localhost:8000/api/v1` by default.

**Backend (Control Plane):**
```bash
cd control-plane
$env:DATABASE_URL="sqlite+aiosqlite:///./dev.db"
python -m app.main
# Runs on: http://localhost:8000
```

### 2. Vercel Production Setup

**In Vercel Dashboard** (https://vercel.com/dashboard):

1. Go to your project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
   ```
3. Redeploy

**In Control Plane** (backend):

Set environment variable before starting:
```bash
$env:FRONTEND_URL="https://your-app-name.vercel.app"
python -m app.main
```

Or add to your `.env` file:
```
FRONTEND_URL=https://your-app-name.vercel.app
```

### 3. Testing Connection

1. **Open Frontend** (http://localhost:3000 or your Vercel URL)
2. **Open DevTools** (F12) → Console tab
3. **Look for**: `🔗 API Base URL: http://localhost:8000/api/v1`
4. **Check Network Tab** for API calls

### 4. Verify Backend CORS

The backend now accepts requests from:
- `http://localhost:3000` (local dev)
- Your Vercel deployment URL (when `FRONTEND_URL` is set)

## 🔍 Troubleshooting

**Issue: CORS errors in console**
- Check that backend `FRONTEND_URL` matches your Vercel URL exactly
- Restart backend after setting environment variable

**Issue: "Network Error" or timeout**
- Verify backend is running on correct port
- Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Ensure backend is publicly accessible (not localhost) for production

**Issue: API returns 404**
- Verify backend is running: visit `http://localhost:8000/health`
- Check API prefix is `/api/v1`

## 📝 Environment Variables Summary

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Backend (environment or .env):**
```
DATABASE_URL=sqlite+aiosqlite:///./dev.db
FRONTEND_URL=https://your-app-name.vercel.app
ENVIRONMENT=development
```

## 🎯 Next Steps

1. Test local connection:
   - Start backend: `cd control-plane && python -m app.main`
   - Start frontend: `cd frontend && npm run dev`
   - Visit http://localhost:3000
   - Check console for API URL confirmation

2. Deploy to production:
   - Push changes to GitHub
   - Vercel auto-deploys
   - Set `NEXT_PUBLIC_API_URL` in Vercel
   - Set `FRONTEND_URL` in backend
   - Restart backend

3. Verify in production:
   - Visit your Vercel URL
   - Open DevTools → Network tab
   - Check API calls are successful
   - No CORS errors in console
