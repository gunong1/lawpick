export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        // 키워드 기반 분석 로직 (데모용)
        const lowerContent = content.toLowerCase();

        let score = 50;
        let riskLevel = "주의";
        let riskFactors: string[] = [];
        let actionItem = "";

        // 전세/보증금 관련
        if (lowerContent.includes("전세") || lowerContent.includes("보증금")) {
            score = 75;
            riskLevel = "위험";
            riskFactors = [
                "임대차보호법상 대항력 확보 여부 확인 필요",
                "전세보증보험 가입 상태 점검 필수",
                "집주인의 다른 채무나 근저당권 확인 필요"
            ];
            actionItem = "즉시 등기부등본을 발급받아 근저당권 설정 여부를 확인하고, 전세보증보험 가입을 검토하세요.";
        }
        // 계약 관련
        else if (lowerContent.includes("계약") || lowerContent.includes("서명")) {
            score = 60;
            riskLevel = "주의";
            riskFactors = [
                "계약 조항의 일방적 불이익 조항 존재 가능성",
                "해지 조건 및 위약금 조항 검토 필요",
                "자동갱신 조항 및 기간 확인 필요"
            ];
            actionItem = "계약서 전문을 꼼꼼히 검토하고, 불명확한 조항은 서면으로 명확히 해달라고 요청하세요.";
        }
        // 사기/피해 관련
        else if (lowerContent.includes("사기") || lowerContent.includes("피해") || lowerContent.includes("돈")) {
            score = 85;
            riskLevel = "심각";
            riskFactors = [
                "금전 거래 내역 및 증거 확보 필수",
                "상대방 신원 및 연락처 확인 필요",
                "형사고소 및 민사소송 가능성 검토"
            ];
            actionItem = "모든 증거(대화내역, 송금내역 등)를 확보하고 경찰서에 사기 피해 신고를 진행하세요.";
        }
        // 집주인/임대 관련
        else if (lowerContent.includes("집주인") || lowerContent.includes("임대") || lowerContent.includes("월세")) {
            score = 65;
            riskLevel = "주의";
            riskFactors = [
                "임대차계약서상 수리의무 조항 확인 필요",
                "보증금 반환 조건 및 시기 확인 필요",
                "계약 갱신청구권 행사 가능 여부 검토"
            ];
            actionItem = "임대차계약서를 다시 확인하고, 집주인과의 대화는 문자나 녹음으로 기록해두세요.";
        }
        // 일반적인 경우
        else {
            score = 45;
            riskLevel = "주의";
            riskFactors = [
                "상황에 대한 추가 정보 필요",
                "관련 문서나 증거 확보 권장",
                "전문가 상담 검토 필요"
            ];
            actionItem = "더 구체적인 상황을 입력해주시면 정확한 법률 리스크 분석이 가능합니다.";
        }

        // 안전한 경우
        if (lowerContent.includes("안전") || lowerContent.includes("보험 가입") || lowerContent.includes("확인 완료")) {
            score = 20;
            riskLevel = "안전";
            riskFactors = [
                "기본적인 법적 보호 조치가 확인됨",
                "추가적인 위험 요소는 발견되지 않음",
                "정기적인 상태 점검 권장"
            ];
            actionItem = "현재 상태를 유지하되, 관련 서류는 잘 보관해두세요.";
        }

        const result = {
            score,
            riskLevel,
            riskFactors,
            actionItem
        };

        // 약간의 딜레이를 추가하여 실제 AI 분석처럼 보이게 함
        await new Promise(resolve => setTimeout(resolve, 800));

        return new Response(JSON.stringify(result), {
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
