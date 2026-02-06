// AI 리포트 상세 분석 응답 타입
export interface DetailedAnalysis {
    score: number;
    type: 'SAFE' | 'WARNING' | 'CRITICAL' | 'ERROR';

    // [섹션 A] 사건 브리핑 - 변호사 보고용 요약
    caseBrief: string;

    // [섹션 B] 법적 쟁점 키워드
    legalCategories: string[];

    // [섹션 C] 핵심 사실관계
    keyFacts: {
        who: string;           // 당사자
        when: string;          // 시기
        money?: string;        // 금액 (선택)
        evidenceStatus: string; // 증거 상태
    };

    // 위험도 산정 이유
    riskReason: string;

    // [섹션 D] 필요 조치 목록
    actionItems: string[];
}

// API 응답 타입
export interface AnalysisResponse {
    success: boolean;
    data?: DetailedAnalysis;
    error?: string;
}
