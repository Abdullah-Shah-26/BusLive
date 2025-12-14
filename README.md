# BusLive

Real-time bus tracking system for college transportation with AI-powered traffic insights.

## Problem Statement

Public transport in India lacks real-time visibility, causing unpredictable wait times and poor passenger experience. BusLive solves this with live GPS tracking, AI-powered traffic analysis, and smart notifications.

## Features

- **Real-Time Tracking** - Live bus location updates on interactive maps
- **Smart Search** - Find buses by number, route, or destination
- **Favorite Routes** - Save frequently used routes with localStorage
- **Capacity Indicators** - Color-coded occupancy visualization
- **Share Location** - Share live tracking via Web Share API
- **AI Traffic Analysis** - Gemini AI-powered insights and delay predictions
- **Smart ETA** - Dynamic arrival time predictions
- **Route Visualization** - Complete journey path display
- **Smart Alerts** - Notifications when bus is approaching
- **Loading States** - Skeleton loaders for smooth UX
- **Authentication** - Google Sign-In and Email/Password
- **Dark Mode** - Theme switching with persistence
- **Responsive Design** - Works on mobile and desktop

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** Firebase (Auth + Realtime Database)  
**APIs:** OpenRouteService (routing), Google Gemini AI (traffic analysis)  
**Maps:** Leaflet.js, React Leaflet  
**Optimization:** In-memory route caching (5-minute TTL)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DB_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=
GOOGLE_GENAI_API_KEY=
GROQ_API_KEY
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main entry
│   ├── login/                # Authentication
│   └── bus-selection/        # Route selection
├── components/
│   ├── TrackerPage.tsx       # Live tracking
│   ├── MapComponent.tsx      # Leaflet map
│   └── ui/                   # shadcn components
├── context/
│   └── AuthContext.tsx       # Auth state
├── lib/
│   ├── firebase.ts           # Firebase config
│   └── utils.ts              # Helpers
└── ai/
    ├── flows/                # Genkit AI flows
    └── schemas/              # Zod schemas
```

## Inspiration

This project was inspired by Smart India Hackathon 2025 Problem Statement #1656, addressing real-world challenges in public transport tracking and management.

## Credits

Built with inspiration from the open-source community. Special thanks to SaiGanesh & team for the initial concept.

## License

MIT
