import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { answers } = await req.json();

        console.log("Diagnosis Request Answers:", answers);
        const hasKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        console.log("Has API Key:", hasKey);

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error("Diagnosis Error: API Key Missing");
            return new Response(JSON.stringify({
                score: 0,
                riskLevel: "오류",
                summary: "API 키가 설정되지 않았습니다 (서버 설정 확인 필요)."
            }), { status: 500 });
        }

        // Combine answers into a readable string for the AI
        const profile = `
      1. Housing: ${answers[0]}
      2. Job: ${answers[1]}
      3. Recent Transaction (>1M KRW): ${answers[2]}
      4. Driving: ${answers[3]}
    `;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"), // Using 1.5-flash for better stability (less rate limiting)
            system: `You are a legal risk analyst. Analyze the user's profile based on their answers.
      
      Risk Factors:
      - Jeonse (Lease) = High Risk of deposit loss.
      - Freelancer/Business = High Risk of non-payment or contract disputes.
      - Frequent Transactions = Risk of fraud.
      - Driving = Risk of accidents.
      
      Output Format: RETURN ONLY VALID JSON. Do not include markdown formatting like \`\`\`json.
      Structure: { "score": number (0-100, higher is riskier), "riskLevel": string ("안전", "주의", "위험"), "summary": string (2 sentences advice in Korean) }`,
            prompt: `Analyze this user profile:\n${profile}`,
        });

        console.log("AI Response Text:", text);

        // Strip any potential markdown code blocks if the AI behaves unexpectedly
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return new Response(cleanText, {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Diagnosis Runtime Error:", error);
        return new Response(JSON.stringify({
            score: 50,
            riskLevel: "오류",
            summary: "진단 시스템 오류: " + (error?.message || "알 수 없는 오류")
        }), { status: 500 });
    }
}
