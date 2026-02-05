import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Check if Google API Key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "API Key not found. Please check GOOGLE_GENERATIVE_AI_API_KEY in .env.local" }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log("AI Request (Google) started for model: gemini-1.5-flash");

        const result = await streamText({
            model: google("gemini-1.5-flash"),
            system: "You are 'LawPick AI', a helpful and empathetic legal assistant. Answer legal questions (like lease fraud, traffic accidents) in Korean concisely and kindly. Your goal is to guide users to get a diagnosis, but provide helpful initial context.",
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Detailed AI Error:", error);
        const errorMessage = error.message || "Unknown AI Error";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
