# Kernex Frontend Dashboard

Ultra-dark, low-contrast internal infrastructure dashboard for edge device management.

## Tech Stack

- **Next.js 14.2+** with App Router (src/ directory)
- **React 18** & **TypeScript** (strict mode)
- **Tailwind CSS 3.4+** with custom design tokens
- **shadcn/ui** components (Radix primitives)
- **TanStack Query v5** for data fetching
- **TanStack Table** for device/data tables
- **Zustand** for UI state management
- **Recharts** for data visualization
- **Framer Motion** for animations (via Radix)
- **Lucide Icons**
- **Axios** for API client

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to `/dashboard`.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (app)/              # App layout group
│   │   │   ├── layout.tsx      # Main shell with sidebar + topbar
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── analytics/      # Analytics page
│   │   │   ├── devices/        # Devices list page
│   │   │   ├── bundles/        # Bundles page
│   │   │   ├── deployments/    # Deployments page
│   │   │   ├── logs/           # Logs viewer page
│   │   │   └── admin/          # Admin settings page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root redirect
│   │   └── globals.css         # Global styles + theme
│   ├── components/
│   │   ├── kernex/             # App-specific components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── DeploymentsBarChart.tsx
│   │   │   ├── SuccessRatePanel.tsx
│   │   │   ├── RecentDevicesTable.tsx
│   │   │   ├── DeploymentSuccessPanel.tsx
│   │   │   └── DeviceInspector.tsx
│   │   ├── ui/                 # shadcn/ui components
│   │   └── providers.tsx
│   └── lib/
│       ├── api/
│       │   └── client.ts       # Axios instance
│       ├── data/
│       │   └── mock.ts         # Mock data + async fetchers
│       ├── query/
│       │   └── queryClient.ts  # TanStack Query setup
│       ├── store/
│       │   └── ui.ts           # Zustand UI state
│       └── utils.ts            # Utilities (cn, formatters)
├── tailwind.config.ts          # Custom design tokens
├── tsconfig.json
├── next.config.js
└── package.json
```

## Design System

### Color Tokens

The dashboard uses an ultra-dark, low-contrast palette:

- **Background**: `#06070A` (near-black with subtle gradient)
- **Surfaces**: `#0A0C10`, `#0E1117`, `#121621` (layered depth)
- **Borders**: `rgba(255,255,255,0.06)` (barely visible)
- **Text**: `rgba(235,238,245,0.92)` → `0.62` → `0.42` (hierarchy)
- **Accent**: `#5B74FF` (muted indigo for charts/highlights)
- **Success**: `#3DDC97` (muted green)
- **Warning**: `#E8C36A` (muted amber)
- **Danger**: `#E06C75` (muted red)

All tokens are configured in `tailwind.config.ts` and `globals.css`.

### Typography

- **Font**: Inter (via `next/font`)
- **Hierarchy**: Quiet, no heavy weights
- Uppercase labels at 11px with wide tracking
- Body text at 13-14px

### Components

- **Cards**: `rounded-xl`, subtle shadow, border `rgba(255,255,255,0.06)`
- **Buttons**: Low contrast, no bright borders, soft hover lift
- **Tables**: Hairline dividers, row hover highlight
- **Charts**: Muted colors, thin gridlines
- **Animations**: 150-220ms ease-out transitions

## Features

### Pages

1. **Dashboard** (`/dashboard`)
   - 4 metric cards (Total Devices, Active Bundles, Deployments, Rollback Time)
   - 7-day deployments bar chart (Recharts)
   - Success rate panel (99.8%)
   - Recent devices table (5 latest)
   - Deployment success panel with sparkline

2. **Analytics** (`/analytics`)
   - Placeholder for advanced analytics

3. **Devices** (`/devices`)
   - Full device list with TanStack Table
   - Click row to open inspector drawer
   - Search/filter input

4. **Bundles** (`/bundles`)
   - ML bundle cards with version, size, deployment count

5. **Deployments** (`/deployments`)
   - Deployment cards with status, success/fail counts

6. **Logs** (`/logs`)
   - Terminal-style log viewer

7. **Admin** (`/admin`)
   - Settings placeholder

### Device Inspector

- Sidebar drawer (right) using Radix Sheet
- Shows device details: status, version, CPU/memory usage, location
- Animated open/close with Framer Motion (via Radix)
- Managed by Zustand state: `selectedDevice`, `inspectorOpen`

### Live Updates

- TanStack Query refetches metrics/devices every 10s
- "LIVE" indicator in topbar with animated dot
- "System Healthy" status in sidebar footer

## Mock Data

Currently uses mock data from `src/lib/data/mock.ts`. All fetch functions simulate async with `setTimeout(300ms)`.

To connect to real API:
1. Set `NEXT_PUBLIC_API_URL` in `.env.local`
2. Replace mock fetchers in queries with real API calls via `apiClient`

## State Management

- **TanStack Query**: Server state (devices, bundles, deployments)
- **Zustand**: UI state (sidebar collapse, inspector open/close, filters)

## Customization

### Adding a Route

1. Create page in `src/app/(app)/your-route/page.tsx`
2. Add route to sidebar navigation in `src/components/kernex/Sidebar.tsx`

### Adding a Component

Use shadcn/ui pattern:
- Atomic components in `src/components/ui/`
- App components in `src/components/kernex/`

### Changing Colors

Edit `tailwind.config.ts` and `src/app/globals.css` CSS variables.

## Notes

- **No backend required** - runs standalone with mock data
- **Responsive**: Optimized for desktop dashboards (1440px+)
- **Accessibility**: Keyboard navigation, ARIA labels via Radix
- **Performance**: React 18 Suspense, Next.js App Router streaming

## License

Internal use only.
