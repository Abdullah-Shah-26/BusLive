import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

export function calculateETA(
  distance: number,
  speed: number,
  trafficLevel?: 'low' | 'moderate' | 'heavy' | 'severe' | 'medium' | 'high'
) {
  if (speed <= 0) return 0;

  let trafficMultiplier = 1;
  if (trafficLevel === 'medium' || trafficLevel === 'moderate') trafficMultiplier = 1.5;
  if (trafficLevel === 'high' || trafficLevel === 'heavy') trafficMultiplier = 2.0;
  if (trafficLevel === 'severe') trafficMultiplier = 3.0;

  const timeHours = distance / speed;
  const totalTimeMinutes = timeHours * 60 * trafficMultiplier;

  return totalTimeMinutes;
}


interface Location {
  lat: number;
  lng: number;
}

const COLLEGE_BOUNDARY_RADIUS = 500;
const COLLEGE_LOCATION: Location = { lat: 17.4185, lng: 78.4451 };

export function isWithinCollegeBoundary(location: Location): boolean {
  const distance = getDistance(
    location.lat,
    location.lng,
    COLLEGE_LOCATION.lat,
    COLLEGE_LOCATION.lng
  );
  

  return distance * 1000 <= COLLEGE_BOUNDARY_RADIUS;
}

export function hasExitedCollegeBoundary(
  currentLocation: Location, 
  previousLocation: Location | null
): boolean {
  if (!previousLocation) return false;
  
  const wasInside = isWithinCollegeBoundary(previousLocation);
  const isInside = isWithinCollegeBoundary(currentLocation);
  

  return wasInside && !isInside;
}


export interface AlertState {
  fiveMinuteWarning: boolean;
  oneMinuteWarning: boolean;
  arrivalWarning: boolean;
  collegeExitWarning: boolean;
}

export function shouldShowFiveMinuteAlert(
  eta: number, 
  alertState: AlertState,
  journeyStage: 'toUser' | 'toCollege'
): boolean {
  return (
    eta <= 5 && 
    eta > 3 && 
    !alertState.fiveMinuteWarning && 
    journeyStage === 'toUser'
  );
}
