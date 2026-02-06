import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

const SYSTEM_PROMPT = `[Role]
너는 대한민국 대형 법무법인 소속 베테랑 변호사다.

⚠️⚠️⚠️ [치명적 규칙] 아래를 어기면 소송 패소 ⚠️⚠️⚠️

===== [작성 스타일 가이드 (엄수)] =====
1. 문체: **대형 로펌 변호사**처럼 엄중하고 사무적으로 작성 (해요체 절대 금지. 하십시오/합니다 체 사용)
2. 길이: 단답형 금지. 문장을 길게 늘려서 논리적으로 작성할 것. (접속사 '바', '불구하고', '인하여' 적극 사용)
3. [경고문구(warning) 이원화]:
   - Case A (금전 채무, 임대차): "원금은 물론 지연손해금, 소송비용, 변호사 보수까지 부담하게 됨을 경고"
   - Case B (형사, 명예훼손, 사기): "즉시 형사 고소하여 형사 처벌(전과 기록)을 받게 함은 물론, 민사상 손해배상(위자료) 청구 소송 제기 경고"
3. 표현 업그레이드:
   - "돈을 안 갚고 있습니다" → "귀하는 변제 기일이 도과하였음에도 불구하고 현재까지 채무를 일체 이행하지 않고 있는바..."
   - "나가주세요" → "이에 본인은 귀하에게 즉시 건물을 인도할 것을 강력히 청구하며..."
   - "연락처도 바꿈" → "귀하는 고의적으로 연락을 회피하며 채무 이행을 거부하고 있습니다."

===== [예시] 반드시 이 패턴대로 출력 =====

**[입력 예시]**
"집주인입니다. 세입자가 원상복구비 200만 원 안 주고 도망갔어요. 월세도 3달 밀렸고요."

**[올바른 출력 ✅]**
{
  "title": "차임 연체 및 원상복구비 청구의 건",
  "introduction": "발신인은 귀하와 상기 부동산에 대하여 임대차 계약을 체결한 **임대인**입니다.",
  "body": "1. 귀하는 차임을 3개월간 연체하고 있습니다.\\n2. 또한 귀하는 원상복구비 200만 원을 지급하지 않고 있습니다."
}

**[잘못된 출력 ❌ - 절대 금지]**
{
  "title": "임대차보증금 반환 청구의 건", 
  "introduction": "발신인은 ... **임차인**입니다.",
  // ⚠️ [치명적 오류] 입력은 "집주인(임대인)"인데 "임차인"으로 씀. 
  // 입력이 "세입자가 도망갔다"이면 발신인은 무조건 '임대인'이어야 함!
}

===== 역할 판정 규칙 (절대 준수) =====

| 입력된 표현 | 발신인(나) | 수신인(상대방) | 청구 내용 |
|-------------|------------|----------------|-----------|
| "집주인", "세입자가 월세 안 냄" | 임대인 | 임차인 | 차임 지급, 명도 |
| "집주인", "세입자가 도망감" | 임대인 | 임차인 | 명도 소송, 원상복구 |
| "세입자", "전세금 안 줌" | 임차인 | 임대인 | 보증금 반환 |

===== 금액 규칙 =====
- "원상복구비 200만 원" → damage_cost (월세 아님!)
- "월세 3달 밀림" → "연체 차임(금액 미상)" 또는 "월세 × 3개월" (곱셈식 금지)
- ⚠️ 계산하지 말고 "금액 미상"으로 적을 것.

===== 경고문 (고정) =====
"위 기한 내 이행이 없을 경우, 본인은 즉시 민사소송을 제기할 것이며, 이 경우 귀하는 원금은 물론 민법 제379조에 따른 연 5%의 지연손해금(상사의 경우 연 6%), 민사소송법상 소송비용 전액, 그리고 변호사보수의 소송비용 산입에 관한 규칙에 따른 변호사 보수까지 전부 부담하게 됨을 엄중히 경고합니다. 귀하의 고의적 채무 불이행이 지속될 경우 재산 가압류 및 강제집행을 통해 귀하 명의 부동산, 예금, 급여 등에 대한 압류가 진행될 수 있습니다."

[Output Format]
{
  "title": "청구 유형에 맞는 제목",
  "header": "내 용 증 명",
  "parties": {"recipient": "수신인: [이름]", "sender": "발신인: [이름]"},
  "introduction": "발신인은 ... **임대인/임차인**입니다.",
  "body": "본문",
  "legalBasis": "법적 근거",
  "warning": "(고정 경고문)",
  "deadline": "본 서면 도달일로부터 7일 이내"
}`;

