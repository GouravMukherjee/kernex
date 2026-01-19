# How to Run Kernex Frontend

## Prerequisites

- **Node.js** version 18.17.0 or higher
- **npm** (comes with Node.js)

## Installation & Setup

### 1. Navigate to Frontend Directory

```powershell
cd "A:\Project Kernex\frontend"
```

### 2. Install Dependencies

```powershell
npm install
```

This will install all required packages (~200 MB). Takes about 2-3 minutes on first run.

### 3. Start Development Server

```powershell
npm run dev
```

Expected output:
```
  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### 4. Open in Browser

Navigate to: **http://localhost:3000**

You'll be automatically redirected to `/dashboard`.

## What You'll See

### Dashboard Page
- **Top Row**: 4 metric cards showing system stats
- **Middle Row**: 
  - Left: 7-day deployments bar chart (muted indigo bars)
  - Right: Success rate panel (99.8%)
- **Bottom Row**:
  - Left: Recent devices table (5 devices)
  - Right: Deployment success panel with sparkline

### Navigation
Click sidebar items to explore:
- **Dashboard** - Main overview (you're here)
- **Analytics** - Placeholder page
- **Devices** - Full device list with table
- **Bundles** - Bundle cards
- **Deployments** - Deployment cards
- **Logs** - Terminal-style log viewer
- **Admin** - Settings placeholder

### Interactive Features
1. **Click any device row** → Opens inspector drawer on the right
2. **Watch live indicator** → Pulsing green dot in topbar
3. **Auto-refresh** → Metrics update every 10 seconds
4. **Hover effects** → Cards and rows highlight on hover

## Alternative Ports

If port 3000 is in use:

```powershell
npm run dev -- -p 3001
```

Or set in `package.json`:
```json
"dev": "next dev -p 3001"
```

## Production Build

### Build for Production

```powershell
npm run build
```

This creates an optimized production build in `.next/` directory.

### Run Production Server

```powershell
npm start
```

Production server runs on http://localhost:3000 (or PORT env var).

## Environment Configuration

### Optional: Connect to Real API

1. Create `.env.local`:
```powershell
New-Item -Path .env.local -ItemType File
```

2. Add API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3. Restart dev server

**Note**: Currently uses mock data. Real API integration requires updating query hooks in page components.

## Troubleshooting

### Issue: "Cannot find module"

**Solution**: Clean install
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Issue: Build errors

**Check Node.js version**:
```powershell
node --version
# Should be v18.17.0 or higher
```

**Update if needed**:
Download from https://nodejs.org/

### Issue: Port already in use

**Find and kill process on port 3000** (Windows):
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

Or use alternative port as shown above.

### Issue: Styles not loading

**Clear Next.js cache**:
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### Issue: TypeScript errors

**Check tsconfig.json** exists and run:
```powershell
npx tsc --noEmit
```

This checks types without building.

## Development Workflow

### Watch Mode
`npm run dev` automatically reloads on file changes:
- Component edits → Hot reload (preserves state)
- Route changes → Full reload
- Config changes → Requires restart

### Lint & Format
```powershell
npm run lint
```

### Type Checking
```powershell
npx tsc --noEmit
```

## Project Structure Reference

```
frontend/
├── src/
│   ├── app/              # App Router pages
│   │   ├── (app)/        # Main layout group
│   │   │   ├── dashboard/
│   │   │   ├── devices/
│   │   │   └── ...
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   └── kernex/       # App components
│   └── lib/
│       ├── api/          # API client
│       ├── data/         # Mock data
│       ├── query/        # TanStack Query
│       └── store/        # Zustand store
├── package.json
├── tailwind.config.ts    # Theme tokens
└── tsconfig.json
```

## Expected Behavior

### On First Load
1. Dashboard page loads with mock data
2. All components render with ultra-dark theme
3. Charts animate in smoothly
4. LIVE indicator pulses in topbar

### After 10 Seconds
1. Metrics refetch (see network activity in DevTools)
2. Device list updates
3. No visible change (mock data doesn't change)

### Device Inspector
1. Click any device row in table
2. Right drawer slides in (300ms animation)
3. Shows device details, CPU/memory bars
4. Click X or overlay to close

## Performance Notes

- **Initial load**: ~2-3s in dev, <1s in production
- **Page navigation**: Instant (client-side routing)
- **Chart rendering**: Recharts renders on mount (~100ms)
- **Refetch overhead**: Minimal (mock data fetches in 200-300ms)

## Keyboard Shortcuts

- `Ctrl+C` - Stop dev server
- `Ctrl+K` → `Ctrl+R` - VS Code: Reload window (if needed)

## VS Code Integration

Recommended extensions:
- ES7+ React snippets
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

## Next Steps

1. ✅ Run `npm install`
2. ✅ Run `npm run dev`
3. ✅ Open http://localhost:3000
4. ✅ Explore dashboard and pages
5. ✅ Click device rows to test inspector
6. 🔄 Connect to real API (when ready)
7. 🚀 Deploy to production

---

**Ready to start!** Run `npm install && npm run dev` in the `frontend/` directory.
