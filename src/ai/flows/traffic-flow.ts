"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import {
  TrafficAnalysisInputSchema,
  TrafficAnalysisOutputSchema,
} from "../schemas/traffic-schema";

export async function analyzeTraffic(
  input: z.infer<typeof TrafficAnalysisInputSchema>
) {
  try {
    return await analyzeTrafficFlow(input);
  } catch (error: any) {
    console.log("Gemini failed, trying Groq fallback...", error.message);
    if (
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("rate limit")
    ) {
      return await analyzeTrafficWithGroq(input);
    }
    throw error;
  }
}

async function analyzeTrafficWithGroq(
  input: z.infer<typeof TrafficAnalysisInputSchema>
) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
    throw new Error(
      "Groq API key not configured. Please add GROQ_API_KEY to your .env file."
    );
  }

  const prompt = `You are a traffic analysis AI for BusLive. Analyze traffic for a student waiting for/riding the bus.
    
Location: ${input.location}
Time: ${input.time}
Bus Speed: ${input.currentSpeed} km/h

Provide JSON with:
- analysis: Brief traffic situation (why slow/fast?)
- recommendation: Advice for student only (e.g. "Relax", "Start walking to stop")
- trafficLevel: "light" | "moderate" | "heavy" | "severe"
- predictedDelay: e.g. "None", "+5 mins", "+15 mins"

Speed < 20km/h = heavy traffic (unless stopped)
Speed > 40km/h = light traffic`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful traffic analysis assistant. Always respond with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from Groq API");
  }

  const result = JSON.parse(content);
  return result;
}

const analyzeTrafficFlow = ai.defineFlow(
  {
    name: "analyzeTrafficFlow",
    inputSchema: TrafficAnalysisInputSchema,
    outputSchema: TrafficAnalysisOutputSchema,
  },
  async (input: { location: any; time: any; currentSpeed: any }) => {
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
      output: { format: "json", schema: TrafficAnalysisOutputSchema },
    });

    const result = await ai.generate({
      prompt,
      output: { format: "json", schema: TrafficAnalysisOutputSchema },
    });

    if (result.output) {
      return result.output;
    }

    throw new Error("Failed to generate traffic analysis");
  }
);
