import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetailedAnalysis } from '@/lib/types';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

const SYSTEM_PROMPT = `당신은 대한민국 법률 분쟁 분석 전문 AI입니다.
사용자의 사연을 분석하여 아래 JSON 형식으로만 답변하세요.

[분류 기준]
- RENTAL: 부동산/임대차 (보증금, 월세, 명도)
- MONEY: 금전/채권 (대여금, 용역비)
- LABOR: 노동 (임금체불, 부당해고)
- CONSUMER: 소비자 (환불, 하자)
- CYBER: 명예훼손/악플
- TRAFFIC: 교통사고
- FAMILY: 가정/상속
- CRIME: 형사 (사기, 폭행, 협박)
- FRAUD: 사기 (로맨스스캠, 투자사기, 중고거래사기, 보이스피싱)
- NOISE: 층간소음
- OTHER: 기타

⚠️ [분류 혼동 방지 규칙]
- "빌려줬다/빌린/빌렸/대여/차용" 표현이 있으면 → MONEY(대여금). 상대방이 "투자"라고 우기더라도 의뢰인이 "빌려준 거다"라면 대여금.
- "인스타/SNS" 단독 언급 → 로맨스스캠 아님. 로맨스스캠은 SNS만남 + 투자유인 + 금전요구 3가지 모두 해당해야 함.
- "권리금" + "건물주/재계약" → RENTAL(상가임대차), FRAUD 아님.

⚠️⚠️⚠️ [역할 판단 - 매우 중요!!!] ⚠️⚠️⚠️

★★★ 의뢰인 판단 핵심 규칙 ★★★
1. 누가 "피해를 입었다"고 호소하는가? → 그 사람이 의뢰인
2. 누가 "돈을 받아야 한다"고 주장하는가? → 그 사람이 의뢰인
3. "~에게" 패턴 확인: "집주인에게 연락했다" → 의뢰인은 세입자

[임대차 역할 판단 상세]
- 세입자(임차인)가 의뢰인인 경우:
  * "집주인에게 ~했다" (집주인에게 문자/연락/요청)
  * "보증금을 못 받을까봐" / "보증금 안 줌" / "보증금 못 줄 수도"
  * "전세 만기" + "이사" + "보증금 걱정"
  * "내용증명 보내야 할까요?" (보증금 반환 관련)
  
- 집주인(임대인)이 의뢰인인 경우:
  * "세입자가 월세를 안 냄" / "차임 연체"
  * "세입자가 도망감" / "잠적"
  * "세입자를 내보내고 싶다"
  * "명도 소송"

[금액 규칙]
- 본문에 나온 숫자를 정확히 추출 (예: "500만 원" → "500만 원")
- 월세 합산 허용: "월 80만 원 × 4개월" → "320만 원"
- 금액이 없으면 "해당 없음"

[출력 형식 - JSON만, 마크다운 금지]
{
  "score": 75,
  "type": "WARNING",
  "category": "RENTAL",
  "caseBrief": "임차인이 전세 만기 시 보증금 반환을 요청하는 사안",
  "legalCategories": ["보증금반환청구", "임차권등기명령", "전세권설정"],
  "keyFacts": {
    "who": "의뢰인: 임차인(세입자) / 상대방: 임대인(집주인)",
    "when": "전세 계약 만기 2개월 전",
    "money": "해당 없음",
    "evidenceStatus": "문자 내역 보유"
  },
  "riskReason": "임대인이 보증금 반환을 회피할 가능성이 있음",
  "actionItems": ["내용증명 발송 (보증금 반환 요청)", "임차권등기명령 준비", "보증보험 확인", "전세보증금반환보증 가입 여부 확인"]
}`;

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content || content.trim().length < 10) {
            return Response.json({
                success: false,
                error: '분석할 내용이 너무 짧습니다. 구체적으로 입력해주세요.'
            });
        }

        // =====================================================
        // [필터 1] 법적 분쟁 여부 검사
        // =====================================================
        const legalKeywords = [
            // 금전/채권
            '돈', '원', '만원', '억', '빌려', '갚', '못 받', '안 받', '안 줘', '못 줘', '채무', '채권', '변제',
            // 임대차/상가
            '보증금', '월세', '전세', '집주인', '세입자', '임대', '임차', '명도', '퇴거', '계약',
            '권리금', '상가', '건물주', '재계약', '만기', '프랜차이즈', '영업권', '갱신',
            // 사기/범죄
            '사기', '피해', '고소', '고발', '경찰', '수사', '범죄', '폭행', '협박', '횡령', '배임',
            // 로맨스스캠/투자사기
            '코인', '거래소', '수익률', '출금', '입금', '세금', '자금세탁', '해외계좌', '결혼', '교포',
            // 노동
            '월급', '임금', '급여', '알바', '체불', '해고', '퇴직금', '노동',
            // 명예훼손
            '명예훼손', '모욕', '악플', '비방', '욕설',
            // 소비자/계약
            '환불', '하자', '불량', '취소', '위약금', '손해', '배상',
            // 가정/교통
            '이혼', '양육', '상속', '교통사고', '치료비', '합의금',
            // 기타 법적 표현
            '소송', '법원', '변호사', '내용증명', '합의', '분쟁', '피해자', '가해자', '신고'
        ];

        const hasLegalContent = legalKeywords.some(keyword => content.includes(keyword));

        if (!hasLegalContent) {
            // 법적 분쟁이 아닌 일상 대화
            const noLegalIssue: DetailedAnalysis = {
                score: 0,
                type: 'SAFE',
                caseBrief: '법적 분쟁 사안이 아닙니다.',
                legalCategories: [],
                keyFacts: {
                    who: '-',
                    when: '-',
                    money: '-',
                    evidenceStatus: '-'
                },
                riskReason: '입력하신 내용에서 법적 분쟁 요소가 감지되지 않았습니다. 구체적인 피해 상황, 금액, 상대방 정보 등을 포함하여 다시 작성해주세요.',
                actionItems: []
            };
            return Response.json({ success: true, data: noLegalIssue });
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const result = await model.generateContent([
                { text: SYSTEM_PROMPT },
                { text: `[사용자 사연]\n${content}\n\n위 내용을 분석해서 JSON으로만 답변해. 마크다운 코드블록 없이 순수 JSON만.` }
            ]);

            const responseText = result.response.text();
            console.log('[AI Response]', responseText.substring(0, 500));

            // JSON 파싱 (마크다운 제거)
            const cleanJson = responseText.replace(/```json|```/g, '').trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                console.error('JSON not found in response');
                throw new Error('JSON Not Found');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            const analysisData: DetailedAnalysis = {
                score: parsed.score || 50,
                type: ['SAFE', 'WARNING', 'CRITICAL'].includes(parsed.type) ? parsed.type : 'WARNING',
                caseBrief: parsed.caseBrief || '분석 결과를 확인해주세요.',
                legalCategories: Array.isArray(parsed.legalCategories) ? parsed.legalCategories : ['법률 상담'],
                keyFacts: {
                    who: parsed.keyFacts?.who || '의뢰인 / 상대방',
                    when: parsed.keyFacts?.when || '미상',
                    money: parsed.keyFacts?.money || '해당 없음',
                    evidenceStatus: parsed.keyFacts?.evidenceStatus || '확인 필요'
                },
                riskReason: parsed.riskReason || '',
                actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : ['전문가 상담 권장']
            };

            // =====================================================
            // [Post-AI 분류 보정] 대여금 vs 투자사기/로맨스스캠 혼동 방지
            // =====================================================
            const isLendingCase = /빌려줬|빌려줌|빌렸|빌린|차용|갚으라고|갚아|대여금|돌려줄게/.test(content);
            const isInvestmentOrFraudLabel = /투자.*사기|로맨스|스캠|폰지|FRAUD/i.test(analysisData.caseBrief || '');

            if (isLendingCase && isInvestmentOrFraudLabel) {
                console.log('[Post-AI Override] Lending keywords detected, correcting FRAUD→MONEY classification');
                // 금액 재추출
                let correctedMoney = '해당 없음';
                const moneyFix = content.match(/(\d+)\s*억\s*(\d*\s*천)?\s*만?\s*원|(\d+)\s*천\s*만\s*원|(\d+)\s*백\s*만\s*원|(\d{1,3}(?:,\d{3})*)\s*만\s*원|(\d+)\s*억/);
                if (moneyFix) correctedMoney = moneyFix[0];

                analysisData.type = 'CRITICAL';
                analysisData.score = 85;
                analysisData.caseBrief = `대여금 반환 청구 사안 (상대방이 '투자'라고 주장하나, 의뢰인은 '빌려준 것'으로 진술)${correctedMoney !== '해당 없음' ? ` (대여금: ${correctedMoney})` : ''}`;
                analysisData.legalCategories = ['대여금반환청구', '사기죄(용도사기)', '강제집행'];
                analysisData.keyFacts = {
                    ...analysisData.keyFacts,
                    who: '의뢰인: 채권자(돈을 빌려준 사람) / 상대방: 채무자(돈을 빌린 사람)',
                    money: correctedMoney
                };
                analysisData.actionItems = [
                    '카카오톡 대화 내용(변제약속) 캡처·공증 → 핵심 증거',
                    '계좌이체 내역서 확보 (금전 지급 사실 증명)',
                    '상대방의 "투자" 주장은 법적으로 인정되기 어려움 — 차용 약속(원금보장+이자+변제기 약속)은 대여의 전형적 요소',
                    '상대방이 빌린 돈을 약속한 용도(사업)에 쓰지 않고 명품·골프 등에 사용했다면 용도사기(형법 제347조) 형사고소 가능',
                    '내용증명 발송 후 지급명령 또는 민사소송(대여금반환청구) 진행',
                    '상대방 재산 파악 후 가압류 신청 (은닉 방지)'
                ];
            }

            return Response.json({ success: true, data: analysisData });

        } catch (aiError) {
            console.error('AI Error:', aiError);
            // Fallback: 키워드 기반 분석
            return Response.json({
                success: true,
                data: getFallbackAnalysis(content)
            });
        }

    } catch (error: any) {
        console.error('Server Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

// =====================================================
// [Fallback 분석] 역할 판단 개선 버전
// =====================================================
function getFallbackAnalysis(content: string): DetailedAnalysis {
    let type: 'SAFE' | 'WARNING' | 'CRITICAL' = 'WARNING';
    let score = 60;
    let categories: string[] = [];
    let who = '의뢰인 / 상대방';
    let actionItems: string[] = [];
    let caseBrief = '';
    let money = '해당 없음';

    // 금액 추출 (한글 수사 + 숫자 모두 지원)
    const moneyPatterns = [
        // 한글 수사 패턴: "1억 5천만 원", "2천만 원", "3백만 원"
        /(\d+)\s*억\s*(\d*\s*천)?\s*만?\s*원/g,
        /(\d+)\s*천\s*만\s*원/g,
        /(\d+)\s*백\s*만\s*원/g,
        // 숫자 패턴: "2500만 원", "600만 원"
        /(\d{1,3}(?:,\d{3})*)\s*만\s*원/g,
        /(\d+)\s*억/g,
        /(\d{1,3}(?:,\d{3})*)\s*원/g
    ];

    for (const pattern of moneyPatterns) {
        const match = content.match(pattern);
        if (match) {
            // 가장 큰 금액을 선택 (여러 금액이 언급된 경우)
            money = match[0];
            break;
        }
    }

    // =====================================================
    // [핵심] 역할 판단 로직 개선
    // =====================================================

    // 1. 세입자(임차인)가 의뢰인인 경우 - 보증금 관련
    const isTenantAsClient =
        /집주인에게|임대인에게/.test(content) ||  // "집주인에게 ~했다" = 내가 세입자
        /보증금.*(못|안).*(받|줄|돌려)/.test(content) ||  // "보증금 못 받을까봐"
        /보증금.*(걱정|불안)/.test(content) ||  // "보증금 걱정"
        /전세.*만기.*(이사|나가)/.test(content) ||  // "전세 만기라 이사"
        /(세입자|임차인)입니다/.test(content) ||  // "세입자입니다"
        /다음\s*세입자.*(안|못).*구해/.test(content);  // "다음 세입자 안 구해지면"

    // 2. 집주인(임대인)이 의뢰인인 경우 - 명도/차임 관련
    const isLandlordAsClient =
        /세입자에게|임차인에게/.test(content) ||  // "세입자에게 ~했다" = 내가 집주인
        /세입자가.*(월세|차임).*(안|못|밀)/.test(content) ||  // "세입자가 월세 안 냄"
        /세입자가.*(도망|잠적|연락두절)/.test(content) ||  // "세입자가 도망"
        /(집주인|임대인)입니다/.test(content) ||  // "집주인입니다"
        /내보내|명도/.test(content);  // "내보내고 싶다", "명도"

    // =====================================================
    // 케이스별 분기 (순서 중요! - 임대차 관련 먼저 체크)
    // =====================================================

    // 1. 전세사기 / 깡통전세 / 경매 (임대차 + 사기 조합) - 최우선
    const isRentalFraud = /전세.*사기|깡통.*전세|경매|근저당|선순위|배당|보증금.*(사기|못.*받)/.test(content);

    if (isRentalFraud || ((/전세|보증금/.test(content)) && (/사기|경매|근저당|잠적/.test(content)))) {
        type = 'CRITICAL';
        score = 92;
        categories = ['보증금반환청구', '임차권등기명령', '경매배당청구', '형사고소(사기)'];
        who = '의뢰인: 임차인(세입자/피해자) / 상대방: 임대인(집주인/피의자)';
        caseBrief = `전세사기/깡통전세 피해 의심 사안${money !== '해당 없음' ? ` (보증금: ${money})` : ''}`;
        actionItems = [
            '즉시 임차권등기명령 신청 (법원)',
            '등기부등본 확인하여 선순위 채권 파악',
            '전세보증금반환보증(HUG/SGI) 가입 여부 확인',
            '경매 개시 시 배당요구 신청',
            '집주인 상대 사기죄 형사고소 검토'
        ];
    }
    // 1-2. 상가 권리금 분쟁 (권리금 + 건물주/재계약 거부)
    else if (/권리금/.test(content) && /건물주|임대인|재계약|갱신|만기|나가|비워|명도/.test(content)) {
        type = 'CRITICAL';
        score = 90;
        categories = ['권리금회수방해금지', '계약갱신요구권', '손해배상청구'];
        who = '의뢰인: 임차인(상가세입자) / 상대방: 임대인(건물주)';
        caseBrief = `상가 권리금 회수 방해 및 계약갱신 거절 사안${money !== '해당 없음' ? ` (권리금: ${money})` : ''}`;
        actionItems = [
            '⚠️ 상가건물 임대차보호법 제10조의4에 따라 건물주의 권리금 회수 방해는 위법 — 즉시 내용증명 발송',
            '권리금 계약서, 인테리어 투자 내역, 매출자료 등 권리금 산정 증거 확보',
            '"권리금 인정 안 함" 특약은 상가임대차보호법 제15조(강행규정)에 의해 무효 가능성 높음',
            '건물주가 정당한 사유 없이 신규 임차인과 계약 거절 시 권리금 상당 손해배상 청구 가능',
            '대한법률구조공단 또는 상가임대차분쟁조정위원회에 조정 신청 검토',
            '소멸시효 3년 내 손해배상청구 소송 준비'
        ];
    }
    // 2. 임대차 - 세입자가 의뢰인 (일반 보증금 반환)
    else if (isTenantAsClient || ((/보증금|전세/.test(content)) && !isLandlordAsClient)) {
        type = 'WARNING';
        score = 72;
        categories = ['보증금반환청구', '임차권등기명령', '전세보증금보증'];
        who = '의뢰인: 임차인(세입자) / 상대방: 임대인(집주인)';
        caseBrief = `보증금 반환 청구 사안${money !== '해당 없음' ? ` (보증금: ${money})` : ''}`;
        actionItems = [
            '내용증명 발송 (보증금 반환 요청 통보)',
            '임차권등기명령 신청 준비',
            '전세보증금반환보증(HUG/SGI) 가입 여부 확인',
            '보증금 반환 소송 검토'
        ];
    }
    // 3. 임대차 - 집주인이 의뢰인 (명도/차임)
    else if (isLandlordAsClient) {
        type = 'WARNING';
        score = 75;
        categories = ['명도소송', '차임지급청구', '점유이전금지가처분'];
        who = '의뢰인: 임대인(집주인) / 상대방: 임차인(세입자)';
        caseBrief = `임차인의 차임 연체/계약 위반으로 인한 명도 청구 사안`;
        actionItems = [
            '내용증명 발송 (계약 해지 및 명도 요청 통보)',
            '점유이전금지가처분 신청',
            '밀린 월세 내역 및 계약서 정리',
            '명도소송 소장 작성 준비'
        ];
    }
    // 4. 투자 사기 / 폰지 사기 / 다단계 - ★빌려줬/차용 있으면 대여금으로 제외★
    else if (/투자|원금.*보장|수익.*보장|확정.*수익|폰지|다단계|코인|비트코인|리딩방|퇴직금.*투자/.test(content) && /사기|피해|못.*받|안.*줘|잠적|연락.*안|동결/.test(content) && !/빌려줬|빌려줌|빌렸|빌린|빌려준|차용|대여금|갚/.test(content)) {
        type = 'CRITICAL';
        score = 90;
        categories = ['사기죄', '유사수신행위', '형사고소'];
        who = '의뢰인: 피해자(투자자) / 상대방: 피의자(투자권유자)';
        caseBrief = `투자 사기(폰지/다단계) 피해 의심 사안${money !== '해당 없음' ? ` (피해액: ${money})` : ''}`;
        actionItems = [
            '경찰서 방문하여 사기죄로 형사고소',
            '금융감독원(금감원)에 불법 금융업 신고',
            '투자 약정서, 이체 내역, 대화 내역 모두 확보',
            '동일 피해자 모집하여 공동 대응 검토',
            '피의자 재산 가압류 신청 (도주/은닉 방지)'
        ];
    }
    // 5. 로맨스 스캠 / 투자 유인 사기 (SNS 만남 + 투자/코인 + 입금) - ★빌려줬/차용 있으면 제외★
    else if (/인스타|SNS|페이스북|카카오|텔레그램|소개팅|채팅/.test(content) && /코인|거래소|투자|수익|출금|입금|자금|해외.*계좌|비트코인/.test(content) && /사기|피해|돈.*날|못.*받|세금.*입금|추가.*입금|동결|묶여|느낌.*쎄|수상|의심/.test(content) && !/빌려줬|빌려줌|빌렸|빌린|빌려준|차용|대여금|갚/.test(content)) {
        type = 'CRITICAL';
        score = 95;
        categories = ['사기죄(로맨스스캠)', '전자금융사기', '형사고소'];
        who = '의뢰인: 피해자 / 상대방: 피의자(로맨스스캠 가해자)';
        caseBrief = `로맨스 스캠(투자 유인 사기) 피해 의심 사안${money !== '해당 없음' ? ` (피해액: ${money})` : ''}`;
        actionItems = [
            '⚠️ 추가 입금 절대 금지 (세금/수수료 명목 요구는 전형적 2차 사기 수법)',
            '경찰서 사이버수사대에 즉시 사기죄로 고소장 접수',
            '상대방과의 대화 내역(인스타, 카카오 등) 전부 캡처 보존',
            '입금한 계좌 및 거래소 사이트 URL 기록',
            '금융감독원(1332)에 불법 금융 사기 신고',
            '은행에 계좌 지급정지 요청 (사기이용계좌)'
        ];
    }
    // 5-2. 온라인 사기 / 중고거래 사기 (플랫폼 키워드 또는 물품거래 키워드 필수)
    else if (/중고나라|당근|번개|마켓|거래|판매|구매|물건|상품|배송/.test(content) && /사기|입금.*차단|물건.*안|잠적|먹튀|연락.*두절|차단/.test(content)) {
        type = 'CRITICAL';
        score = 88;
        categories = ['사기죄', '형사고소', '손해배상청구'];
        who = '의뢰인: 피해자(구매자) / 상대방: 피의자(판매자)';
        caseBrief = `중고거래 사기 피해 의심 사례${money !== '해당 없음' ? ` (피해액: ${money})` : ''}`;
        actionItems = [
            '경찰서 방문하여 사기죄로 고소장 접수',
            '계좌 이체내역 및 대화 캡처 확보',
            '판매자 정보(전화번호, 계좌) 정리',
            money !== '해당 없음' ? `피해액 ${money}에 대한 민사 소송 준비` : '피해액 산정 후 민사 소송 검토'
        ];
    }
    // 5-3. 대여금 (돈을 빌려줬는데 안 갚는 경우 - 투자가 아닌 대여)
    else if (/빌려줬|빌려줌|빌렸|빌린|빌려준|차용|대여금/.test(content) && /안.*갚|안.*줘|못.*받|안.*줌|배째|돌려줄.*없|잠적|사기|갚을.*돈/.test(content)) {
        type = 'CRITICAL';
        score = 85;
        categories = ['대여금반환청구', '지급명령', '강제집행'];
        who = '의뢰인: 채권자(돈을 빌려준 사람) / 상대방: 채무자(돈을 빌린 사람)';
        caseBrief = `대여금 반환 청구 사안${money !== '해당 없음' ? ` (대여금: ${money})` : ''}`;

        // 상대방이 "투자"라고 주장하는 경우 추가 안내
        const claimsInvestment = /투자.*아니냐|투자한.*거|투자.*주장|투자라고/.test(content);
        const hasKakaoEvidence = /카톡|카카오|문자|메시지|대화.*내역/.test(content);
        const suspectedFraud = /명품|골프|사치|인스타.*명품|용도.*사기|돈.*안.*쓴/.test(content);

        actionItems = [
            hasKakaoEvidence ? '카카오톡 대화 내용(변제약속, 원금보장 등) 캡처·공증 → 핵심 증거' : '변제 약속 관련 증거(문자, 녹음, 메신저 등) 확보',
            '계좌이체 내역서 출력·확보 (금전 지급 사실 증명)',
            claimsInvestment ? '★ 상대방의 "투자" 주장 반박: 원금보장+이자약속+변제기 합의가 있었다면 법적으로 대여(소비대차)이지 투자가 아님' : '차용증 없어도 이체내역+대화내용으로 대여 사실 입증 가능',
            suspectedFraud ? '★ 용도사기 의심: 빌린 돈을 약속 용도(사업)에 안 쓰고 사적으로 사용했다면 형법 제347조 사기죄로 형사고소 가능' : '상대방이 빌린 돈을 약속한 용도에 쓰지 않았다면 용도사기(형법 제347조) 형사고소 검토',
            '내용증명 발송 → 지급명령(법원) 또는 민사소송(대여금반환청구) 진행',
            '상대방 재산 파악 후 가압류 신청 (재산 은닉·도주 방지)'
        ];
    }
    // 6. 용역비 / 프리랜서 미지급 (노동법 적용 X, 민사)
    else if (/프리랜서|외주|용역|잔금|외주비|제작비|디자인비|개발비/.test(content) && /미지급|안 줘|못 받|안 줌/.test(content)) {
        type = 'CRITICAL';
        score = 78;
        categories = ['용역비청구', '지급명령', '민사소송'];
        who = '의뢰인: 용역제공자(채권자) / 상대방: 의뢰인(채무자)';
        caseBrief = `용역비(프리랜서 대금) 미지급 사안${money !== '해당 없음' ? ` (미지급액: ${money})` : ''}`;
        actionItems = [
            '내용증명 발송 (용역비 지급 독촉)',
            '카카오톡/이메일 대화 내역 및 작업물 전송 기록 확보',
            '구두 계약도 법적 효력 있음 - 증거 정리',
            '법원 지급명령 신청 (소액: 3,000만 원 이하)',
            money !== '해당 없음' ? `${money} 청구 민사소송 검토` : '청구액 산정 후 소송 검토'
        ];
    }
    // 7. 임금체불 (근로자 - 노동법 적용)
    else if (/알바|월급|임금|급여|퇴직금/.test(content) && /안 줘|못 받|밀려|체불|미지급/.test(content)) {
        type = 'CRITICAL';
        score = 80;
        categories = ['임금체불', '노동청 진정', '체불임금 청구'];
        who = '의뢰인: 근로자 / 상대방: 사업주';
        caseBrief = `임금 체불 사안${money !== '해당 없음' ? ` (체불액: ${money})` : ''}`;
        actionItems = [
            '고용노동부 임금체불 진정서 제출',
            '근로계약서 및 급여명세서 확보',
            '출퇴근 기록 및 업무 증거 정리',
            '법원 지급명령 신청 검토'
        ];
    }
    // 8. 명예훼손/악플 (인스타/SNS 단독은 제외 - 로맨스스캠과 충돌 방지)
    else if (/욕|악플|명예훼손|모욕|비방|걸레/.test(content) || (/SNS|인스타|게시물|댓글/.test(content) && /욕|비방|모욕|명예훼손|허위/.test(content))) {
        type = 'WARNING';
        score = 65;
        categories = ['명예훼손', '모욕죄', '손해배상'];
        who = '의뢰인: 피해자 / 상대방: 가해자';
        caseBrief = '온라인 명예훼손/모욕 피해 사안';
        actionItems = [
            '게시물 및 댓글 화면 캡처 (URL 포함)',
            '경찰서 사이버수사대에 고소장 접수',
            '게시물 삭제 요청 (방송통신심의위원회)',
            '민사 손해배상 청구 검토'
        ];
    }
    // 8. 이혼/가정법 (폭행보다 먼저 체크!)
    else if (/이혼|양육권|재산.*분할|위자료|친권|별거|혼인|배우자|남편|아내|도박.*빚|외도|불륜/.test(content)) {
        type = 'WARNING';
        score = 70;
        categories = ['이혼', '재산분할', '양육권', '위자료'];
        who = '의뢰인: 배우자 / 상대방: 배우자';
        caseBrief = '이혼 및 가사 분쟁 사안';
        actionItems = [
            '혼인관계증명서, 가족관계증명서 발급',
            '재산 목록 정리 (부동산, 예금, 채무 등)',
            '배우자 유책사유 증거 확보 (도박, 외도 등)',
            '양육권 관련 자녀 양육 환경 입증 자료 준비',
            '가정법원에 이혼조정/소송 신청 검토',
            '위자료 및 재산분할 청구액 산정'
        ];
    }
    // 9. 폭행/상해 (교통사고보다 먼저 체크!)
    else if (/폭행|때리|맞|주먹|멱살|몸싸움|시비|싸움|전치|상해|진단.*주|쌍방/.test(content)) {
        type = 'CRITICAL';
        score = 85;
        categories = ['폭행죄', '상해죄', '형사고소', '손해배상'];
        who = '의뢰인: 피해자 / 상대방: 가해자';
        caseBrief = '폭행/상해 피해로 인한 형사고소 사안';
        actionItems = [
            '즉시 병원에서 상해진단서 발급',
            '사건 현장 CCTV 및 목격자 확보',
            '경찰서 방문하여 폭행/상해죄 고소장 제출',
            '치료비 및 위자료 손해배상 청구 검토',
            '쌍방폭행 주장 대응 - 정당방위 입증 준비'
        ];
    }
    // 9. 렌터카 분쟁 (과다 수리비/휴차료 청구) - 교통사고보다 먼저!
    else if (/렌터카|렌트카|렌탈|휴차료|대차료|반납/.test(content) && /수리비|과도|과다|현금|막무가내|사기/.test(content)) {
        type = 'WARNING';
        score = 65;
        categories = ['소비자분쟁', '과다청구', '손해배상'];
        who = '의뢰인: 소비자(렌터카 이용자) / 상대방: 렌터카 업체';
        caseBrief = `렌터카 과다 수리비 분쟁 사안${money !== '해당 없음' ? ` (청구액: ${money})` : ''}`;
        actionItems = [
            '렌터카 계약서 및 약관 재확인',
            '손상 부위 사진/동영상 촬영 (반납 시점 기록)',
            '수리 견적서 요청 및 타 업체 견적 비교',
            '보험 적용 가능 여부 확인 (자차 보험, 신용카드 부가서비스)',
            '한국소비자원(1372) 상담 및 피해구제 신청',
            '부당한 현금 요구 시 녹취 및 증거 확보'
        ];
    }
    // 10. 교통사고 (차량/교통 키워드 필수)
    else if (/교통사고|접촉사고|뺑소니|블랙박스|과실.*비율|차대차/.test(content) && !/렌터카|렌트카|렌탈|휴차료/.test(content)) {
        type = 'WARNING';
        score = 70;
        categories = ['교통사고', '손해배상', '보험금청구'];
        who = '의뢰인: 피해자 / 상대방: 가해자(또는 보험사)';
        caseBrief = `교통사고 피해 보상 사안${money !== '해당 없음' ? ` (청구액: ${money})` : ''}`;
        actionItems = [
            '사고 현장 사진 및 블랙박스 영상 확보',
            '경찰 교통사고 사실확인원 발급',
            '진단서 및 치료비 영수증 수집',
            '보험사 합의 전 전문가 상담 권장',
            '합의금이 적정한지 검토 후 협상'
        ];
    }
    // 9. 층간소음
    else if (/층간소음|윗집|아랫집|쿵쿵|발소리|소음|시끄러|뛰어다니/.test(content)) {
        type = 'WARNING';
        score = 55;
        categories = ['층간소음', '손해배상', '주거침해'];
        who = '의뢰인: 피해 세대 / 상대방: 소음 유발 세대';
        caseBrief = '층간소음 피해로 인한 분쟁 사안';
        actionItems = [
            '소음 발생 시간대 및 빈도 기록 (일지 작성)',
            '소음측정기 앱으로 데시벨(dB) 측정 및 녹음',
            '관리사무소에 공식 민원 접수',
            '국가소음정보시스템 또는 환경부 신고',
            '내용증명 발송 (경고 및 손해배상 예고)'
        ];
    }
    // 10. 소비자 환불 (인터넷쇼핑, 하자)
    else if (/환불|반품|하자|불량|교환|쇼핑몰|배송|취소|청약철회/.test(content)) {
        type = 'WARNING';
        score = 60;
        categories = ['소비자보호', '청약철회', '환불청구'];
        who = '의뢰인: 소비자 / 상대방: 판매자(사업자)';
        caseBrief = `소비자 환불/교환 분쟁 사안${money !== '해당 없음' ? ` (구매액: ${money})` : ''}`;
        actionItems = [
            '구매 내역 및 결제 영수증 확보',
            '판매자와의 대화 내역 캡처',
            '전자상거래법상 청약철회 기간(7일) 확인',
            '1372 소비자상담센터 신고',
            '한국소비자원 피해구제 신청'
        ];
    }
    // 11. 대여금 (지인에게 빌려준 돈)
    else if (/빌려|빌린|대여|차용|갚|상환|돈.*안|돈.*못|원.*받/.test(content) && !/전세|보증금|월세/.test(content)) {
        type = 'WARNING';
        score = 68;
        categories = ['대여금청구', '지급명령', '민사소송'];
        who = '의뢰인: 채권자(빌려준 사람) / 상대방: 채무자(빌린 사람)';
        caseBrief = `대여금 반환 청구 사안${money !== '해당 없음' ? ` (대여금: ${money})` : ''}`;
        actionItems = [
            '차용증, 계좌이체 내역 등 증거 확보',
            '카카오톡/문자 대화 내역 백업',
            '내용증명 발송 (상환 독촉)',
            '법원 지급명령 신청 (간편 절차)',
            money !== '해당 없음' ? `${money} 청구 민사소송 검토` : '청구액 산정 후 소송 검토'
        ];
    }
    // 12. 협박 (폭행은 위에서 이미 처리됨, 협박만 체크)
    else if (/협박|위협|죽이|으.*겠|협박.*죽/.test(content)) {
        type = 'CRITICAL';
        score = 80;
        categories = ['협박죄', '형사고소'];
        who = '의뢰인: 피해자 / 상대방: 가해자';
        caseBrief = '협박 피해로 인한 형사고소 사안';
        actionItems = [
            '협박 내용 녹음 또는 캡처 확보',
            '112 신고 또는 경찰서 방문',
            '경찰서에 협박죄로 고소장 제출',
            '민사상 손해배상(위자료) 청구 검토'
        ];
    }
    // 13. 공사/수리 하자 (인테리어, 시공 불량)
    else if (/인테리어|공사|시공|하자|수리|리모델링|누수|균열|부실/.test(content)) {
        type = 'WARNING';
        score = 65;
        categories = ['하자보수청구', '손해배상', '공사대금분쟁'];
        who = '의뢰인: 발주자(집주인) / 상대방: 시공업체';
        caseBrief = `공사/시공 하자 분쟁 사안${money !== '해당 없음' ? ` (공사비: ${money})` : ''}`;
        actionItems = [
            '하자 부분 사진 및 동영상 촬영',
            '시공 계약서 및 견적서 확보',
            '하자보수 요청 내용증명 발송',
            '제3자 전문가 감정 검토',
            '하자보수 불이행 시 손해배상 소송 준비'
        ];
    }
    // 14. 의료과실 / 의료분쟁
    else if (/병원|의사|수술|치료|오진|의료.*과실|부작용|후유증|사망|진료/.test(content) && /사고|피해|실수|잘못|과실|고소/.test(content)) {
        type = 'CRITICAL';
        score = 80;
        categories = ['의료분쟁', '의료과실', '손해배상'];
        who = '의뢰인: 피해자(환자) / 상대방: 의료기관(의사)';
        caseBrief = '의료과실 피해 분쟁 사안';
        actionItems = [
            '진료기록부 사본 발급 요청',
            '다른 병원에서 소견서 받기',
            '한국의료분쟁조정중재원 조정 신청',
            '의료과실 전문 변호사 상담',
            '손해배상 청구 소송 검토'
        ];
    }
    // 15. 직장 내 괴롭힘 / 갑질
    else if (/직장|회사|상사|팀장|부장|갑질|괴롭힘|왕따|따돌림|폭언|모욕|퇴사.*강요/.test(content)) {
        type = 'WARNING';
        score = 72;
        categories = ['직장내괴롭힘', '근로기준법', '손해배상'];
        who = '의뢰인: 피해 근로자 / 상대방: 가해자(상사/회사)';
        caseBrief = '직장 내 괴롭힘 피해 사안';
        actionItems = [
            '괴롭힘 내용 일지 작성 및 증거 수집',
            '녹음, 문자, 이메일 등 증거 확보',
            '사내 신고 또는 고충처리위원회 신고',
            '고용노동부 진정 접수',
            '손해배상 청구 및 산재 신청 검토'
        ];
    }
    // 16. 부당해고 / 불법해고
    else if (/해고|짤|퇴직.*강요|권고사직|부당.*해고|계약.*해지|정리해고/.test(content)) {
        type = 'CRITICAL';
        score = 78;
        categories = ['부당해고', '해고무효', '근로기준법'];
        who = '의뢰인: 피해 근로자 / 상대방: 사용자(회사)';
        caseBrief = '부당해고 구제 사안';
        actionItems = [
            '해고통지서 또는 해고 관련 증거 확보',
            '근로계약서, 취업규칙 확인',
            '노동위원회 부당해고 구제신청 (3개월 이내)',
            '고용노동부 진정 접수',
            '해고무효 확인소송 및 임금청구 검토'
        ];
    }
    // 17. 저작권 / 지식재산권 침해
    else if (/저작권|도용|표절|무단.*사용|불법.*복제|디자인.*도용|상표|특허/.test(content)) {
        type = 'WARNING';
        score = 70;
        categories = ['저작권침해', '지식재산권', '손해배상'];
        who = '의뢰인: 권리자 / 상대방: 침해자';
        caseBrief = '저작권/지식재산권 침해 사안';
        actionItems = [
            '침해 증거 캡처 및 보존 (URL, 날짜 포함)',
            '저작권 등록 여부 확인',
            '침해 중지 요청 내용증명 발송',
            '한국저작권위원회 조정 신청',
            '손해배상 청구 소송 검토'
        ];
    }
    // 18. 학교폭력 / 왕따
    else if (/학교.*폭력|학폭|왕따|따돌림|학생.*괴롭힘|선생님|교사|학교/.test(content) && /폭행|협박|욕|괴롭|피해/.test(content)) {
        type = 'CRITICAL';
        score = 82;
        categories = ['학교폭력', '손해배상', '형사고소'];
        who = '의뢰인: 피해 학생(보호자) / 상대방: 가해 학생(보호자)';
        caseBrief = '학교폭력 피해 사안';
        actionItems = [
            '피해 내용 상세 기록 및 증거 수집',
            '학교폭력대책심의위원회 신고',
            '경찰서 피해 신고 및 고소',
            '심리상담 및 치료 기록 보존',
            '가해자 측 손해배상 청구 검토'
        ];
    }
    // 19. 보험금 거부 / 보험 분쟁
    else if (/보험|보험금|거부|거절|지급.*안|보험.*사기|약관|면책/.test(content) && !/교통사고/.test(content)) {
        type = 'WARNING';
        score = 68;
        categories = ['보험분쟁', '보험금청구', '손해배상'];
        who = '의뢰인: 보험 가입자 / 상대방: 보험회사';
        caseBrief = '보험금 지급 거부 분쟁 사안';
        actionItems = [
            '보험 계약서 및 약관 확인',
            '보험금 청구 서류 재확인',
            '금융감독원 민원 접수',
            '금융분쟁조정위원회 조정 신청',
            '보험금 청구 소송 검토'
        ];
    }
    // 20. 부동산 중개 분쟁
    else if (/부동산|중개|복비|중개.*수수료|공인중개사|허위.*매물|계약.*파기/.test(content)) {
        type = 'WARNING';
        score = 65;
        categories = ['부동산중개', '손해배상', '중개사책임'];
        who = '의뢰인: 매수자/임차인 / 상대방: 공인중개사';
        caseBrief = '부동산 중개 분쟁 사안';
        actionItems = [
            '중개계약서 및 관련 서류 확보',
            '허위 설명 또는 중요사항 미고지 증거 수집',
            '공인중개사협회 민원 접수',
            '한국공인중개사협회 손해배상 청구',
            '손해배상 소송 검토'
        ];
    }
    // 21. 개인정보 유출
    else if (/개인정보|유출|해킹|정보.*유출|스팸|보이스피싱|파밍/.test(content)) {
        type = 'WARNING';
        score = 70;
        categories = ['개인정보보호', '손해배상', '형사고소'];
        who = '의뢰인: 피해자 / 상대방: 유출 기관/회사';
        caseBrief = '개인정보 유출 피해 사안';
        actionItems = [
            '유출 사실 확인 및 증거 확보',
            '개인정보보호위원회 신고',
            '금융기관 계좌 점검 및 비밀번호 변경',
            '2차 피해 방지 조치',
            '손해배상 청구 검토'
        ];
    }
    // 22. 헬스장/피트니스 환불
    else if (/헬스|피트니스|PT|운동|환불.*거부|중도.*해지|회원권/.test(content)) {
        type = 'WARNING';
        score = 55;
        categories = ['소비자분쟁', '환불청구', '불공정약관'];
        who = '의뢰인: 소비자(회원) / 상대방: 헬스장/피트니스';
        caseBrief = '헬스장 환불 분쟁 사안';
        actionItems = [
            '회원 계약서 및 약관 확인',
            '체육시설법상 환불 규정 확인',
            '업체에 서면 환불 요청',
            '1372 소비자상담센터 신고',
            '한국소비자원 피해구제 신청'
        ];
    }
    // 23. 이사/택배 파손
    else if (/이사|택배|파손|분실|배송|물건.*망가|박스.*찢어/.test(content)) {
        type = 'WARNING';
        score = 60;
        categories = ['운송분쟁', '손해배상', '소비자보호'];
        who = '의뢰인: 소비자 / 상대방: 이사/택배 업체';
        caseBrief = '이사/택배 물품 파손 분쟁 사안';
        actionItems = [
            '파손 물품 사진 촬영 및 증거 확보',
            '업체에 즉시 피해 통보',
            '물품 가액 증빙 자료 준비',
            '1372 소비자상담센터 신고',
            '손해배상 청구'
        ];
    }
    // 기본 Fallback
    else {
        categories = ['법률 상담'];
        caseBrief = '사연을 분석 중입니다. 추가 정보가 필요합니다.';
        actionItems = [
            '관련 증거 자료 수집 및 정리',
            '상대방과의 대화 내역 백업',
            '전문 변호사 상담 권장'
        ];
    }

    return {
        score,
        type,
        caseBrief,
        legalCategories: categories,
        keyFacts: {
            who,
            when: '최근',
            money,
            evidenceStatus: '확인 필요'
        },
        riskReason: 'AI 분석 결과입니다.',
        actionItems
    };
}
