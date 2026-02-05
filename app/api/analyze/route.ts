import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(JSON.stringify({ error: "API Key Not Found" }), { status: 500 });
        }

        const result = await generateText({
            model: google('gemini-1.5-flash'),
            system: `You are a high-precision legal risk analyzer (Lawpick Scanner).
      Analyze the user's input (contract clause or situation description) and output JSON.
      
      Output Schema:
      {
        "score": number (0-100, where 100 is critical danger),
        "riskLevel": string ("안전", "주의", "위험", "심각"),
        "riskFactors": string[] (List of 3 distinct, bullet-point style risk factors),
        "actionItem": string (One concrete, actionable legal advice sentence)
      }
      
      Return ONLY VALID JSON. No markdown.`,
            prompt: `User Input: ${content}`,
        });

        const cleanText = result.text.replace(/```json/g, "").replace(/```/g, "").trim();

        return new Response(cleanText, {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Analyze API Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
