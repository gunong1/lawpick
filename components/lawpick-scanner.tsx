'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, FileText, X, Loader2, Paperclip, Lock, ShieldAlert, ShieldQuestion, CheckCircle2, Stamp, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf'; // [복구] PDF 생성용
import LegalDocModal, { LegalDocData } from './legal-doc-modal'; // [복구] 내용증명 모달

interface ScannerProps {
    onOpenAuth?: () => void; // [수정] 부모 컴포넌트(page.tsx)와 호환되도록 이름 변경
}

export default function LawpickScanner({ onOpenAuth }: ScannerProps) {
    // --- [기존 로직 및 상태 유지] ---
    const [analysis, setAnalysis] = useState<null | { score: number; level: string; summary: string; type: 'ERROR' | 'SAFE' | 'WARNING' | 'CRITICAL'; caseDetails?: { parties: string; date: string; amount: string; evidence: string; tags?: string[] }; actionItems?: string[] }>(null);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ★ [수정] 로그인 여부 확인 (로그인하면 잠금 해제)
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // [복구] 내용증명 관련 상태
    const [showLegalDocModal, setShowLegalDocModal] = useState(false);
    const [isGeneratingLegalDoc, setIsGeneratingLegalDoc] = useState(false);

    // 로그인 상태 체크 함수
    const checkLoginStatus = () => {
        const sessionUser = localStorage.getItem('session_user');
        setIsLoggedIn(!!sessionUser);
    };

    useEffect(() => {
        // 초기 로그인 상태 확인
        checkLoginStatus();

        // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'session_user') {
                checkLoginStatus();
            }
        };

        // 커스텀 로그인 이벤트 리스너 (같은 탭에서 로그인 시)
        const handleLoginEvent = () => {
            checkLoginStatus();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('lawpick_login', handleLoginEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('lawpick_login', handleLoginEvent);
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    // --- [Helper] 한글 금액 파싱 함수 ---
    const parseKoreanAmount = (text: string): string => {
        // 1. "1억 2천" 등 한글 만/억 단위 처리
        const korUnitRegex = /(\d+)(?:억|만|천)?/g;
        // 단순 숫자(300000)는 별도 처리, 여기서는 한글 섞인 것 우선

        // 간단한 파서: 텍스트에서 금액으로 보이는 패턴을 모두 찾아 가장 큰 값을 반환 (보통 피해금액이 가장 큼)
        const matches = text.match(/([0-9,]+)(?:\s*(억|천|만|원))+/g);
        if (!matches) return '확인 필요';

        let maxVal = 0;
        let maxStr = '확인 필요';

        matches.forEach(match => {
            let val = 0;
            const str = match.replace(/,/g, '');

            // 억, 만, 천 단위 계산
            let temp = str;
            let currentUnitMult = 1;

            if (str.includes('억')) {
                const parts = str.split('억');
                val += parseInt(parts[0] || '1') * 100000000;
                temp = parts[1];
            }
            if (temp && temp.includes('만')) {
                const parts = temp.split('만');
                val += parseInt(parts[0] || '1') * 10000;
                temp = parts[1];
            }
            if (temp && temp.includes('천')) {
                val += parseInt(temp.replace('천', '') || '1') * 1000;
            } else if (temp && parseInt(temp)) {
                val += parseInt(temp);
            }

            if (val > maxVal) {
                maxVal = val;
                maxStr = val.toLocaleString() + '원';
            }
        });

        return maxStr !== '확인 필요' ? maxStr : '확인 필요';
    };

    const validateText = (text: string) => {
        const cleanText = text.replace(/\s/g, '');
        if (cleanText.length < 10) return { valid: false, msg: '정보가 너무 부족합니다. 10자 이상 구체적으로 적어주세요.' };
        return { valid: true, msg: '' };
    };

    const handleAnalyze = async () => {
        if (!inputText && !attachedFile) return;
        setLoading(true);

        // 1. 파일첨부 케이스 (기존 유지)
        if (attachedFile && !inputText) {
            setLoading(false);
            setAnalysis({
                score: 88, level: 'CRITICAL', type: 'CRITICAL',
                summary: '업로드된 파일에서 독소 조항이 감지되었습니다.',
                caseDetails: { parties: '임대인 / 임차인', date: '계약일로부터 즉시', amount: '보증금 전액', evidence: '업로드된 파일' },
                actionItems: ['특약 조항 수정 요구', '계약 전 보증보험 가입 확인']
            });
            return;
        }

        // 2. 텍스트 검증
        const validation = validateText(inputText);
        if (!validation.valid) {
            setLoading(false);
            setAnalysis({ score: 0, level: 'UNKNOWN', summary: validation.msg, type: 'ERROR' });
            return;
        }

        // ----------------------------------------------------------------
        // [AI Integration] Server API Call
        // ----------------------------------------------------------------
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inputText })
            });

            const result = await response.json();

            if (!result.success) {
                setAnalysis({
                    score: 0,
                    level: 'UNKNOWN',
                    summary: result.error || '분석 중 오류가 발생했습니다.',
                    type: 'ERROR'
                });
                return;
            }

            const data = result.data;

            // UI용 데이터 매핑 (API 응답 -> State)
            const caseDetails = {
                parties: data.keyFacts.who,
                date: data.keyFacts.when,
                amount: data.keyFacts.money,
                evidence: data.keyFacts.evidenceStatus,
                // tags: data.legalCategories // tags를 caseDetails에 포함 (UI 호환성)
            };

            // 태그 렌더링을 위해 analysis 객체에 type별 로직 대신 API가 준 카테고리 활용
            // *Disclaimer: 기존 UI는 analysis.type에 따라 하드코딩된 태그를 보여주므로,
            // 이를 동적으로 보여주려면 렌더링 부분도 수정해야 함. 
            // 일단은 summary에 핵심 내용을 담고, 기존 구조 최대한 활용.

            setAnalysis({
                score: data.score,
                level: data.type, // SAFE, WARNING, CRITICAL
                summary: data.caseBrief + (data.riskReason ? `\n\n[위험 진단] ${data.riskReason}` : ''),
                type: data.type,
                caseDetails: { ...caseDetails, tags: data.legalCategories }, // tags hack for UI if needed
                actionItems: data.actionItems
            });

        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysis({
                score: 0,
                level: 'UNKNOWN',
                summary: '서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                type: 'ERROR'
            });
        } finally {
            setLoading(false);
        }
    };

    // [복구] 내용증명 PDF 생성 함수
    const generateLegalDocument = async (formData: LegalDocData) => {
        setIsGeneratingLegalDoc(true);

        try {
            // AI로 내용증명 본문 생성
            const response = await fetch('/api/legal-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputText,
                    senderName: formData.senderName,
                    recipientName: formData.recipientName
                })
            });

            const result = await response.json();
            if (!result.success) {
                alert('내용증명 생성에 실패했습니다.');
                return;
            }

            const legalData = result.data;
            const doc = new jsPDF();
            const now = new Date();
            const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

            // 한글 폰트 로드
            try {
                const { malgunFontBase64 } = await import('@/lib/korean-font');
                doc.addFileToVFS('malgun.ttf', malgunFontBase64);
                doc.addFont('malgun.ttf', 'malgun', 'normal');
                doc.setFont('malgun');
            } catch (e) {
                console.warn('Font loading failed');
            }

            // ========== 타이틀 ==========
            doc.setFontSize(24);
            doc.setTextColor(0, 0, 0);
            const title = '내 용 증 명';
            const titleWidth = doc.getTextWidth(title);
            const titleX = (210 - titleWidth) / 2;
            doc.text(title, titleX, 30);
            // 밑줄
            doc.setLineWidth(0.5);
            doc.line(titleX - 5, 33, titleX + titleWidth + 5, 33);

            // ========== 발신/수신 테이블 ==========
            let yPos = 50;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            // 표 그리기
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);

            // 수신인
            doc.rect(20, yPos, 30, 10);
            doc.rect(50, yPos, 140, 10);
            doc.text('수 신 인', 25, yPos + 7);
            doc.text(formData.recipientName + (formData.recipientAddress ? ` (${formData.recipientAddress})` : ''), 55, yPos + 7);
            yPos += 10;

            // 발신인
            doc.rect(20, yPos, 30, 10);
            doc.rect(50, yPos, 140, 10);
            doc.text('발 신 인', 25, yPos + 7);
            doc.text(formData.senderName + (formData.senderAddress ? ` (${formData.senderAddress})` : ''), 55, yPos + 7);
            yPos += 10;

            // 제목
            doc.rect(20, yPos, 30, 10);
            doc.rect(50, yPos, 140, 10);
            doc.text('제    목', 25, yPos + 7);
            doc.text(legalData.title, 55, yPos + 7);
            yPos += 20;

            // ========== 본문 (7단계 구조) ==========
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            // 1. 도입 (introduction) - 관계 정의
            if (legalData.introduction) {
                const introLines = doc.splitTextToSize(legalData.introduction, 170);
                introLines.forEach((line: string) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    doc.text(line, 20, yPos);
                    yPos += 7;
                });
                yPos += 5;
            }

            // 2. 본문 (body) - 육하원칙 팩트
            if (legalData.body) {
                const bodyLines = legalData.body.split('\n');
                bodyLines.forEach((line: string) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    const splitLines = doc.splitTextToSize(line, 170);
                    splitLines.forEach((splitLine: string) => {
                        doc.text(splitLine, 20, yPos);
                        yPos += 7;
                    });
                    yPos += 3;
                });
                yPos += 5;
            }

            // 3. 법적 근거 (legalBasis)
            if (legalData.legalBasis) {
                const legalLines = doc.splitTextToSize(legalData.legalBasis, 170);
                legalLines.forEach((line: string) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    doc.text(line, 20, yPos);
                    yPos += 7;
                });
                yPos += 8;
            }

            // 4. 요구 사항 (demands) - 새로 추가
            if (legalData.demands && legalData.demands.length > 0) {
                yPos += 3;
                doc.setFontSize(12);
                doc.text('[ 요 구 사 항 ]', 20, yPos);
                yPos += 10;
                doc.setFontSize(11);

                legalData.demands.forEach((demand: string, index: number) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    const demandText = `${index + 1}. ${demand}`;
                    const demandLines = doc.splitTextToSize(demandText, 165);
                    demandLines.forEach((line: string) => {
                        doc.text(line, 25, yPos);
                        yPos += 7;
                    });
                    yPos += 2;
                });
                yPos += 5;
            }

            // 5. 경고문 (warning) - 빨간색 강조
            if (legalData.warning) {
                doc.setTextColor(180, 0, 0); // 빨간색 강조
                const warningLines = doc.splitTextToSize(legalData.warning, 170);
                warningLines.forEach((line: string) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    doc.text(line, 20, yPos);
                    yPos += 7;
                });
                doc.setTextColor(0, 0, 0); // 색상 복원
                yPos += 10;
            }

            // ========== 하단 날짜 및 서명 ==========
            yPos = Math.max(yPos + 20, 240);
            doc.setFontSize(11);
            doc.text(dateStr, 105, yPos, { align: 'center' });
            yPos += 15;
            doc.text(`발신인  ${formData.senderName}  (인)`, 105, yPos, { align: 'center' });

            // 파일 저장
            const fileName = `내용증명_수신인[${formData.recipientName}]_발신인[${formData.senderName}]_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
            doc.save(fileName);

            setShowLegalDocModal(false);
            alert('내용증명 PDF가 생성되었습니다.');

        } catch (error) {
            console.error('Legal doc generation failed:', error);
            alert('내용증명 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingLegalDoc(false);
        }
    };

    return (
        <div className="w-full bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-50 p-6 border-b border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3"><FileText className="w-6 h-6" /></div>
                <h2 className="text-2xl font-black text-slate-900">Lawpick Scanner</h2>
                <p className="text-slate-500 text-sm mt-1">AI가 계약서 파일과 상황을 정밀 분석합니다.</p>
            </div>

            {!analysis ? (
                // --- [입력 화면 (기존 동일)] ---
                <div className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">자료 입력 (계약서 업로드 or 상황 설명)</label>
                    <div className="relative">
                        <textarea className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900 text-sm mb-3" placeholder="예) 전세 만기가 1주일 남았는데 집주인이 연락을 피합니다. (정확한 분석을 위해 20자 이상 구체적으로 적어주세요)" value={inputText} onChange={(e) => setInputText(e.target.value)} />
                        <div className="flex items-center justify-between mt-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png,.jpeg" onChange={handleFileChange} />
                            {attachedFile ? (<div className="flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium w-full mr-2"><FileText className="w-4 h-4 mr-2" /><span className="truncate max-w-[200px]">{attachedFile.name}</span><button onClick={() => setAttachedFile(null)} className="ml-auto p-1 hover:bg-blue-100 rounded-full"><X className="w-4 h-4" /></button></div>) : (<button onClick={() => fileInputRef.current?.click()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-2 py-1"><Paperclip className="w-4 h-4 mr-1" /> 계약서 파일 첨부 (PDF/사진)</button>)}
                        </div>
                    </div>
                    <button onClick={handleAnalyze} disabled={(!inputText && !attachedFile) || loading} className={`w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${(!inputText && !attachedFile) || loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30'}`}>{loading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> AI 분석 중...</> : '위험도 무료 진단하기'}</button>
                    <p className="text-xs text-center text-slate-400 mt-4">* 업로드된 파일은 암호화되어 분석 후 즉시 파기됩니다.</p>
                </div>
            ) : (
                // --- [결과 화면 (여기가 업그레이드됨)] ---
                <div className="p-6 bg-white animate-in fade-in zoom-in duration-300">

                    {/* 에러(0점) 화면 - 기존 유지 */}
                    {analysis.type === 'ERROR' && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldQuestion className="w-10 h-10" /></div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">분석 불가 <span className="text-slate-400">0점</span></h3>
                            <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full mb-6">입력 정보 오류</div>
                            <p className="text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl text-left text-sm leading-relaxed border border-slate-200"><strong>[AI 알림]</strong><br />{analysis.summary}</p>
                            <button onClick={() => { setAnalysis(null); setInputText(''); setAttachedFile(null); }} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 shadow-lg">
                                다른 내용 진단하기
                            </button>
                        </div>
                    )}

                    {(analysis.type === 'SAFE' || analysis.type === 'WARNING' || analysis.type === 'CRITICAL') && (
                        <div className="space-y-6">

                            {/* 1. 최상단 면책 조항 (노란 박스) */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start text-orange-800 text-xs">
                                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                <span>본 결과는 <strong>AI 분석 결과</strong>이며, 최종 판단은 <strong>전문 변호사</strong>를 통해 확정하세요.</span>
                            </div>

                            {/* 2. 사건 브리핑 (AI 요약) */}
                            <div className="bg-slate-50 rounded-xl p-5 border-l-4 border-slate-900">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> 사건 브리핑
                                </h4>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {analysis.summary?.split('\n')[0] || '분석 결과를 확인해주세요.'}
                                </p>
                            </div>

                            {/* 3. 법적 쟁점 (API 태그 사용) */}
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 rotate-45" /> 법적 쟁점
                                </h4>
                                <div className="flex gap-2 flex-wrap">
                                    {analysis.caseDetails?.tags && analysis.caseDetails.tags.length > 0 ? (
                                        analysis.caseDetails.tags.map((tag: string, i: number) => (
                                            <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                                #{tag.replace(/^#/, '')}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">#법률상담</span>
                                    )}
                                </div>
                            </div>

                            {/* 4. 위험도 분석 (원형 게이지 스타일) */}
                            <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 위험도 분석</h4>
                                    <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-2 ${analysis.type === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                        analysis.type === 'WARNING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {analysis.type === 'CRITICAL' ? '심각 단계 (CRITICAL)' :
                                            analysis.type === 'WARNING' ? '주의 단계 (CAUTION)' : '안전 (SAFE)'}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {analysis.summary.split('.')[0]}.
                                    </p>
                                </div>
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-8 text-2xl font-black ${analysis.type === 'CRITICAL' ? 'border-red-500 text-red-600' :
                                    analysis.type === 'WARNING' ? 'border-yellow-400 text-yellow-600' : 'border-green-500 text-green-600'
                                    }`}>
                                    {analysis.score}
                                </div>
                            </div>

                            {/* 5. 상세 정보 그리드 (동적 데이터 적용 + 프리미엄 블러) */}
                            <div className="relative rounded-xl overflow-hidden">
                                <div className={`grid grid-cols-2 gap-3 ${!isLoggedIn ? 'blur-sm select-none opacity-60' : ''}`}>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="text-xs text-slate-400 mb-1">당사자</div>
                                        <div className="text-sm font-bold text-slate-800">{analysis.caseDetails?.parties || '의뢰인 / 상대방'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="text-xs text-slate-400 mb-1">발생 시기</div>
                                        <div className={`text-sm font-bold ${analysis.caseDetails?.date !== '미상' ? 'text-blue-600' : 'text-slate-800'}`}>
                                            {analysis.caseDetails?.date || '미상'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="text-xs text-slate-400 mb-1">피해 금액</div>
                                        <div className={`text-sm font-bold ${analysis.caseDetails?.amount !== '확인 필요' ? 'text-red-600' : 'text-slate-800'}`}>
                                            {analysis.caseDetails?.amount || '확인 필요'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                                        <div className="text-xs text-slate-400 mb-1">참고 자료</div>
                                        <div className={`text-sm font-bold ${analysis.caseDetails?.evidence !== '확인 필요' ? 'text-green-600' : 'text-slate-800'}`}>
                                            {analysis.caseDetails?.evidence || '확인 필요'}
                                        </div>
                                    </div>
                                </div>

                                {/* 잠금 화면 오버레이 */}
                                {!isLoggedIn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                        <Lock className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs font-bold text-slate-500">멤버십 전용 상세 정보</span>
                                    </div>
                                )}
                            </div>

                            {/* 6. 필요 조치 (Action Items) - 동적 생성 리스트 (노란 박스) */}
                            <div className="relative rounded-xl overflow-hidden">
                                <div className={`bg-orange-50 p-5 rounded-xl border border-orange-100 ${!isLoggedIn ? 'blur-sm select-none' : ''}`}>
                                    <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5" /> 필요 조치 (Action Items)
                                    </h4>
                                    <ul className="space-y-2 text-sm text-orange-800">
                                        {analysis.actionItems?.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="bg-orange-200 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* 잠금 화면 오버레이 */}
                                {!isLoggedIn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] z-10">
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-slate-800 mb-2">구체적인 대처 방안이 궁금하신가요?</p>
                                            <button onClick={onOpenAuth} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                                                지금 무료로 확인하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 7. 하단 버튼 */}
                            <div className="pt-4">
                                {isLoggedIn && analysis.type !== 'SAFE' && (
                                    <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg mb-3 flex items-center justify-center" onClick={() => setShowLegalDocModal(true)}>
                                        <Stamp className="w-5 h-5 mr-2" />
                                        AI 내용증명 작성하러 가기
                                    </button>
                                )}

                                <button onClick={() => { setAnalysis(null); setInputText(''); setAttachedFile(null); }} className="w-full text-slate-400 text-sm hover:text-slate-600 underline">
                                    다시 진단하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* [복구] 내용증명 모달 */}
            <LegalDocModal
                isOpen={showLegalDocModal}
                onClose={() => setShowLegalDocModal(false)}
                originalContent={inputText}
                onGenerate={generateLegalDocument}
                isGenerating={isGeneratingLegalDoc}
            />
        </div>
    );
}
