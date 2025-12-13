'use server';
/**
 * @fileOverview A server-side flow to fetch route data from OpenRouteService.
 * This acts as a proxy to avoid client-side CORS issues.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GetRouteInputSchema, GetRouteOutputSchema } from '../schemas/routing-schema';
import fetch from 'node-fetch';

export async function getRoute(input: z.infer<typeof GetRouteInputSchema>) {
    return getRouteFlow(input);
}

const getRouteFlow = ai.defineFlow(
  {
    name: 'getRouteFlow',
    inputSchema: GetRouteInputSchema,
    outputSchema: GetRouteOutputSchema,
  },
  async ({ start, end }) => {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY || process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

    // Helper to generate a fallback straight-line route
    const getFallbackRoute = () => {
        console.warn('Using fallback straight-line route.');
        // Generate a few intermediate points for a smoother animation
        const steps = 10;
        const coordinates = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            coordinates.push({
                lat: start.lat + (end.lat - start.lat) * t,
                lng: start.lng + (end.lng - start.lng) * t
            });
        }
        return { coordinates };
    };

    if (!apiKey) {
      console.warn('OpenRouteService API key is not configured. Using fallback.');
      return getFallbackRoute();
    }

    console.log('OpenRouteService API key found. Length:', apiKey.length);
    console.log('Fetching route from:', start, 'to:', end);

    const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            },
        });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouteService API Error:');
        console.error('Status:', response.status, response.statusText);
        console.error('Response:', errorBody);
        // Fallback instead of throwing
        return getFallbackRoute();
      }
      
      console.log('OpenRouteService responded successfully!');
      
      const data: any = await response.json();
      
      if (data && data.features && data.features.length > 0) {
        const route = data.features[0];
        // The API returns [lng, lat], so we need to reverse for Leaflet which expects [lat, lng]
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
        return { coordinates };
      } else {
        return { coordinates: [] };
      }
    } catch (e: any) {
        console.error('Failed to fetch route from OpenRouteService', e);
        // Fallback instead of throwing
        return getFallbackRoute();
    }
  }
);
