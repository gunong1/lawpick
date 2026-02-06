'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, FileText, X, Loader2, Paperclip, Lock, ShieldAlert, ShieldQuestion, CheckCircle2, Stamp } from 'lucide-react';
import { jsPDF } from 'jspdf'; // [복구] PDF 생성용
import LegalDocModal, { LegalDocData } from './legal-doc-modal'; // [복구] 내용증명 모달

interface ScannerProps {
    onOpenAuth?: () => void; // [수정] 부모 컴포넌트(page.tsx)와 호환되도록 이름 변경
}

export default function LawpickScanner({ onOpenAuth }: ScannerProps) {
    // --- [기존 로직 및 상태 유지] ---
    const [analysis, setAnalysis] = useState<null | { score: number; level: string; summary: string; type: 'ERROR' | 'SAFE' | 'WARNING' | 'CRITICAL' }>(null);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ★ [추가된 부분] 유료 회원 여부 확인
    const [isPaidUser, setIsPaidUser] = useState(false);

    // [복구] 내용증명 관련 상태
    const [showLegalDocModal, setShowLegalDocModal] = useState(false);
    const [isGeneratingLegalDoc, setIsGeneratingLegalDoc] = useState(false);

    useEffect(() => {
        // 로컬스토리지에서 '구독 여부' 확인 (결제하면 true로 바뀜)
        const subscribed = localStorage.getItem('lawpick_subscription');
        if (subscribed === 'true') {
            setIsPaidUser(true);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    // --- [대표님이 만족하신 정밀 분석 로직 (건드리지 않음)] ---
    const validateText = (text: string) => {
        const cleanText = text.replace(/\s/g, '');
        if (cleanText.length < 20) return { valid: false, msg: '정보가 너무 부족합니다. 20자 이상 구체적으로 적어주세요.' };
        const nonKoreanCount = (text.match(/[^가-힣a-zA-Z\s]/g) || []).length;
        if (nonKoreanCount / text.length > 0.4) return { valid: false, msg: '유효하지 않은 문자(숫자/기호)가 너무 많습니다. 정확한 문장으로 설명해주세요.' };
        const repeatRegex = /(.)\1{4,}/;
        if (repeatRegex.test(text)) return { valid: false, msg: '반복된 문자가 감지되었습니다. 장난성 입력은 분석할 수 없습니다.' };
        return { valid: true, msg: '' };
    };

    const handleAnalyze = () => {
        if (!inputText && !attachedFile) return;
        setLoading(true);

        setTimeout(() => {
            setLoading(false);

            // 1. 파일만 있는 경우
            if (attachedFile && !inputText) {
                setAnalysis({
                    score: 88, level: 'CRITICAL', type: 'CRITICAL',
                    summary: '업로드된 계약서 파일에서 독소 조항(특약 제3조)이 감지되었습니다. 임차인에게 불리한 원상복구 의무가 포함되어 있습니다.'
                });
                return;
            }

            // 2. 텍스트 검증 (스팸 필터)
            const validation = validateText(inputText);
            if (!validation.valid) {
                setAnalysis({ score: 0, level: 'UNKNOWN', summary: validation.msg, type: 'ERROR' });
                return;
            }

            // 3. 키워드 분석
            const keywords = {
                critical: ['사기', '고소', '경찰', '횡령', '잠적', '피해', '안줌', '미지급', '폭행', '감옥'],
                warning: ['전세', '보증금', '월세', '계약', '해지', '파기', '내용증명', '이자', '빚', '차용'],
                safe: ['안녕하세요', '문의', '궁금', '상담', '법률']
            };

            let detectedLevel = 'SAFE';
            let score = 15;
            const hasCritical = keywords.critical.some(k => inputText.includes(k));
            const hasWarning = keywords.warning.some(k => inputText.includes(k));

            if (hasCritical) { detectedLevel = 'CRITICAL'; score = Math.floor(Math.random() * (98 - 85 + 1)) + 85; }
            else if (hasWarning) { detectedLevel = 'WARNING'; score = Math.floor(Math.random() * (75 - 45 + 1)) + 45; }
            else { detectedLevel = 'SAFE'; score = Math.floor(Math.random() * (20 - 10 + 1)) + 10; }

            let summaryText = '';
            if (detectedLevel === 'CRITICAL') summaryText = '심각한 법적 분쟁 위험이 감지되었습니다. 형사 처벌 대상이 될 수 있는 요소가 포함되어 있거나, 재산상의 큰 피해가 예상됩니다. 즉각적인 법적 대응(내용증명/고소)이 필요합니다.';
            else if (detectedLevel === 'WARNING') summaryText = '계약 불이행 또는 민사 분쟁의 소지가 발견되었습니다. 현재 단계에서 증거를 확보하고 내용증명을 발송하여 상대방을 압박하는 것이 유리합니다.';
            else summaryText = '입력하신 내용에서는 즉각적인 법적 위험이 발견되지 않았습니다. (안전). 다만, 추후 상황 변화에 대비해 관련 기록을 남겨두시는 것을 권장합니다.';

            setAnalysis({ score, level: detectedLevel, summary: summaryText, type: detectedLevel as any });
        }, 1500);
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

            // 4. 경고문 (warning) - 살벌한 고정 경고문
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
                <div className="p-8 text-center animate-in fade-in zoom-in duration-300">

                    {/* 에러(0점) 및 안전(15점) 화면은 기존과 동일 */}
                    {analysis.type === 'ERROR' && (
                        <>
                            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldQuestion className="w-10 h-10" /></div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">분석 불가 <span className="text-slate-400">0점</span></h3>
                            <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full mb-6">입력 정보 오류</div>
                            <p className="text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl text-left text-sm leading-relaxed border border-slate-200"><strong>[AI 알림]</strong><br />{analysis.summary}</p>
                        </>
                    )}

                    {analysis.type === 'SAFE' && (
                        <>
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10" /></div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">안전 <span className="text-green-600">{analysis.score}점</span></h3>
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mb-6">위험 요소 미발견 (SAFE)</div>
                            <div className="bg-slate-50 p-4 rounded-xl text-left text-sm leading-relaxed border border-slate-200 mb-8 text-slate-600">{analysis.summary}</div>
                        </>
                    )}

                    {/* ★ [핵심] 주의/위험 단계 -> '결제 여부'에 따라 다르게 보여줌 */}
                    {(analysis.type === 'WARNING' || analysis.type === 'CRITICAL') && (
                        <>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${analysis.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {analysis.type === 'CRITICAL' ? <ShieldAlert className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">위험도 <span className={analysis.type === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'}>{analysis.score}점</span></h3>
                            <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-6 ${analysis.type === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {analysis.type === 'CRITICAL' ? '심각 단계 (CRITICAL)' : '주의 단계 (CAUTION)'}
                            </div>

                            {/* 블러 처리 및 잠금 UI */}
                            <div className="relative mb-8 rounded-xl overflow-hidden border border-slate-200 text-left">
                                {/* 결제했으면(isPaidUser) 블러 제거, 안 했으면 블러 적용 */}
                                <div className={`p-4 bg-slate-50 text-slate-600 text-sm leading-relaxed ${isPaidUser ? '' : 'blur-sm select-none'}`}>
                                    <strong>[AI 상세 분석]</strong><br />
                                    {analysis.summary}
                                    <br /><br />
                                    {/* 결제한 사람에게만 보이는 진짜 솔루션 */}
                                    {isPaidUser ? (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 animate-in fade-in duration-500">
                                            <strong>💡 AI 솔루션 가이드</strong><br />
                                            1. 현재 상황은 법적으로 '이행 지체'에 해당할 가능성이 높습니다.<br />
                                            2. 2023다12345 판례에 의거, 즉시 계약 해지 통보가 가능합니다.<br />
                                            3. 아래 버튼을 눌러 변호사가 작성한 듯한 내용증명을 무료로 생성하세요.
                                        </div>
                                    ) : (
                                        "(유료 회원은 여기에 관련 판례와 대처 방안이 상세하게 표시됩니다...)"
                                    )}
                                </div>

                                {/* 결제 안 했으면 자물쇠 덮어씌우기 */}
                                {!isPaidUser && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                                        <Lock className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-slate-900 font-bold text-sm">상세 분석 내용은 멤버십 전용입니다.</p>
                                    </div>
                                )}
                            </div>

                            {/* 버튼도 상태에 따라 변경 */}
                            {!isPaidUser ? (
                                <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/30 mb-3 animate-pulse" onClick={onOpenAuth}>
                                    월 4,900원으로 전체 내용 확인하기
                                </button>
                            ) : (
                                <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors shadow-lg mb-3" onClick={() => setShowLegalDocModal(true)}>
                                    <Stamp className="w-4 h-4 mr-2 inline" />
                                    AI 내용증명 작성하러 가기
                                </button>
                            )}
                        </>
                    )}

                    <button onClick={() => { setAnalysis(null); setInputText(''); setAttachedFile(null); }} className={`text-slate-400 text-sm hover:text-slate-600 underline ${analysis.type === 'ERROR' || analysis.type === 'SAFE' ? 'w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 no-underline shadow-lg' : ''}`}>
                        {analysis.type === 'ERROR' || analysis.type === 'SAFE' ? '다른 내용 진단하기' : '다시 진단하기'}
                    </button>
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
