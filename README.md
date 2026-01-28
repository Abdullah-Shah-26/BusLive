# BusLive

Real-time bus tracking system with AI-powered traffic insights & live location updates.

**[Live Demo](https://bus-live.vercel.app)**

## Problem Statement

Public transport lacks real-time visibility, causing unpredictable wait times & poor passenger experience. BusLive provides GPS tracking with ESP32/ESP8266 hardware, live locations, ETAs, capacity indicators, & smart notifications. Demo showcases college campus transportation.

## Features

- **Real-Time Tracking** - Live bus location updates on interactive maps
- **Smart Search** - Find buses by number, route, or destination
- **Favorite Routes** - Save frequently used routes with localStorage
- **Capacity Indicators** - Color-coded occupancy visualization
- **Share Location** - Share live tracking via Web Share API
- **AI Traffic Analysis** - Gemini AI-powered insights & delay predictions
- **Smart ETA** - Dynamic arrival time predictions
- **Route Visualization** - Complete journey path display
- **Smart Alerts** - Notifications when bus is approaching
- **Loading States** - Skeleton loaders for smooth UX
- **Authentication** - Google Sign-In & Email/Password
- **Dark Mode** - Theme switching with persistence
- **Responsive Design** - Works on mobile & desktop

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js App<br/>React 19 + TypeScript]
        A1[TrackerPage Component]
        A2[MapComponent<br/>Leaflet.js]
        A3[Auth Context]
        A4[UI Components<br/>shadcn/ui + Tailwind]
        A --> A1
        A --> A2
        A --> A3
        A --> A4
    end

    subgraph "AI Layer - Genkit Flows"
        B1[Routing Flow<br/>getRoute]
        B2[Traffic Analysis Flow<br/>analyzeTraffic]
        B3[Zod Schemas]
    end

    subgraph "External Services"
        C1[Firebase Auth<br/>Google Sign-In]
        C2[Firebase Realtime DB<br/>Bus Location Data]
        C3[OpenRouteService API<br/>Route Calculation]
        C4[Google Gemini AI<br/>Traffic Insights]
        C5[Groq API<br/>Llama Fallback]
    end

    subgraph "IoT Hardware Layer"
        D1[ESP32/ESP8266<br/>Microcontroller]
        D2[NEO-6M GPS Module<br/>TinyGPS++]
        D3[WiFi Module]
        D1 --> D2
        D1 --> D3
    end

    A1 --> B1
    A1 --> B2
    B1 --> B3
    B2 --> B3

    A3 --> C1
    A1 --> C2
    B1 --> C3
    B2 --> C4
    B2 --> C5

    D3 --> C2
    D2 --> D1

    style A fill:#3b82f6,stroke:#1e40af,color:#fff
    style B1 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style B2 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style C1 fill:#f59e0b,stroke:#d97706,color:#fff
    style C2 fill:#f59e0b,stroke:#d97706,color:#fff
    style C3 fill:#10b981,stroke:#059669,color:#fff
    style C4 fill:#ec4899,stroke:#db2777,color:#fff
    style C5 fill:#ec4899,stroke:#db2777,color:#fff
    style D1 fill:#ef4444,stroke:#dc2626,color:#fff
    style D2 fill:#ef4444,stroke:#dc2626,color:#fff
```

### Data Flow

```mermaid
sequenceDiagram
    participant IoT as ESP32 + GPS
    participant Firebase as Firebase Realtime DB
    participant Client as Next.js Client
    participant AI as Genkit AI Flows
    participant ORS as OpenRouteService
    participant Gemini as Google Gemini

    IoT->>IoT: Read GPS coordinates
    IoT->>Firebase: Update location every 5s
    Note over IoT,Firebase: {lat, lng, speed, status}

    Client->>Firebase: Subscribe to bus location
    Firebase-->>Client: Real-time location updates

    Client->>ORS: Request route calculation
    ORS-->>Client: Return route coordinates

    Client->>AI: Trigger traffic analysis
    AI->>Gemini: Analyze traffic conditions
    Gemini-->>AI: Return insights
    AI-->>Client: Display AI recommendations

    Client->>Client: Calculate ETA
    Client->>Client: Show notifications
```

## Tech Stack

| Layer    | Technologies                                          |
| -------- | ----------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui |
| Maps     | Leaflet.js, React Leaflet, OpenRouteService API       |
| Backend  | Firebase Auth + Realtime Database                     |
| AI       | Google Gemini, Groq (Llama), Genkit                   |
| Hardware | ESP32/ESP8266, NEO-6M GPS, TinyGPS++                  |

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
GROQ_API_KEY=
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

Inspired by Smart India Hackathon 2025 PS #25013 (Government of Punjab) - Real-Time Public Transport Tracking for Small Cities. Implements low-cost GPS tracking with IoT hardware & mobile-first design for scalable bus tracking solutions.

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

## License

MIT
