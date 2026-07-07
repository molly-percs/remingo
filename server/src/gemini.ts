import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let cachedClient: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Set it in server/.env.");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return cachedClient;
}

export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    // Rewriting a short draft is a simple text transform, not multi-step reasoning;
    // disabling Gemini 2.5's default extended-thinking pass cuts response latency substantially.
    config: { thinkingConfig: { thinkingBudget: 0 } } as GenerateContentConfig,
  });
  return (response.text ?? "").trim();
}
