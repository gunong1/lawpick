import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // Debug logging
        console.log("Chat Request received", messages?.length);

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(JSON.stringify({ error: "API Key Not Found" }), { status: 500 });
        }

        const result = await generateText({
            model: google('gemini-1.5-flash'),
            messages,
            system: "You are 'LawPick AI', a helpful and empathetic legal assistant. Answer legal questions (like lease fraud, traffic accidents) in Korean concisely and kindly. Your goal is to guide users to get a diagnosis, but provide helpful initial context.",
        });

        console.log("Chat Response generated");

        return new Response(JSON.stringify({ text: result.text }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
