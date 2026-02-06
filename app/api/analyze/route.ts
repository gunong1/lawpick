import { GoogleGenerativeAI } from '@google/generative-ai';
import { DetailedAnalysis } from '@/lib/types';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

const SYSTEM_PROMPT = `당신은 법률 분쟁 분석 전문 AI입니다.

⚠️⚠️⚠️ [치명적 규칙] 아래를 어기면 분석 실패 ⚠️⚠️⚠️

===== [예시] 반드시 이 패턴대로 출력 =====

**[입력 예시]**
"집주인입니다. 세입자가 원상복구비 200만 원 안 주고 도망갔어요. 월세도 3달 밀렸고요."

**[올바른 출력 ✅]**
{
  "caseBrief": "의뢰인(**임대인**)은 임차인으로부터 연체 차임 및 원상복구비 200만 원을 청구하는 사안입니다.",
  "keyFacts": {
    "who": "의뢰인: 임대인 / 상대방: 임차인",
    "money": "원상복구비 200만 원, 연체 차임 3개월분(금액 미상)"
  },
  "legalCategories": ["차임지급청구", "원상복구비청구", "명도소송"]
}

**[잘못된 출력 ❌ - 절대 이렇게 하지 마세요]**
{
  "caseBrief": "의뢰인(임차인)은 임대인으로부터 임대차보증금 600만 원을 반환받지 못하는 사안입니다.",
  // ↑ 오류 1: 집주인이라고 했는데 "임차인"으로 표기
  // ↑ 오류 2: 원상복구비 200만 원을 "보증금 600만 원"으로 변환 (엉터리 계산)
  // ↑ 오류 3: 집주인이 보증금 반환? 청구 유형 자체가 틀림
  "keyFacts": {
    "who": "의뢰인: 임차인 / 상대방: 임대인",  // ← 역할 뒤바뀜!
    "money": "총 600만 원 (월 200만 원 × 3개월)"  // ← 원상복구비≠월세, 계산 금지!
  }
}

===== 역할 판정 규칙 =====

| 입력 키워드 | user_role | caseBrief 표기 | 상대방 |
|-------------|-----------|----------------|--------|
| "집주인", "임대인", "세입자가 안 냄" | LANDLORD | 의뢰인(**임대인**) | 임차인 |
| "세입자", "전세금 안 줌", "보증금" | TENANT | 의뢰인(**임차인**) | 임대인 |
| "빌려줬는데" | CREDITOR | 의뢰인(**채권자**) | 채무자 |

===== 금액 규칙 =====
- "원상복구비 200만 원" → damage_cost (월세 아님!)
- "월세 3달 밀림" + 월세 금액 없음 → "연체 차임 3개월분(금액 미상)"
- ❌ 금지: "월 200만 원 × 3개월 = 600만 원" 같은 추측 계산

===== 용어 사용 =====
- LANDLORD일 때: 차임지급청구, 명도소송, 원상복구비청구
- TENANT일 때: 보증금반환, 임차권등기명령

[Output Format - JSON만]
{
  "score": 0-100,
  "type": "SAFE | WARNING | CRITICAL",
  "caseBrief": "의뢰인(임대인/임차인)은 ...",
  "legalCategories": ["역할에 맞는 용어"],
  "keyFacts": {
    "who": "의뢰인: [역할] / 상대방: [역할]",
    "when": "시기",
    "money": "확정 금액만",
    "evidenceStatus": "증거 상태"
  },
  "riskReason": "위험도 이유",
  "actionItems": ["조치 목록"]
}

[점수]
- 0: 정보 부족 / 판단 불가 (예: "사기 당함", "힘들다" 등 구체적 사실관계 없음)
- 10-30: SAFE (단순 상담, 법적 위험 낮음)
- 31-70: WARNING (내용증명 등 조치 필요)
- 71-100: CRITICAL (시급한 대응, 소송/형사고소 필요)

===== [중요] 정보 부족 시 처리 =====
입력 내용이 너무 모호하거나 구체적인 사실관계(누가, 언제, 무엇을, 어떻게)가 부족하여 법적 판단을 내리기 어려운 경우:
- score: 0
- type: "SAFE"
- caseBrief: "입력된 정보가 부족하여 법적 분석이 어렵습니다. 구체적인 사실위주로 다시 작성해주세요."
- riskReason: "구체적인 사실관계(피해 금액, 상대방의 행위, 날짜 등)가 파악되지 않아 위험도를 산정할 수 없습니다."
- actionItems: ["육하원칙에 따라 다시 작성", "계약서 등 증거 자료 확인"]`;

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content || content.trim().length < 10) {
            return Response.json({
                success: false,
                error: '분석할 내용이 너무 짧습니다. 더 구체적으로 입력해주세요.'
            });
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const result = await model.generateContent([
                { text: SYSTEM_PROMPT },
                { text: `다음 상황을 분석해주세요:\n\n${content}` }
            ]);

            const responseText = result.response.text();

            // JSON 파싱 시도
            let analysisData: DetailedAnalysis;
            try {
                // JSON 블록 추출 (```json ... ``` 형태일 수 있음)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('JSON 형식을 찾을 수 없습니다');
                }
                const parsed = JSON.parse(jsonMatch[0]);

                // 타입 검증 및 기본값 설정
                analysisData = {
                    score: Math.min(100, Math.max(0, parsed.score || 50)),
                    type: ['SAFE', 'WARNING', 'CRITICAL'].includes(parsed.type) ? parsed.type : 'WARNING',
                    caseBrief: parsed.caseBrief || '사건 내용을 분석 중입니다.',
                    legalCategories: Array.isArray(parsed.legalCategories) ? parsed.legalCategories : ['일반 법률 상담'],
                    keyFacts: {
                        who: parsed.keyFacts?.who || '미상',
                        when: parsed.keyFacts?.when || '미상',
                        money: parsed.keyFacts?.money || '미상',
                        evidenceStatus: parsed.keyFacts?.evidenceStatus || '확인 필요'
                    },
                    riskReason: parsed.riskReason || '추가 정보가 필요합니다.',
                    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : ['전문가 상담 권장']
                };

                console.log('--- [DEBUG] Content:', content.substring(0, 50) + '...');
                console.log('--- [DEBUG] AI Raw Output (caseBrief):', analysisData.caseBrief);
                console.log('--- [DEBUG] AI Raw Output (keyFacts.who):', analysisData.keyFacts.who);

                // ⚠️ [후처리] AI 응답 강제 수정 - 역할 판정 오류 교정
                const isLandlord = /집주인|임대인|세입자가.*안|월세.*밀|차임.*연체/.test(content);
                const isTenant = /세입자입니다|전세금.*안|보증금.*안.*줌/.test(content);

                console.log('--- [DEBUG] isLandlord:', isLandlord, 'isTenant:', isTenant);

                if (isLandlord && !isTenant) {
                    console.log('--- [DEBUG] Landlord Logic Triggered');
                    // 집주인인데 AI가 임차인으로 잘못 판정한 경우 강제 수정
                    if (analysisData.caseBrief.includes('임차인)은')) {
                        analysisData.caseBrief = analysisData.caseBrief.replace('임차인)은', '임대인)은');
                    }
                    if (analysisData.caseBrief.includes('집주인으로부터') || analysisData.caseBrief.includes('임대인으로부터')) {
                        analysisData.caseBrief = analysisData.caseBrief.replace(/집주인으로부터|임대인으로부터/g, '임차인으로부터');
                    }
                    if (analysisData.keyFacts.who.includes('임차인') && analysisData.keyFacts.who.includes('의뢰인')) {
                        analysisData.keyFacts.who = '의뢰인: 임대인 / 상대방: 임차인';
                    }

                    // 보증금반환 → 차임청구로 수정 (집주인은 보증금 청구 안함)
                    if (analysisData.caseBrief.includes('보증금') && analysisData.caseBrief.includes('반환')) {
                        analysisData.caseBrief = analysisData.caseBrief.replace(/임대차보증금.*반환/g, '연체 차임 및 원상복구비 지급');
                    }
                }

                // ⚠️ [후처리] 금액 계산 오류 수정
                const monthlyRentMatch = content.match(/월세\s*(\d+)/);
                const damageCostMatch = content.match(/원상복구비?\s*([\d,]+)\s*만?\s*원?/);

                if (damageCostMatch && !monthlyRentMatch) {
                    console.log('--- [DEBUG] Damage Cost Logic Triggered');
                    // 원상복구비만 있고 월세 금액이 없는 경우 엉터리 계산 수정
                    const damageAmount = damageCostMatch[1].replace(/,/g, '');
                    const money = analysisData.keyFacts.money || '';
                    if (money.includes('×') || money.includes('x')) {
                        analysisData.keyFacts.money = `원상복구비 ${damageAmount}만 원, 연체 차임(금액 미상)`;
                    }
                }

                // ⚠️ [후처리] keyFacts.who "상대방: 상대방" 같은 무의미한 값 수정
                const who = analysisData.keyFacts.who || '';
                if (who === '상대방: 상대방' || who.includes('상대방: 상대방') || who === '미상') {
                    console.log('--- [DEBUG] Who Fix Triggered');
                    // 사건 유형별로 당사자 정보 설정
                    if (/사기|가짜|짝퉁|도망|연락.*안|차단/.test(content)) {
                        analysisData.keyFacts.who = '의뢰인: 피해자 / 상대방: 사기 피의자';
                    } else if (/번개장터|중고나라|당근마켓|중고/.test(content)) {
                        analysisData.keyFacts.who = '의뢰인: 구매자(피해자) / 상대방: 판매자';
                    } else if (isLandlord) {
                        analysisData.keyFacts.who = '의뢰인: 임대인 / 상대방: 임차인';
                    } else if (isTenant) {
                        analysisData.keyFacts.who = '의뢰인: 임차인 / 상대방: 임대인';
                    } else {
                        analysisData.keyFacts.who = '의뢰인: 신청인 / 상대방: 피신청인';
                    }
                }

                console.log('--- [DEBUG] Final Output (who):', analysisData.keyFacts.who);
            } catch (parseError) {
                console.error('JSON 파싱 실패:', parseError);
                throw new Error('응답 파싱 실패');
            }

            return Response.json({
                success: true,
                data: analysisData
            });

        } catch (aiError: any) {
            console.error('Gemini API 오류:', aiError);
            // 폴백: 키워드 기반 분석
            return Response.json({
                success: true,
                data: getFallbackAnalysis(content)
            });
        }

    } catch (error: any) {
        console.error('Analyze API Error:', error);
        return Response.json({
            success: false,
            error: error.message || '알 수 없는 오류가 발생했습니다.'
        }, { status: 500 });
    }
}

