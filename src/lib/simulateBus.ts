import 'dotenv/config';

const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DB_URL;
if (!DATABASE_URL) {
  console.error("Error: NEXT_PUBLIC_FIREBASE_DB_URL is not defined in .env file");
  process.exit(1);
}

const BUS_ID = 'bus-1';

// Mock route coordinates (approximate path from Banjara Hills to Ameerpet)
const ROUTE = [
  { lat: 17.4262, lng: 78.4552 },
  { lat: 17.4268, lng: 78.4558 },
  { lat: 17.4275, lng: 78.4565 },
  { lat: 17.4282, lng: 78.4572 },
  { lat: 17.4290, lng: 78.4580 },
  { lat: 17.4300, lng: 78.4575 },
  { lat: 17.4310, lng: 78.4565 },
  { lat: 17.4320, lng: 78.4555 },
  { lat: 17.4330, lng: 78.4545 },
  { lat: 17.4340, lng: 78.4535 },
  { lat: 17.4350, lng: 78.4525 },
  { lat: 17.4360, lng: 78.4515 },
  { lat: 17.4370, lng: 78.4505 },
  { lat: 17.4375, lng: 78.4484 }
];

async function simulate() {
  console.log(`Starting simulation for ${BUS_ID}...`);
  console.log(`Connecting to: ${DATABASE_URL}`);
  console.log('Press Ctrl+C to stop.');
  
  let index = 0;
  let forward = true;
  
  setInterval(async () => {
    const location = ROUTE[index];
    const data = {
      location,
      speed: Math.floor(Math.random() * (60 - 30) + 30),
      status: 'enroute',
      lastUpdated: Date.now()
    };

    try {
      // Use REST API instead of SDK to bypass complex auth/connection states
      const response = await fetch(`${DATABASE_URL}/buses/${BUS_ID}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log(`Updated location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } else {
        console.error(`Error: ${response.status} ${response.statusText}`);
        if (response.status === 401 || response.status === 403) {
          console.error("Permission Denied: Please check your Realtime Database Rules in the Firebase Console.");
        }
      }
    } catch (error) {
      console.error('Network Error:', error);
    }

    if (forward) {
      index++;
      if (index >= ROUTE.length) {
        index = ROUTE.length - 2;
        forward = false;
      }
    } else {
      index--;
      if (index < 0) {
        index = 1;
        forward = true;
      }
    }
  }, 3000);
}

simulate();
