import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

const plugins = [];
if (apiKey) {
  plugins.push(googleAI());
} else {
  console.warn("GOOGLE_GENAI_API_KEY is missing. AI features will not work.");
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
