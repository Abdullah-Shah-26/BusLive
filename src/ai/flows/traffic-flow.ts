'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { TrafficAnalysisInputSchema, TrafficAnalysisOutputSchema } from '../schemas/traffic-schema';

export async function analyzeTraffic(input: z.infer<typeof TrafficAnalysisInputSchema>) {
    return analyzeTrafficFlow(input);
}

const analyzeTrafficFlow = ai.defineFlow(
  {
    name: 'analyzeTrafficFlow',
    inputSchema: TrafficAnalysisInputSchema,
    outputSchema: TrafficAnalysisOutputSchema,
  },
  async (input) => {
    const prompt = `
      You are a traffic analysis AI assistant for a smart bus tracking app called BusLive.
      You are speaking directly to a **student** who is waiting for the bus or riding it.
      
      Analyze the traffic conditions based on the following data:
      - Location: ${input.location}
      - Current Time: ${input.time}
      - Bus Speed: ${input.currentSpeed} km/h

      Provide:
      1. A brief analysis of the traffic situation (why is it slow/fast?).
      2. A specific recommendation **ONLY for the student** (e.g. "Relax", "Start walking to the stop", "You might be late for class").
      3. Classify the traffic level.
      4. Estimate a "Predicted Delay" string (e.g. "None", "+5 mins", "+15 mins").

      IMPORTANT: Do NOT provide advice to the driver. Do NOT mention "Driver:". Focus solely on the student's perspective.
      
      If the speed is low (< 20km/h), assume heavy traffic unless it's a stop.
      If the speed is high (> 40km/h), assume low traffic.
    `;

    const { text } = await ai.generate({
      prompt: prompt,
      output: { format: 'json', schema: TrafficAnalysisOutputSchema }
    });
 
    const result = await ai.generate({
        prompt,
        output: { format: 'json', schema: TrafficAnalysisOutputSchema }
    });
    
    if (result.output) {
        return result.output;
    }
    
    throw new Error("Failed to generate traffic analysis");
  }
);