// 폴백 분석 함수 (API 실패시)
function getFallbackAnalysis(content: string): DetailedAnalysis {
    const lowerContent = content.toLowerCase();

    // === 역할 감지 ===
    // 1. 임대차 관계 우선 확인 (Tenant 우선 감지)
    const isLandlordStrong = /세입자.*(안|내지|밀려|도망|파손|원상복구|명도)|월세.*(안|내지|밀려)/.test(content);
    const isTenant = !isLandlordStrong && /전세|보증금|이사|집주인.*(한테|에게|이|가)|임대인.*(한테|에게|이|가)|돌려|반환|안 줌|못 받/.test(content);
    const isLandlord = isLandlordStrong || (!isTenant && (/집주인|임대인/.test(content) || /세입자/.test(content)));

    // 2. 사기 범죄 확인 (임대차 관계가 아닐 때만 '도망', '차단' 등을 사기로 간주)
    const isFraud = /사기|가짜|짝퉁/.test(content) || ((/도망|연락.*안|차단/.test(content)) && !isLandlord && !isTenant);
    // 3. 명예훼손/영업방해 확인
    const isDefamation = /명예훼손|모욕|비방|악성|거짓|허위사실|영업방해|식중독|후기|리뷰|글|삭제|사과/.test(content);
    // 4. 층간소음
    const isNoise = /층간소음|발망치|쿵쿵|새벽|고성방가|악기|떠드는|시끄러|소음/.test(content);
    // 5. 임금/용역비/알바
    const isLabor = /월급|알바비|임금|급여|퇴직금|용역비|외주|프리랜서|대금|정산|미지급|돈을 안 줘|일당/.test(content);
    // 6. 누수
    const isLeak = /누수|물이 새|곰팡이|배관|천장|아랫집|윗집|침수|보수공사/.test(content);

    // === 금액 및 기간 추출 ===
    let money = '미상';
    let monthlyAmount = 0;

    // 한글 금액 파싱 헬퍼 함수
    const parseKoreanMoney = (text: string) => {
        let total = 0;
        const meatches = text.match(/([\d,]+)(억|천|백|십)?만?/g);
        if (!meatches) return 0;

        let currentUnit = 1;
        // 단순 정규식으로 처리하기 복잡하므로, 주요 패턴만 캐치
        // 예: "1억 2천"
        const eokMatch = text.match(/([\d,]+)\s*억/);
        const cheonMatch = text.match(/([\d,]+)\s*천/);
        const manMatch = text.match(/([\d,]+)\s*만/);

        if (eokMatch) total += parseInt(eokMatch[1].replace(/,/g, '')) * 100000000;
        if (cheonMatch) total += parseInt(cheonMatch[1].replace(/,/g, '')) * 10000000;
        else if (text.includes('천') && !cheonMatch) {
            // "1억 2천"에서 '2'만 있는 경우 등은 복잡하므로 생략하거나 단순화.
            // 여기서는 사용자 입력을 최대한 존중.
            // 간단히 "1억 2천" 패턴 매칭
            const combinedMatch = text.match(/(\d+)억\s*(\d+)천/);
            if (combinedMatch) {
                return parseInt(combinedMatch[1]) * 100000000 + parseInt(combinedMatch[2]) * 10000000;
            }
        }
        if (manMatch) total += parseInt(manMatch[1].replace(/,/g, '')) * 10000;

        // "1000만원" 같은 경우
        if (total === 0) {
            const digitOnly = text.match(/(\d+)(?:0000|만)/);
            if (digitOnly) return parseInt(digitOnly[1]) * 10000;
        }

        return total;
    };

    // 1. "1억 2천" 패턴 우선 시도
    const eokCheonMatch = content.match(/(\d+)\s*억\s*(\d+)\s*천/);
    if (eokCheonMatch) {
        money = `금 ${parseInt(eokCheonMatch[1])}억 ${parseInt(eokCheonMatch[2])}천만 원`;
    } else {
        // 기존 로직 + 단순 정수 매칭
        const moneyMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s*만\s*원/) || content.match(/(\d+)\s*원/);
        if (moneyMatch) money = moneyMatch[0];
    }

    // 월세 키워드가 명확히 있을 때만 월세 추출
    const rentMatch = content.match(/월세\s*(\d{1,3}(?:,\d{3})*)\s*만?\s*원?/);
    if (rentMatch) {
        monthlyAmount = parseInt(rentMatch[1].replace(/,/g, ''));
    }

    // 개월 수 추출
    const monthCountMatch = content.match(/(\d+)\s*(?:개월|달)/);
    const monthCount = monthCountMatch ? parseInt(monthCountMatch[1]) : 0;

    // 특별 손해 감지
    const isSpecialDamage = /대출|이자|이사|계약금|위약금|병원비|약값/.test(content);
    let specialComment = '';
    if (isSpecialDamage) {
        specialComment = '(대출이자/계약금 등 추가 손해 포함)';
    }

    // 금액 서술 로직 업데이트
    if (monthlyAmount > 0 && monthCount > 0) {
        money = `연체 차임 총 ${monthlyAmount * monthCount}만 원` + (isSpecialDamage ? ' 및 특별손해금' : '');
    } else if (money !== '미상' && isSpecialDamage) {
        money += ' 및 대출이자 등 추가 손해금';
    }

    // === 시기 추출 ===
    let when = '미상';
    const timeMatch = content.match(/(\d+)\s*(?:개월|달|주일|일)\s*(?:전|째|동안)/);
    if (timeMatch) when = timeMatch[0];

    // === 증거 상태 추출 ===
    let evidenceStatus = '확인 필요';
    if (content.includes('카톡') || content.includes('문자') || content.includes('사진') || content.includes('캡처') || content.includes('녹음')) {
        evidenceStatus = '입증 자료 일부 보유';
    }

    // === 결과 생성 ===
    let score = 50;
    let type: 'SAFE' | 'WARNING' | 'CRITICAL' = 'WARNING';
    let riskReason = '';
    const actionItems: string[] = [];
    const legalCategories: string[] = [];

    let whoForKeyFacts = '미상';
    let caseBrief = '법률 상담이 필요한 사안입니다.';

    if (isFraud) {
        score = 85;
        type = 'CRITICAL';
        riskReason = '고의적 기망 또는 재산 침탈이 의심되는 사안입니다.';
        actionItems.push('증거 자료 보전', '경찰 신고 검토', '전문 변호사 상담');
        legalCategories.push('사기죄', '손해배상', '형사고소');
        whoForKeyFacts = '의뢰인: 피해자 / 상대방: 사기 피의자';
        caseBrief = '구매 물품 사기 피해가 의심되는 사안으로, 시급한 법적 대응이 필요합니다.';
    } else if (isDefamation) {
        score = 80;
        type = 'WARNING';
        riskReason = '허위 사실 유포로 인한 영업 손실 및 명예 실추가 지속되고 있어 신속한 대응이 필요합니다.';
        actionItems.push('게시글 증거 확보(캡처)', '작성자 특정', '형사고소 검토', '민사 손해배상 청구');
        legalCategories.push('명예훼손', '업무방해', '정보통신망법 위반');
        whoForKeyFacts = '의뢰인: 피해자(사업주) / 상대방: 가해자(작성자)';
        caseBrief = '온라인상 허위 사실 유포로 인한 명예훼손 및 영업방해 피해 사안입니다.';
    } else if (isNoise) {
        score = 65;
        type = 'WARNING';
        riskReason = '지속적인 소음으로 인한 정신적 고통 및 생활권 침해가 발생하고 있습니다.';
        actionItems.push('소음 일지 작성', '관리사무소 중재 요청', '내용증명 발송', '분쟁조정위원회 신청');
        legalCategories.push('층간소음', '손해배상', '주거침해');
        whoForKeyFacts = '의뢰인: 피해자(아랫집/이웃) / 상대방: 가해자(윗집/이웃)';
        caseBrief = '지속적인 공동주택 층간소음 피해로 인한 정신적 고통 및 손해배상 청구 사안입니다.';
    } else if (isLabor) {
        score = 80;
        type = 'CRITICAL';
        riskReason = '임금(용역비) 체불로 인한 생계 위협 및 계약 위반이 발생했습니다.';
        actionItems.push('노동청 진정', '지급명령 신청', '내용증명 발송', '통장 압류 검토');
        legalCategories.push('임금체불', '용역비청구', '근로기준법');
        whoForKeyFacts = '의뢰인: 근로자(채권자) / 상대방: 사용자(채무자)';
        caseBrief = '근로 제공 또는 용역 수행에 따른 정당한 대가(임금/용역비)를 지급받지 못한 사안입니다.';
    } else if (isLeak) {
        score = 75;
        type = 'WARNING';
        riskReason = '누수로 인한 건물 손상 및 곰팡이 등 2차 피해가 확대되고 있습니다.';
        actionItems.push('피해 현장 사진 확보', '보수 공사 견적서', '내용증명 발송', '소송(손해배상)');
        legalCategories.push('누수', '손해배상', '하자보수');
        whoForKeyFacts = '의뢰인: 피해 세대주 / 상대방: 원인 제공 세대주(윗집)';
        caseBrief = '건물 누수로 인한 위생상/재산상 피해 발생 및 보수 비용 청구 사안입니다.';
    } else if (isLandlord) {
        score = 75;
        type = 'WARNING';
        riskReason = '임차인의 계약 불이행으로 재산 손실이 발생하고 있습니다.';
        actionItems.push('내용증명 발송', '계약 해지 통보', '명도소송 준비');
        legalCategories.push('명도소송', '차임지급청구');
        whoForKeyFacts = '의뢰인: 임대인 / 상대방: 임차인';
        caseBrief = '임대인인 의뢰인이 임차인으로부터 차임 등을 지급받지 못하는 사안입니다.';
    } else if (isTenant) {
        score = 70;
        type = 'WARNING';
        riskReason = '보증금 반환 지연으로 인한 손해가 우려됩니다.';
        actionItems.push('내용증명 발송', '임차권등기명령 신청');
        legalCategories.push('보증금반환', '임차권등기');
        whoForKeyFacts = '의뢰인: 임차인 / 상대방: 임대인';
        caseBrief = '임차인인 의뢰인이 임대인으로부터 보증금을 반환받지 못하는 사안입니다.';
    } else {
        score = 0;
        type = 'SAFE';
        riskReason = '구체적인 사실관계(피해 금액, 상대방의 행위 등)가 부족하여 위험도를 산정할 수 없습니다.';
        actionItems.push('육하원칙에 맞춰 구체적으로 재작성', '증거 자료(계약서, 문자 등) 확인');
        legalCategories.push('법률상담');
        whoForKeyFacts = '미상';
        caseBrief = '입력된 정보가 부족하여 법적 분석이 어렵습니다. 구체적인 상황을 입력해주세요.';
    }

    return {
        score,
        type,
        caseBrief,
        legalCategories,
        keyFacts: {
            who: whoForKeyFacts,
            when,
            money,
            evidenceStatus
        },
        riskReason,
        actionItems
    };
}
