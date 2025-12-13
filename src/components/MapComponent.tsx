"use client";

import "leaflet/dist/leaflet.css";
import "./MapComponent.css";
import {
  Icon,
  Map as LeafletMap,
  map as createMap,
  tileLayer,
  marker,
  LatLng,
  latLngBounds,
  polyline,
  circle,
  divIcon,
} from "leaflet";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  MapPin,
  Users,
  School,
  Navigation,
  Bus,
  Zap,
  Clock,
  Locate,
  Target,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

interface Location {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  userLocation: Location | null;
  busLocation: Location | undefined | null;
  collegeLocation: Location | null;
  onMapReady: (map: LeafletMap) => void;
  routeCoordinates: LatLng[];
  remainingRoute: LatLng[];
  busSpeed?: number;
  eta?: number;
  children?: React.ReactNode;
}

interface TrafficData {
  level: "low" | "moderate" | "heavy" | "severe";
  factor: number; // multiplier for base travel time
  color: string;
}

const calculateTrafficCondition = (
  currentHour: number,
  dayOfWeek: number,
  busSpeed: number
): TrafficData => {
  const isRushHour =
    (currentHour >= 7 && currentHour <= 9) ||
    (currentHour >= 17 && currentHour <= 19);
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  const avgSpeedKmh = busSpeed || 0;

  if (avgSpeedKmh < 10 && isRushHour && isWeekday) {
    return { level: "severe", factor: 2.5, color: "#dc2626" }; // Red - Heavy congestion
  } else if (avgSpeedKmh < 20 && (isRushHour || !isWeekday)) {
    return { level: "heavy", factor: 2.0, color: "#ea580c" }; // Orange-Red - Heavy traffic
  } else if (avgSpeedKmh < 35 || isRushHour) {
    return { level: "moderate", factor: 1.5, color: "#f59e0b" }; // Amber - Moderate traffic
  } else {
    return { level: "low", factor: 1.0, color: "#10b981" }; // Green - Light traffic
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateDynamicETA = (
  remainingRoute: LatLng[],
  currentSpeed: number,
  traffic: TrafficData
): number => {
  if (remainingRoute.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < remainingRoute.length - 1; i++) {
    const dist = calculateDistance(
      remainingRoute[i].lat,
      remainingRoute[i].lng,
      remainingRoute[i + 1].lat,
      remainingRoute[i + 1].lng
    );
    totalDistance += dist;
  }

  // Estimated speed considering traffic
  const avgSpeed = Math.max(currentSpeed || 25, 15); // Minimum 15 km/h
  const adjustedSpeed = avgSpeed / traffic.factor;

  // ETA in minutes
  return (totalDistance / adjustedSpeed) * 60;
};

const playNotificationSound = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(
      "Your bus is arriving in 5 minutes!"
    );
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  }

  // Also try to play a system notification sound
  if (typeof window !== "undefined") {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqCzvLZjjwKGGSz7N2WUTE"
    );
    audio.play().catch(() => console.log("Audio notification not supported"));
  }
};

