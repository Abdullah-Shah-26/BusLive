# BusLive

Real-time bus tracking system with live location updates and route visualization.

## Stack

- **Next.js 16** + React 19 + TypeScript
- **Firebase** - Authentication & real-time database
- **OpenRouteService** - Route calculation
- **Leaflet** - Interactive maps
- **Tailwind + shadcn/ui** - UI components
- **Genkit** - Server-side flow orchestration

## Setup

```bash
npm install
```

Create `.env`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DB_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=
```

## Run

```bash
npm run dev          # Dev server (port 9002)
npm run build        # Production build
npm run start        # Production server
```

## Features

- **Live Tracking** - Real-time bus location updates
- **Route Visualization** - Interactive map with route overlay
- **ETA Calculation** - Dynamic arrival time estimates
- **User Authentication** - Google & email login via Firebase
- **Responsive UI** - Glassmorphic design with dark mode
- **Bus Selection** - Choose from available buses
- **Journey Stages** - Track bus from pickup to destination

## Architecture

- **Client**: Next.js App Router with React Server Components
- **Maps**: Leaflet with custom markers and route rendering
- **Routing**: OpenRouteService API via server-side proxy
- **State**: React hooks for real-time updates
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS with custom glass effects

## License

MIT
