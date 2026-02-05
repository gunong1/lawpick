import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // 1. Check if Google API Key exists
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
            "API 키가 설정되지 않았습니다. .env.local 파일에 GOOGLE_GENERATIVE_AI_API_KEY를 입력해주세요. (이 메시지는 시뮬레이션입니다.)",
            { status: 200 }
        );
    }

    try {
        console.log("AI Request (Google) started. Key Present:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const result = await streamText({
            model: google("gemini-2.0-flash"),
            system: "You are 'LawPick AI', a helpful and empathetic legal assistant. Answer legal questions (like lease fraud, traffic accidents) in Korean concisely and kindly. Your goal is to guide users to get a diagnosis, but provide helpful initial context.",
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error: any) {
        console.error("Detailed AI Error:", error);
        const errorMessage = error.message || "Unknown AI Error";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