const createModernBusIcon = (theme: string = "light") =>
  new (divIcon as any)({
    html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="w-10 h-10 bg-orange-500 rounded-lg shadow-lg flex items-center justify-center border border-orange-600">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    </div>
  `,
    className: "custom-bus-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const createModernUserIcon = () =>
  new (divIcon as any)({
    html: `
    <div class="relative flex items-center justify-center w-12 h-14">
      <div class="relative">
        <!-- Professional user location marker -->
        <div class="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full relative shadow-2xl border-2 border-white ring-2 ring-blue-200">
          <!-- Location dot indicator -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-3 h-3 bg-white rounded-full shadow-inner"></div>
          </div>
          <!-- Professional pulse ring -->
          <div class="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"></div>
          <div class="absolute -inset-1 rounded-full border border-blue-300 animate-pulse opacity-40"></div>
        </div>
        <!-- Subtle drop shadow -->
        <div class="absolute top-10 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm"></div>
      </div>
    </div>
  `,
    className: "custom-user-marker",
    iconSize: [48, 56],
    iconAnchor: [24, 24],
  });

const createModernCollegeIcon = () =>
  new (divIcon as any)({
    html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="w-10 h-10 bg-purple-500 rounded-full shadow-lg flex items-center justify-center border border-purple-600">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.9V17h2V9L12 3z"/>
        </svg>
      </div>
    </div>
  `,
    className: "custom-college-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const createCombinedUserBusIcon = () =>
  new (divIcon as any)({
    html: `
    <div class="relative flex items-center justify-center w-14 h-14">
      <div class="relative">
        <!-- Bus background -->
        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-2xl flex items-center justify-center border-2 border-white">
          <!-- User indicator inside bus -->
          <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border border-white">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
        <!-- Active pulse animation -->
        <div class="absolute inset-0 rounded-xl border-2 border-green-400 animate-ping opacity-40"></div>
        <div class="absolute -inset-1 rounded-xl border border-green-300 animate-pulse opacity-60"></div>
        <!-- "On Board" indicator -->
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    </div>
  `,
    className: "custom-combined-marker",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });

const MapComponent = ({
  userLocation,
  busLocation,
  collegeLocation,
  onMapReady,
  routeCoordinates,
  remainingRoute,
  busSpeed = 0,
  eta,
  children,
}: MapComponentProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const collegeMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const remainingRoutePolylineRef = useRef<L.Polyline | null>(null);
  const traveledRoutePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const busCircleRef = useRef<L.Circle | null>(null);
  const { theme } = useTheme();
  const [isTracking, setIsTracking] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [isUserOnBus, setIsUserOnBus] = useState(false);
  const [currentTraffic, setCurrentTraffic] = useState<TrafficData>({
    level: "low",
    factor: 1.0,
    color: "#10b981",
  });

  const lightTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const darkTileUrl =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      if (mapRef.current === null) {
        const mapElement = document.getElementById("map");
        if (mapElement && !(mapElement as any)._leaflet_id) {
          const initialCenter = userLocation || { lat: 17.385, lng: 78.4867 };
          const leafletMap = createMap("map", {
            zoomControl: false,
            maxZoom: 22,
          }).setView([initialCenter.lat, initialCenter.lng], 13);
          mapRef.current = leafletMap;
          onMapReady(leafletMap);
        }
      }
    }
  }, [userLocation, onMapReady]);

  useEffect(() => {
    if (!mapRef.current) return;

    const tileUrl = theme === "dark" ? darkTileUrl : lightTileUrl;
    const attribution =
      theme === "dark"
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    } else {
      tileLayerRef.current = tileLayer(tileUrl, {
        attribution,
        maxZoom: 22,
      }).addTo(mapRef.current);
    }
  }, [theme, mapRef.current]);

  const centerOnBus = () => {
    if (mapRef.current && busLocation) {
      mapRef.current.setView([busLocation.lat, busLocation.lng], 16, {
        animate: true,
        duration: 1.5,
      });
      setIsTracking(true);
    }
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.5,
      });
      setIsTracking(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && userLocation) {
      const modernUserIcon = createModernUserIcon();

      if (!userMarkerRef.current) {
        userMarkerRef.current = marker([userLocation.lat, userLocation.lng], {
          icon: modernUserIcon,
        }).addTo(mapRef.current).bindPopup(`
          <div class="p-2 min-w-[200px]">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span class="font-medium text-sm">${
                isUserOnBus ? "You are on the bus!" : "Your Location"
              }</span>
            </div>
            <div class="text-xs text-gray-600">
              <div>Lat: ${userLocation.lat.toFixed(6)}</div>
              <div>Lng: ${userLocation.lng.toFixed(6)}</div>
              ${
                isUserOnBus
                  ? '<div class="mt-1 text-green-600 font-medium">🚌 Riding the bus</div>'
                  : ""
              }
            </div>
          </div>
        `);

        // Add accuracy circle
        userCircleRef.current = circle([userLocation.lat, userLocation.lng], {
          radius: 50,
          fillColor: "hsl(var(--primary))",
          fillOpacity: 0.1,
          color: "hsl(var(--primary))",
          weight: 2,
          opacity: 0.5,
        }).addTo(mapRef.current);
      } else {
        // Update position and icon
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userMarkerRef.current.setIcon(modernUserIcon);
        if (userCircleRef.current) {
          userCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        }
      }

      // Hide user marker when on bus
      if (userMarkerRef.current) {
        userMarkerRef.current.setOpacity(isUserOnBus ? 0 : 1);
      }
      if (userCircleRef.current) {
        userCircleRef.current.setStyle({
          opacity: isUserOnBus ? 0 : 0.5,
          fillOpacity: isUserOnBus ? 0 : 0.1,
        });
      }
    }
  }, [userLocation, isUserOnBus]);

  useEffect(() => {
    if (mapRef.current && busLocation) {
      const busIcon = isUserOnBus
        ? createCombinedUserBusIcon()
        : createModernBusIcon(theme || "light");

      if (!busMarkerRef.current) {
        busMarkerRef.current = marker([busLocation.lat, busLocation.lng], {
          icon: busIcon,
        }).addTo(mapRef.current).bindPopup(`
          <div class="p-3 min-w-[250px]">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <span class="font-medium">${
                isUserOnBus ? "Bus + You On Board! 🎉" : "Bus Live Location"
              }</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-gray-500">Speed</span>
                <div class="font-medium text-blue-600">${busSpeed} km/h</div>
              </div>
              <div>
                <span class="text-gray-500">Traffic</span>
                <div class="font-medium" style="color: ${
                  currentTraffic.color
                }">${currentTraffic.level}</div>
              </div>
              ${
                eta
                  ? `<div>
                <span class="text-gray-500">ETA</span>
                <div class="font-medium text-green-600">${Math.round(
                  eta
                )} min</div>
              </div>`
                  : ""
              }
              ${
                isUserOnBus
                  ? `<div>
                <span class="text-gray-500">Status</span>
                <div class="font-medium text-green-600">On Board ✅</div>
              </div>`
                  : ""
              }
            </div>
            <div class="mt-2 pt-2 border-t text-xs text-gray-600">
              <div>Lat: ${busLocation.lat.toFixed(6)}</div>
              <div>Lng: ${busLocation.lng.toFixed(6)}</div>
            </div>
          </div>
        `);

        // Add bus range circle
        busCircleRef.current = circle([busLocation.lat, busLocation.lng], {
          radius: 100,
          fillColor: isUserOnBus ? "#22c55e" : "#3b82f6",
          fillOpacity: 0.05,
          color: isUserOnBus ? "#22c55e" : "#3b82f6",
          weight: 1,
          opacity: 0.3,
        }).addTo(mapRef.current);
      } else {
        busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
        busMarkerRef.current.setIcon(busIcon);
        if (busCircleRef.current) {
          busCircleRef.current.setLatLng([busLocation.lat, busLocation.lng]);
          busCircleRef.current.setStyle({
            fillColor: isUserOnBus ? "#22c55e" : "#3b82f6",
            color: isUserOnBus ? "#22c55e" : "#3b82f6",
          });
        }

        // Auto-track bus if tracking is enabled
        if (isTracking) {
          mapRef.current.setView([busLocation.lat, busLocation.lng], 16, {
            animate: true,
            duration: 0.5,
          });
        }
      }
    }
  }, [
    busLocation,
    mapRef.current,
    busSpeed,
    eta,
    theme,
    isTracking,
    isUserOnBus,
    currentTraffic,
  ]);

  useEffect(() => {
    if (mapRef.current && collegeLocation) {
      const modernCollegeIcon = createModernCollegeIcon();

      if (!collegeMarkerRef.current) {
        collegeMarkerRef.current = marker(
          [collegeLocation.lat, collegeLocation.lng],
          {
            icon: modernCollegeIcon,
          }
        ).addTo(mapRef.current).bindPopup(`
          <div class="p-3 min-w-[200px]">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.9V17h2V9L12 3z"/>
                </svg>
              </div>
              <span class="font-medium">Destination</span>
            </div>
            <div class="text-sm font-medium text-purple-600 mb-2">
              MJ College of Engineering & Technology
            </div>
            <div class="text-xs text-gray-600">
              <div>Main Campus</div>
              <div class="mt-1">
                <div>Lat: ${collegeLocation.lat.toFixed(6)}</div>
                <div>Lng: ${collegeLocation.lng.toFixed(6)}</div>
              </div>
            </div>
          </div>
        `);
      } else {
        collegeMarkerRef.current.setLatLng([
          collegeLocation.lat,
          collegeLocation.lng,
        ]);
      }
    }
  }, [collegeLocation]);

  useEffect(() => {
    if (busLocation && userLocation && remainingRoute.length > 0) {
      const now = new Date();
      const traffic = calculateTrafficCondition(
        now.getHours(),
        now.getDay(),
        busSpeed || 0
      );
      setCurrentTraffic(traffic);

      const dynamicETA = calculateDynamicETA(
        remainingRoute,
        busSpeed || 25,
        traffic
      );
      const distanceToUser = calculateDistance(
        busLocation.lat,
        busLocation.lng,
        userLocation.lat,
        userLocation.lng
      );

      // Check if user is on the bus (within 50 meters)
      const isOnBus = distanceToUser < 0.05; // 50 meters in km
      setIsUserOnBus(isOnBus);

      // 5-minute arrival alert (only once every 5 minutes to avoid spam)
      const currentTime = Date.now();
      if (
        dynamicETA <= 5 &&
        dynamicETA > 3 &&
        !isOnBus &&
        currentTime - lastNotificationTime > 300000
      ) {
        playNotificationSound();
        setLastNotificationTime(currentTime);

        // Browser notification if permitted
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("🚌 Bus Arriving Soon!", {
            body: `Your bus is arriving in ${Math.round(dynamicETA)} minutes`,
            icon: "/bus-icon.png",
          });
        }
      }
    }
  }, [
    busLocation,
    userLocation,
    remainingRoute,
    busSpeed,
    lastNotificationTime,
  ]);

  useEffect(() => {
    if (mapRef.current) {
      // Remove old polylines if they exist
      if (routePolylineRef.current) {
        mapRef.current.removeLayer(routePolylineRef.current);
      }
      if (remainingRoutePolylineRef.current) {
        mapRef.current.removeLayer(remainingRoutePolylineRef.current);
      }
      if (traveledRoutePolylineRef.current) {
        mapRef.current.removeLayer(traveledRoutePolylineRef.current);
      }

      if (routeCoordinates.length > 0) {
        // Calculate traveled route
        const remainingLength = remainingRoute.length;
        const totalLength = routeCoordinates.length;
        const traveledRoute = routeCoordinates.slice(
          0,
          totalLength - remainingLength + 1
        );

        // Add traveled route (completed path - success green)
        if (traveledRoute.length > 1) {
          const traveled = polyline(traveledRoute, {
            color: "#22c55e",
            weight: 5,
            opacity: 0.6,
            dashArray: "10, 5",
          });
          traveled.addTo(mapRef.current);
          traveledRoutePolylineRef.current = traveled;
        }

        // Add remaining route with traffic-aware coloring
        if (remainingRoute.length > 1) {
          const remaining = polyline(remainingRoute, {
            color: currentTraffic.color,
            weight:
              currentTraffic.level === "severe"
                ? 8
                : currentTraffic.level === "heavy"
                ? 7
                : 6,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
            dashArray: currentTraffic.level === "severe" ? "15, 10" : undefined,
          });
          remaining.addTo(mapRef.current);
          remainingRoutePolylineRef.current = remaining;
        }

        // Note: Removed auto-fit to give users manual control over map zoom
      }
    }
  }, [routeCoordinates, remainingRoute, currentTraffic]);

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full" id="map" />

      <div className="absolute bottom-6 right-6 z-[1000] flex flex-row gap-2">
        {children}

        <Button
          onClick={centerOnBus}
          size="icon"
          variant={isTracking ? "default" : "secondary"}
          className="w-12 h-12 rounded-full shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90 transition-all duration-200"
          disabled={!busLocation}
        >
          <Target className={`w-5 h-5 ${isTracking ? "animate-spin" : ""}`} />
        </Button>

        <Button
          onClick={centerOnUser}
          size="icon"
          variant="outline"
          className="w-12 h-12 rounded-full shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90 transition-all duration-200"
          disabled={!userLocation}
        >
          <Locate className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
export default React.memo(MapComponent);
