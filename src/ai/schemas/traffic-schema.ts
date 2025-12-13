import { z } from 'genkit';

export const TrafficAnalysisInputSchema = z.object({
  location: z.string(),
  time: z.string(),
  currentSpeed: z.number(),
});

export const TrafficAnalysisOutputSchema = z.object({
  analysis: z.string(),
  recommendation: z.string(),
  trafficLevel: z.enum(['low', 'moderate', 'heavy', 'severe']),
  predictedDelay: z.string(),
});