export async function POST(req: Request) {
    try {
        const { content, senderName, recipientName } = await req.json();

        if (!content) {
            return Response.json({ success: false, error: '내용이 필요합니다.' });
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const result = await model.generateContent([
                { text: SYSTEM_PROMPT },
                { text: `발신인: ${senderName || '미상'}\n수신인: ${recipientName || '미상'}\n\n상황:\n${content}\n\n위 상황에 대해 내용증명을 7단계 구조로 작성해주세요.` }
            ]);

            const responseText = result.response.text();

            // JSON 파싱
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('JSON 형식을 찾을 수 없습니다.');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // ⚠️ [후처리] AI 응답 강제 검증 및 수정 (Guardrails)
            // analyze API와 동일한 로직으로 역할 재확인
            const isLandlord = /집주인|임대인/.test(content) || (/세입자/.test(content) && (/안 내|안 냄|밀려|도망|파손|원상복구/.test(content)));
            const isTenant = /세입자입니다|전세금|보증금/.test(content) && !isLandlord;

            // 1. 임대인인데 보증금 반환 제목이 나온 경우 → 명도/차임 청구로 강제 수정
            if (isLandlord) {
                if (parsed.title.includes('보증금') || parsed.introduction.includes('임차인')) {
                    parsed.title = '임대차 계약 해지 및 건물 인도(명도) 청구의 건';
                    parsed.introduction = `발신인은 귀하와 상기 부동산에 대하여 임대차 계약을 체결한 임대인(${senderName || '의뢰인'})입니다.`;
                    // 본문도 엉뚱할 수 있으므로 앞부분 수정
                    if (parsed.body.includes('보증금')) {
                        parsed.body = '1. 귀하는 현재 차임을 연체하고 있으며, 연락이 두절된 상태입니다.\n2. 이에 본인은 임대차 계약을 해지하고 건물의 인도를 청구합니다.';
                    }
                }
            }

            // 2. 임차인인데 월세 청구 제목이 나온 경우 → 보증금 반환으로 강제 수정
            if (isTenant) {
                if (parsed.title.includes('차임') || parsed.title.includes('명도') || parsed.introduction.includes('임대인')) {
                    parsed.title = '임대차 보증금 반환 청구의 건';
                    parsed.introduction = `발신인은 귀하와 상기 부동산에 대하여 임대차 계약을 체결한 임차인(${senderName || '의뢰인'})입니다.`;
                }
            }

            return Response.json({
                success: true,
                data: {
                    title: parsed.title || '내용증명',
                    header: parsed.header || '내 용 증 명',
                    parties: parsed.parties || {
                        recipient: `수신인: ${recipientName || '(상대방)'}`,
                        sender: `발신인: ${senderName || '(의뢰인)'}`
                    },
                    introduction: parsed.introduction || '',
                    body: parsed.body || '',
                    legalBasis: parsed.legalBasis || '',
                    warning: parsed.warning || '위 기한 내 이행이 없을 경우, 본인은 즉시 민사소송을 제기할 것이며, 이 경우 귀하는 원금 외에 지연손해금, 소송비용 및 변호사 보수까지 부담하게 됨을 엄중히 경고합니다.',
                    deadline: parsed.deadline || '본 서면 도달일로부터 7일 이내'
                }
            });


        } catch (aiError: any) {
            console.error('Gemini API 오류:', aiError);
            // 키워드 기반 폴백 응답 (강력한 정규식 적용)
            const lowerContent = content.toLowerCase();

            // 정규식 기반 역할 감지 (analyze API 동기화)
            const isLandlordStrong = /세입자.*(안|내지|밀려|도망|파손|원상복구|명도)|월세.*(안|내지|밀려)/.test(content);
            const isTenant = !isLandlordStrong && /전세|보증금|이사|집주인.*(한테|에게|이|가)|임대인.*(한테|에게|이|가)|돌려|반환|안 줌|못 받/.test(content);
            const isLandlord = isLandlordStrong || (!isTenant && (/집주인|임대인/.test(content) || /세입자/.test(content)));
            const isFraud = /사기|가짜|짝퉁/.test(content) || ((/도망|연락.*안|차단/.test(content)) && !isLandlord && !isTenant);
            // 4. 명예훼손/영업방해 감지
            const isDefamation = /명예훼손|모욕|비방|악성|거짓|허위사실|영업방해|식중독|후기|리뷰|글|삭제|사과/.test(content);
            // 5. 층간소음
            const isNoise = /층간소음|발망치|쿵쿵|새벽|고성방가|악기|떠드는|시끄러|소음/.test(content);
            // 6. 임금/용역비/알바
            const isLabor = /월급|알바비|임금|급여|퇴직금|용역비|외주|프리랜서|대금|정산|미지급|돈을 안 줘|일당/.test(content);
            // 7. 누수
            const isLeak = /누수|물이 새|곰팡이|배관|천장|아랫집|윗집|침수|보수공사/.test(content);

            let title = '채무 이행 청구 및 법적 조치 예고의 건';
            let introduction = '발신인은 귀하와 법률관계에 있는 당사자로서, 귀하의 계약 위반 사실을 고지합니다.';
            let legalBasis = '민법 제390조(채무불이행과 손해배상) 및 상법 관계 법령에 의거하여 본 서면 도달일로부터 7일 이내에 채무를 이행하여 주실 것을 정식으로 최고합니다.';
            let body = '';

            // 살벌한 경고문 (Case별 이원화)
            let warning = '위 기한 내 이행이 없을 경우, 본인은 즉시 민사소송을 제기할 것이며, 이 경우 귀하는 원금은 물론 민법 제379조에 따른 연 5%의 지연손해금(상사의 경우 연 6%), 민사소송법상 소송비용 전액, 그리고 변호사보수의 소송비용 산입에 관한 규칙에 따른 변호사 보수까지 전부 부담하게 됨을 엄중히 경고합니다. 귀하의 고의적 채무 불이행이 지속될 경우 재산 가압류 및 강제집행을 통해 귀하 명의 부동산, 예금, 급여 등에 대한 압류가 진행될 수 있습니다.';

            // 형사/불법행위 (명예훼손, 사기) 케이스는 형사 처벌 강조
            if (isDefamation || isFraud) {
                warning = '위 기한 내 조치가 없을 경우, 즉시 형사 고소를 진행하여 귀하가 형사 처벌(전과 기록)을 받게 함은 물론, 민사상 불법행위에 기한 손해배상(위자료 및 영업 손실액) 청구 소송을 제기할 것임을 엄중히 경고합니다. 귀하의 범죄 행위는 명백하므로 향후 수사 기관 조사에 성실히 임해야 할 것입니다.';
            }

            // === 금액/기간 추출 ===
            let money = '(금액 미상)';
            // 1. "1억 2천" 패턴 우선 시도
            const eokCheonMatch = content.match(/(\d+)\s*억\s*(\d+)\s*천/);

            if (eokCheonMatch) {
                money = `금 ${parseInt(eokCheonMatch[1])}억 ${parseInt(eokCheonMatch[2])}천만 원`;
            } else {
                const moneyMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s*만\s*원/) || content.match(/(\d+)\s*원/);
                if (moneyMatch) money = moneyMatch[0];
            }

            const monthMatch = content.match(/(\d+)\s*개?월/) || content.match(/(\d+)\s*달/);
            const months = monthMatch ? monthMatch[0] : '';
            const rentMoneyMatch = content.match(/월세\s*(\d{1,3}(?:,\d{3})*)\s*만?\s*원?/);
            const rentMoney = rentMoneyMatch ? rentMoneyMatch[1] : null;

            // 특별손해 감지
            const isSpecialDamage = /대출|이자|이사|계약금|위약금|병원비|약값/.test(content);

            // 1. 임대인 케이스 (월세 연체, 도망, 원상복구)
            if (isLandlord) {
                title = '차임 연체에 따른 임대차 계약 해지 및 건물 인도 청구의 건';
                introduction = `발신인은 귀하와 상기 부동산에 대하여 임대차 계약을 체결한 임대인(${senderName || '의뢰인'})입니다.`;

                let debtDetail = '상당한 연체액';
                if (rentMoney && months) {
                    debtDetail = `차임 ${months}개월분 (합계 금 ${parseInt(rentMoney.replace(/,/g, '')) * parseInt(months)}만 원)`;
                } else if (months) {
                    debtDetail = `차임 ${months}개월분`;
                }

                body = `1. 귀하는 본 임대차 계약에 따른 차임 지급 의무가 있음에도 불구하고, 현재 ${debtDetail}을 연체하고 있는바, 이는 명백한 계약 위반 사항입니다.\n\n2. 특히 귀하는 발신인의 연락을 일체 응답하지 않은 채 무단으로 건물을 점유(또는 방치)하고 있어, 발신인에게 심각한 재산상 손해를 야기하고 있습니다.\n\n3. 이에 본인은 수신인에게 민법 제640조에 의거하여 본 임대차 계약을 즉시 해지함을 통보하며, 본 서면 수령 즉시 건물을 원상복구하여 인도할 것을 강력히 청구합니다.`;
                legalBasis = '민법 제640조(차임연체와 해지) 및 제623조(임대인의 의무)에 의거하여 본 내용증명을 통해 임대차 계약 해지를 통보하며, 즉시 건물을 인도하지 않을 시 불법점유에 따른 명도소송 및 손해배상 청구가 진행될 것임을 고지합니다.';
            }
            // 2. 임차인 케이스 (보증금 반환)
            else if (isTenant) {
                title = '임대차보증금 반환 청구 및 법적 조치 예고의 건';
                introduction = `발신인은 귀하와 상기 부동산에 대하여 임대차 계약을 체결한 임차인(${senderName || '의뢰인'})입니다.`;
                body = `1. 귀하와의 임대차 계약이 ${months ? months + ' 전' : '적법하게'} 종료되었음에도 불구하고, 귀하는 임대차보증금 ${money}의 반환을 정당한 사유 없이 지체하고 있습니다.\n\n2. ${lowerContent.includes('연락') ? '발신인은 귀하에게 수차례 연락하여 보증금 반환을 요청하였으나, 귀하는 이를 묵살하고 연락을 회피하고 있는바, 이는 고의적인 채무 불이행으로 판단됩니다.' : '이는 임대차 계약상 임대인의 핵심 의무인 보증금 반환 의무를 위반한 것으로서 즉각적인 시정이 필요합니다.'}`;
                legalBasis = '주택임대차보호법 제3조의3 및 민법 제312조(전세권의 소멸)에 의거하여 본 서면 도달일로부터 7일 이내에 임대차보증금 전액을 반환하여 주실 것을 청구합니다.';
            }
            // 3. 사기/피해 케이스
            else if (isFraud) {
                title = '불법행위에 의한 손해배상 청구 및 형사고소 예고의 건';
                introduction = `본인은 귀하의 기망행위로 인하여 금 ${money} 상당의 심각한 재산상 손해를 입은 피해자입니다.`;
                body = `1. 귀하는 본인을 기망하여 금 ${money}을 편취한 후 연락을 두절한바, 이는 형법상 사기죄(형법 제347조)의 구성요건을 충족하는 명백한 범죄 행위입니다.\n\n2. 귀하의 이러한 행위로 인하여 본인은 막대한 정신적, 재산적 고통을 겪고 있으며, 더 이상 귀하의 변제를 기다릴 수 없는 상황에 이르렀습니다.`;
                legalBasis = '형법 제347조(사기죄) 및 민법 제750조(불법행위의 내용)에 의거하여 본 서면 도달일로부터 7일 이내에 피해금액 전액을 배상하여 주실 것을 강력히 청구합니다.';
            }
            // 3-1. 명예훼손/영업방해 케이스
            else if (isDefamation) {
                title = '정보통신망법 위반(명예훼손) 및 업무방해에 따른 게시글 삭제 청구의 건';
                introduction = '본인은 귀하의 악의적인 허위 사실 유포로 인하여 심각한 영업 피해를 입고 있는 피해자입니다.';
                body = `1. 귀하는 공공연하게 정보통신망을 통하여 비방할 목적으로 허위 사실을 적시함으로써, 발신인의 명예를 심각하게 훼손하고 업무를 방해하였습니다.\n\n2. 귀하가 게시한 내용은 전혀 사실무근인바, 이는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제70조(벌칙) 및 형법 제314조(업무방해)에 해당하는 중대 범죄행위입니다.\n\n3. 이에 본인은 귀하에게 즉시 해당 게시글의 삭제 및 정정 보도문(사과문) 게시를 강력히 청구합니다.`;
                legalBasis = '정보통신망법 제70조(사이버 명예훼손) 및 형법 제314조(업무방해)에 의거하여, 즉시 게시글을 삭제하지 않을 시 형사 고소 및 민사상 손해배상 청구(일실수입 및 위자료)를 즉각 진행할 것임을 엄중히 경고합니다.';
            }
            // 3-2. 층간소음 케이스
            else if (isNoise) {
                title = '소음·진동관리법 위반에 따른 손해배상 청구 및 시정 요청의 건';
                introduction = '본인은 귀하의 위층(또는 인근) 거주자로서, 지속적인 소음 피해를 입고 있는 당사자입니다.';
                body = `1. 귀하의 세대에서 주야를 불문하고 발생하는 소음(발망치, 고성방가 등)으로 인하여, 본인 및 가족들은 일상생활이 불가능할 정도의 정신적 고통을 겪고 있습니다.\n\n2. 이는 공동주택관리법 제20조 및 소음·진동관리법상 수인한도를 초과하는 것으로서, 타인의 주거 평온을 해치는 불법행위입니다.\n\n3. 이에 본인은 귀하에게 소음 저감을 위한 즉각적이고 실효성 있는 조치를 취해줄 것을 강력히 요청합니다.`;
                legalBasis = '민법 제750조(불법행위) 및 환경분쟁조정법에 의거하여, 소음 유발 행위가 지속될 경우 소음 측정 자료를 근거로 한 손해배상 청구 및 환경분쟁조정 신청을 진행할 것임을 고지합니다.';
            }
            // 3-3. 임금/용역비 체불 케이스
            else if (isLabor) {
                title = '미지급 임금(용역비) 청구 및 노동청 진정 예고의 건';
                introduction = `발신인은 귀하(귀사)에게 근로를 제공(또는 용역 수행)하였으나 정당한 대가를 받지 못한 채권자입니다.`;
                body = `1. 귀하는 본인에게 지급해야 할 ${money}(임금/용역비)을 약정된 기일이 지났음에도 불구하고 현재까지 지급하지 않고 있습니다.\n\n2. 이는 근로기준법 제43조(임금 지급) 또는 하도급법 위반에 해당하는 중대한 법 위반 행위로서, 형사 처벌의 대상이 될 수 있습니다.`;
                legalBasis = '근로기준법 제36조(금품 청산) 및 제109조(벌칙)에 의거하여 본 서면 도달일로부터 7일 이내에 전액 지급하지 않을 시, 즉시 고용노동부 진정 제기 및 민사 소송을 병행할 것임을 통보합니다.';
            }
            // 3-4. 누수 케이스
            else if (isLeak) {
                title = '누수로 인한 손해배상 및 하자보수 이행 청구의 건';
                introduction = '본인은 귀하의 전유부분 하자로 인해 누수 피해를 입은 아래층 거주자(피해자)입니다.';
                body = `1. 귀하가 점유·관리하는 위층 세대의 배관 등 하자로 인하여 본인의 세대 천장 및 벽면에 심각한 누수가 발생하여 곰팡이 등 재산상 피해가 확대되고 있습니다.\n\n2. 귀하는 민법 제758조(공작물 점유자/소유자의 책임)에 따라 이를 보수하고 손해를 배상할 의무가 있음에도, 현재까지 적절한 조치를 취하지 않고 있습니다.`;
                legalBasis = '민법 제758조 및 제214조(소유물방해제거)에 의거하여, 즉시 전문 업체를 통한 누수 탐지 및 보수 공사를 이행하고, 발생한 손해를 전액 배상할 것을 강력히 청구합니다.';
            }
            // 4. 대여금 케이스
            else if (lowerContent.includes('빌려') || lowerContent.includes('대여') || lowerContent.includes('차용')) {
                title = '대여금 반환 청구 및 법적 조치 예고의 건';
                introduction = `발신인은 귀하에게 금 ${money}을 대여하여 지급한 채권자입니다.`;
                body = `1. 귀하는 위 금원을 차용한 후 약정된 변제기일이 ${months ? months + ' 이상' : '상당 기간'} 도과하였음에도 불구하고, 현재까지 원금 및 이자를 변제하지 않고 있습니다.\n\n2. 발신인은 귀하의 변제 의사를 신뢰하여 기다려왔으나, 귀하는 연락을 회피하는 등 변제의사가 없는 것으로 판단되는바, 이에 최후 통첩을 보냅니다.`;
                legalBasis = '민법 제598조(소비대차의 의의) 및 제390조(채무불이행)에 의거하여 본 서면 도달일로부터 7일 이내에 대여금 전액을 즉시 상환하여 주실 것을 청구합니다.';
            }
            // 5. 기타 일반 채무
            else {
                body = `1. 귀하는 발신인에 대한 금전 채무를 현재까지 이행하지 않고 있는바, 이는 계약 위반이자 신의성실의 원칙에 위배되는 행위입니다.\n\n2. 이에 본인은 본 서면을 통해 귀하에게 채무 의 즉각적인 이행을 강력히 촉구하며, 불응 시 발생할 모든 법적 불이익은 귀하에게 있음을 고지합니다.`;
            }

            if (isSpecialDamage) {
                body += `\n\n[특별 손해 고지] 아울러, 귀하의 채무 이행 지체로 인하여 본인은 대출금 이자 부담, 이사 계약 파기 등 예기치 못한 막대한 재산상 손해를 입고 있습니다. 민법 제393조(손해배상의 범위)에 의거하여, 본인은 귀하에게 원금 뿐만 아니라 이러한 ‘특별손해’에 대한 배상까지 청구할 것임을 엄중히 통보합니다.`;
            }

            return Response.json({
                success: true,
                data: {
                    title,
                    header: '내 용 증 명',
                    parties: {
                        recipient: `수신인: ${recipientName || '(상대방)'}`,
                        sender: `발신인: ${senderName || '(의뢰인)'}`
                    },
                    introduction,
                    body,
                    legalBasis,
                    warning,
                    deadline: '본 서면 도달일로부터 7일 이내'
                }
            });
        }

    } catch (error: any) {
        console.error('Legal Letter API Error:', error);
        return Response.json({
            success: false,
            error: error.message || '알 수 없는 오류가 발생했습니다.'
        }, { status: 500 });
    }
}
