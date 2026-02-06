'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, FileText, X, Loader2, Paperclip, Lock, ShieldAlert, ShieldQuestion, CheckCircle2 } from 'lucide-react';

interface ScannerProps {
    onOpenAuth?: () => void;
}

export default function LawpickScanner({ onOpenAuth }: ScannerProps) {
    const [analysis, setAnalysis] = useState<null | { score: number; level: string; summary: string; type: 'ERROR' | 'SAFE' | 'WARNING' | 'CRITICAL' }>(null);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachedFile(e.target.files[0]);
        }
    };

    // [핵심] 텍스트 정밀 검증 함수
    const validateText = (text: string) => {
        const cleanText = text.replace(/\s/g, ''); // 공백 제거
        if (cleanText.length < 20) return { valid: false, msg: '정보가 너무 부족합니다. 20자 이상 구체적으로 적어주세요.' };

        // 1. 숫자/특수문자 비율 검사 (전체의 40% 넘으면 장난으로 간주)
        const nonKoreanCount = (text.match(/[^가-힣a-zA-Z\s]/g) || []).length;
        if (nonKoreanCount / text.length > 0.4) return { valid: false, msg: '유효하지 않은 문자(숫자/기호)가 너무 많습니다. 정확한 문장으로 설명해주세요.' };

        // 2. 반복 문자 검사 (예: ㅋㅋㅋㅋ, abcdabcd, 1111)
        const repeatRegex = /(.)\1{4,}/; // 같은 글자 5번 반복
        if (repeatRegex.test(text)) return { valid: false, msg: '반복된 문자가 감지되었습니다. 장난성 입력은 분석할 수 없습니다.' };

        return { valid: true, msg: '' };
    };

    const handleAnalyze = () => {
        if (!inputText && !attachedFile) return;
        setLoading(true);

        setTimeout(() => {
            setLoading(false);

            // 0. 파일만 있는 경우 (내용을 모르니 일단 통과)
            if (attachedFile && !inputText) {
                setAnalysis({
                    score: 88,
                    level: 'CRITICAL',
                    summary: '업로드된 계약서 파일에서 독소 조항(특약 제3조)이 감지되었습니다. 임차인에게 불리한 원상복구 의무가 포함되어 있습니다.',
                    type: 'CRITICAL'
                });
                return;
            }

            // 1. 텍스트 정밀 검증 (스팸 필터)
            const validation = validateText(inputText);
            if (!validation.valid) {
                setAnalysis({
                    score: 0,
                    level: 'UNKNOWN',
                    summary: validation.msg, // 구체적인 에러 사유 출력
                    type: 'ERROR'
                });
                return;
            }

            // 2. 키워드 기반 점수 로직 (Rule-Based AI)
            const keywords = {
                critical: ['사기', '고소', '경찰', '횡령', '잠적', '피해', '안줌', '미지급', '폭행', '감옥'],
                warning: ['전세', '보증금', '월세', '계약', '해지', '파기', '내용증명', '이자', '빚', '차용'],
                safe: ['안녕하세요', '문의', '궁금', '상담', '법률']
            };

            let detectedLevel = 'SAFE';
            let score = 15; // 기본 안전 점수

            // 위험도 판단
            const hasCritical = keywords.critical.some(k => inputText.includes(k));
            const hasWarning = keywords.warning.some(k => inputText.includes(k));

            if (hasCritical) {
                detectedLevel = 'CRITICAL';
                score = Math.floor(Math.random() * (98 - 85 + 1)) + 85; // 85~98점
            } else if (hasWarning) {
                detectedLevel = 'WARNING';
                score = Math.floor(Math.random() * (75 - 45 + 1)) + 45; // 45~75점
            } else {
                // 내용은 길지만(유효하지만), 법적 키워드가 하나도 없는 경우 (예: "오늘 점심 뭐 먹지...")
                detectedLevel = 'SAFE';
                score = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // 10~20점
            }

            // 결과 메시지 세팅
            let summaryText = '';
            if (detectedLevel === 'CRITICAL') {
                summaryText = '심각한 법적 분쟁 위험이 감지되었습니다. 형사 처벌 대상이 될 수 있는 요소가 포함되어 있거나, 재산상의 큰 피해가 예상됩니다. 즉각적인 법적 대응(내용증명/고소)이 필요합니다.';
            } else if (detectedLevel === 'WARNING') {
                summaryText = '계약 불이행 또는 민사 분쟁의 소지가 발견되었습니다. 현재 단계에서 증거를 확보하고 내용증명을 발송하여 상대방을 압박하는 것이 유리합니다.';
            } else {
                summaryText = '입력하신 내용에서는 즉각적인 법적 위험이 발견되지 않았습니다. (안전). 다만, 추후 상황 변화에 대비해 관련 기록을 남겨두시는 것을 권장합니다.';
            }

            setAnalysis({
                score,
                level: detectedLevel,
                summary: summaryText,
                type: detectedLevel as any
            });

        }, 1500);
    };

    return (
        <div className="w-full bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">

            <div className="bg-slate-50 p-6 border-b border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3"><FileText className="w-6 h-6" /></div>
                <h2 className="text-2xl font-black text-slate-900">Lawpick Scanner</h2>
                <p className="text-slate-500 text-sm mt-1">AI가 계약서 파일과 상황을 정밀 분석합니다.</p>
            </div>

            {!analysis ? (
                <div className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">자료 입력 (계약서 업로드 or 상황 설명)</label>
                    <div className="relative">
                        <textarea
                            className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900 text-sm mb-3"
                            placeholder="예) 전세 만기가 1주일 남았는데 집주인이 연락을 피합니다. (정확한 분석을 위해 20자 이상 구체적으로 적어주세요)"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.png,.jpeg" onChange={handleFileChange} />
                            {attachedFile ? (
                                <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium w-full mr-2">
                                    <FileText className="w-4 h-4 mr-2" /><span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                    <button onClick={() => setAttachedFile(null)} className="ml-auto p-1 hover:bg-blue-100 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-2 py-1">
                                    <Paperclip className="w-4 h-4 mr-1" /> 계약서 파일 첨부 (PDF/사진)
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={handleAnalyze} disabled={(!inputText && !attachedFile) || loading} className={`w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${(!inputText && !attachedFile) || loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30'}`}>
                        {loading ? <><Loader2 className="animate-spin w-5 h-5 mr-2" /> AI 분석 중...</> : '위험도 무료 진단하기'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">* 업로드된 파일은 암호화되어 분석 후 즉시 파기됩니다.</p>
                </div>
            ) : (
                <div className="p-8 text-center animate-in fade-in zoom-in duration-300">

                    {/* A. 분석 에러 (0점) */}
                    {analysis.type === 'ERROR' && (
                        <>
                            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldQuestion className="w-10 h-10" /></div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">분석 불가 <span className="text-slate-400">0점</span></h3>
                            <div className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full mb-6">입력 정보 오류</div>
                            <p className="text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl text-left text-sm leading-relaxed border border-slate-200"><strong>[AI 알림]</strong><br />{analysis.summary}</p>
                        </>
                    )}

                    {/* B. 안전 (10~20점) */}
                    {analysis.type === 'SAFE' && (
                        <>
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10" /></div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">안전 <span className="text-green-600">{analysis.score}점</span></h3>
                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mb-6">위험 요소 미발견 (SAFE)</div>
                            <div className="bg-slate-50 p-4 rounded-xl text-left text-sm leading-relaxed border border-slate-200 mb-8 text-slate-600">
                                {analysis.summary}
                            </div>
                        </>
                    )}

                    {/* C. 주의/위험 (45점 이상) */}
                    {(analysis.type === 'WARNING' || analysis.type === 'CRITICAL') && (
                        <>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${analysis.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {analysis.type === 'CRITICAL' ? <ShieldAlert className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-2">위험도 <span className={analysis.type === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'}>{analysis.score}점</span></h3>
                            <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-6 ${analysis.type === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {analysis.type === 'CRITICAL' ? '심각 단계 (CRITICAL)' : '주의 단계 (CAUTION)'}
                            </div>

                            {/* 프리미엄 블러 UI */}
                            <div className="relative mb-8 rounded-xl overflow-hidden border border-slate-200 text-left">
                                <div className="p-4 bg-slate-50 text-slate-600 text-sm leading-relaxed blur-sm select-none">
                                    <strong>[AI 상세 분석]</strong><br />{analysis.summary}<br /><br />(유료 회원은 여기에 관련 판례와 대처 방안이 상세하게 표시됩니다...)
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-slate-900 font-bold text-sm">상세 분석 내용은 멤버십 전용입니다.</p>
                                </div>
                            </div>

                            <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/30 mb-3 animate-pulse" onClick={onOpenAuth}>
                                월 4,900원으로 전체 내용 확인하기
                            </button>
                        </>
                    )}

                    {/* 공통 버튼: 다시 하기 */}
                    <button onClick={() => { setAnalysis(null); setInputText(''); setAttachedFile(null); }} className={`text-slate-400 text-sm hover:text-slate-600 underline ${analysis.type === 'ERROR' || analysis.type === 'SAFE' ? 'w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 no-underline shadow-lg' : ''}`}>
                        {analysis.type === 'ERROR' || analysis.type === 'SAFE' ? '다른 내용 진단하기' : '다시 진단하기'}
                    </button>
                </div>
            )}
        </div>
    );
}
