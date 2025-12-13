import { z } from 'zod';

export const CoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const GetRouteInputSchema = z.object({
  start: CoordinatesSchema,
  end: CoordinatesSchema,
});

export const GetRouteOutputSchema = z.object({
  coordinates: z.array(CoordinatesSchema),
});
