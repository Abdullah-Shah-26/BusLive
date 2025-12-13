"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import {
  GetRouteInputSchema,
  GetRouteOutputSchema,
} from "../schemas/routing-schema";
import fetch from "node-fetch";

const routeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): string {
  return `${start.lat.toFixed(4)},${start.lng.toFixed(4)}-${end.lat.toFixed(
    4
  )},${end.lng.toFixed(4)}`;
}

export async function getRoute(input: z.infer<typeof GetRouteInputSchema>) {
  return getRouteFlow(input);
}

const getRouteFlow = ai.defineFlow(
  {
    name: "getRouteFlow",
    inputSchema: GetRouteInputSchema,
    outputSchema: GetRouteOutputSchema,
  },
  async ({ start, end }) => {
    const cacheKey = getCacheKey(start, end);
    const cached = routeCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("✓ Route cache hit:", cacheKey);
      return cached.data;
    }

    const apiKey =
      process.env.OPENROUTESERVICE_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

    const getFallbackRoute = () => {
      console.warn("Using fallback straight-line route.");
      const steps = 10;
      const coordinates = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        coordinates.push({
          lat: start.lat + (end.lat - start.lat) * t,
          lng: start.lng + (end.lng - start.lng) * t,
        });
      }
      return { coordinates };
    };

    if (!apiKey) {
      console.warn(
        "OpenRouteService API key is not configured. Using fallback."
      );
      return getFallbackRoute();
    }

    console.log("OpenRouteService API key found. Length:", apiKey.length);
    console.log("Fetching route from:", start, "to:", end);

    const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json; charset=utf-8",
          Accept:
            "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("OpenRouteService API Error:");
        console.error("Status:", response.status, response.statusText);
        console.error("Response:", errorBody);
        return getFallbackRoute();
      }

      console.log("OpenRouteService responded successfully!");

      const data: any = await response.json();

      if (data && data.features && data.features.length > 0) {
        const route = data.features[0];
        const coordinates = route.geometry.coordinates.map(
          (coord: [number, number]) => ({ lat: coord[1], lng: coord[0] })
        );
        const result = { coordinates };

        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        console.log("✓ Route cached:", cacheKey);

        return result;
      } else {
        return { coordinates: [] };
      }
    } catch (e: any) {
      console.error("Failed to fetch route from OpenRouteService", e);
      return getFallbackRoute();
    }
  }
);
