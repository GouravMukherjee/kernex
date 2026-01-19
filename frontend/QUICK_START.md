# Kernex Frontend - Quick Start Guide

## 🚀 Setup & Run (5 minutes)

### Step 1: Install Dependencies

```powershell
cd frontend
npm install
```

This will install all required packages including:
- Next.js 14.2
- React 18
- Tailwind CSS 3.4
- TanStack Query & Table
- Recharts
- Zustand
- shadcn/ui components (Radix)

### Step 2: Run Development Server

```powershell
npm run dev
```

The app will start at **http://localhost:3000** (automatically redirects to `/dashboard`)

### Step 3: Explore the Dashboard

Navigate through the sidebar:
- **Dashboard** - Main overview with metrics, charts, and tables
- **Analytics** - Placeholder page
- **Devices** - Full device list (click any row to open inspector)
- **Bundles** - ML bundle management
- **Deployments** - Deployment tracking
- **Logs** - Terminal-style log viewer
- **Admin** - Settings placeholder

## 🎨 Design Highlights

### Ultra-Dark Theme
- Background: `#06070A` with radial gradient
- Extremely low contrast for calm, always-on feeling
- Muted indigo accent (`#5B74FF`)
- Subtle shadows and borders

### Key Components
1. **MetricCard** - Top stats (Total Devices, Active Bundles, etc.)
2. **DeploymentsBarChart** - 7-day deployment activity
3. **SuccessRatePanel** - 99.8% success rate display
4. **RecentDevicesTable** - Latest 5 devices with status dots
5. **DeviceInspector** - Right drawer with device details

### Interactive Features
- Click any device row to open inspector drawer
- Live indicator in topbar (animated dot)
- Hover effects on all interactive elements
- Smooth 150-220ms transitions

## 📊 Mock Data

Currently uses mock data from `src/lib/data/mock.ts`:
- 5 devices (online, offline, degraded)
- 3 bundles (active, testing, deprecated)
- 2 deployments
- 7 days of chart data

All data fetches simulate async with 200-300ms delays.

## 🔄 Live Updates

TanStack Query automatically refetches:
- Metrics every 10 seconds
- Devices every 10 seconds

Simulates real-time dashboard experience.

## 🛠️ Next Steps

### Connect to Real API

1. Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

2. Replace mock fetchers in pages with real API calls via `apiClient`

### Add New Page

1. Create `src/app/(app)/my-page/page.tsx`
2. Add route to `src/components/kernex/Sidebar.tsx` navigation array

### Customize Theme

Edit `tailwind.config.ts` and `src/app/globals.css` for colors.

## 📦 Production Build

```powershell
npm run build
npm start
```

Optimized production build runs on port 3000.

## 🎯 Design Requirements Met

✅ Ultra-dark, low-contrast design  
✅ Muted indigo charts and accents  
✅ Sidebar with active route highlighting  
✅ Topbar with centered search  
✅ 4 metric cards on dashboard  
✅ 7-day deployments bar chart  
✅ Success rate panel  
✅ Recent devices table  
✅ Deployment success panel with sparkline  
✅ Device inspector drawer  
✅ Live indicator  
✅ Smooth animations (Framer Motion via Radix)  
✅ Responsive hover states  
✅ TypeScript strict mode  
✅ Clean component architecture  

## 🔍 Troubleshooting

**Port already in use?**
```powershell
npm run dev -- -p 3001
```

**Missing dependencies?**
```powershell
rm -rf node_modules package-lock.json
npm install
```

**Build errors?**
Ensure Node.js version >= 18.17.0

## 📚 Tech Stack Reference

- **Framework**: Next.js 14.2 App Router
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **State**: TanStack Query (server) + Zustand (UI)
- **Charts**: Recharts 2.10
- **Icons**: Lucide React
- **HTTP**: Axios with interceptors

---

**Ready to go!** Open http://localhost:3000 and start exploring the dashboard.
