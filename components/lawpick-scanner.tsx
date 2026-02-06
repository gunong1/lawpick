'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, FileText, X, Loader2, Paperclip, Lock, ShieldAlert, ShieldQuestion, CheckCircle2, Download, Scale, ClipboardList, Tag, Info, Stamp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { DetailedAnalysis } from '@/lib/types';
import LegalDocModal, { LegalDocData } from './legal-doc-modal';

interface ScannerProps {
    onOpenAuth?: () => void;
}

export default function LawpickScanner({ onOpenAuth }: ScannerProps) {
    const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showLegalDocModal, setShowLegalDocModal] = useState(false);
    const [isGeneratingLegalDoc, setIsGeneratingLegalDoc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        setAttachedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // API 호출로 분석 실행
    const handleAnalyze = async () => {
        if (!inputText && attachedFiles.length === 0) return;
        setLoading(true);
        setErrorMsg(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: inputText })
            });

            const result = await response.json();

            if (result.success && result.data) {
                setAnalysis(result.data);
            } else {
                setErrorMsg(result.error || '분석에 실패했습니다.');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            setErrorMsg('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const resetAll = () => {
        setAnalysis(null);
        setInputText('');
        setAttachedFiles([]);
        setErrorMsg(null);
    };

    // 내용증명 PDF 생성 함수
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

    // PDF 다운로드 함수
    const downloadPDF = async () => {
        if (!analysis) return;
        setIsGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const now = new Date();
            const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
            const reportId = `LP-${now.getTime().toString(36).toUpperCase()}`;

            // 한글 폰트 로드
            try {
                const { malgunFontBase64 } = await import('@/lib/korean-font');
                doc.addFileToVFS('malgun.ttf', malgunFontBase64);
                doc.addFont('malgun.ttf', 'malgun', 'normal');
                doc.setFont('malgun');
            } catch (e) {
                console.warn('Font loading failed');
            }

            // 로고 이미지 로드 및 추가
            try {
                const logoResponse = await fetch('/logo-new.png');
                const logoBlob = await logoResponse.blob();
                const logoBase64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(logoBlob);
                });
                doc.addImage(logoBase64, 'PNG', 15, 12, 45, 12);
            } catch (e) {
                // 로고 로드 실패 시 텍스트 대체
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(18);
                doc.text('LawPick', 15, 22);
            }

            // ========== 헤더 ==========
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 30, 195, 30);

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.text('AI 법률 리스크 분석 리포트', 195, 20, { align: 'right' });
            doc.text(dateStr, 195, 26, { align: 'right' });

            // ========== 리포트 ID 배너 ==========
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(15, 35, 180, 12, 2, 2, 'F');
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(8);
            doc.text(`리포트 번호: ${reportId}`, 105, 42, { align: 'center' });

            let yPos = 55;

            // ========== [섹션 A] 사건 브리핑 ==========
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(15, yPos, 180, 8, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('사건 브리핑 (Case Brief)', 20, yPos + 5.5);
            yPos += 12;

            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(15, yPos, 180, 22, 2, 2, 'FD');
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            const briefLines = doc.splitTextToSize(analysis.caseBrief, 170);
            doc.text(briefLines.slice(0, 3), 20, yPos + 7);
            yPos += 28;

            // ========== [섹션 B] 법적 쟁점 ==========
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(15, yPos, 180, 8, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('법적 쟁점 (Legal Issues)', 20, yPos + 5.5);
            yPos += 12;

            let xPos = 15;
            doc.setFontSize(8);
            analysis.legalCategories.forEach((cat) => {
                const textWidth = doc.getTextWidth(`#${cat}`) + 6;
                if (xPos + textWidth > 195) {
                    xPos = 15;
                    yPos += 9;
                }
                doc.setFillColor(59, 130, 246);
                doc.roundedRect(xPos, yPos - 4, textWidth, 7, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(`#${cat}`, xPos + 3, yPos);
                xPos += textWidth + 3;
            });
            yPos += 12;

            // ========== [섹션 C] 위험도 분석 ==========
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(15, yPos, 180, 8, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('위험도 분석 (Risk Analysis)', 20, yPos + 5.5);
            yPos += 12;

            const scoreColor = analysis.type === 'CRITICAL' ? [220, 38, 38] :
                analysis.type === 'WARNING' ? [234, 179, 8] : [34, 197, 94];
            const scoreBgColor = analysis.type === 'CRITICAL' ? [254, 242, 242] :
                analysis.type === 'WARNING' ? [254, 252, 232] : [240, 253, 244];

            doc.setFillColor(scoreBgColor[0], scoreBgColor[1], scoreBgColor[2]);
            doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.roundedRect(15, yPos, 180, 30, 2, 2, 'FD');

            // 점수 원
            doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.circle(40, yPos + 15, 11, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text(analysis.score.toString(), 40, yPos + 19, { align: 'center' });

            // 등급
            doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
            doc.setFontSize(14);
            const levelText = analysis.type === 'CRITICAL' ? '심각 (Critical)' :
                analysis.type === 'WARNING' ? '주의 (Warning)' : '안전 (Safe)';
            doc.text(levelText, 58, yPos + 11);

            // 산정 이유
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(8);
            const reasonLines = doc.splitTextToSize(analysis.riskReason, 130);
            doc.text(reasonLines.slice(0, 2), 58, yPos + 19);
            yPos += 36;

            // ========== [섹션 D] 핵심 사실관계 ==========
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(15, yPos, 180, 8, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('핵심 사실관계 (Key Facts)', 20, yPos + 5.5);
            yPos += 12;

            // 2x2 그리드
            const boxWidth = 87;
            const boxHeight = 14;
            const facts = [
                { label: '당사자', value: analysis.keyFacts.who },
                { label: '시기', value: analysis.keyFacts.when },
                { label: '금액', value: analysis.keyFacts.money || '미상' },
                { label: '증거 상태', value: analysis.keyFacts.evidenceStatus }
            ];

            facts.forEach((fact, i) => {
                const x = 15 + (i % 2) * (boxWidth + 6);
                const y = yPos + Math.floor(i / 2) * (boxHeight + 3);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(7);
                doc.text(fact.label, x + 4, y + 5);
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(9);
                doc.text(fact.value.substring(0, 20), x + 4, y + 11);
            });
            yPos += (boxHeight + 3) * 2 + 6;

            // ========== [섹션 E] 필요 조치 ==========
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(15, yPos, 180, 8, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('필요 조치 (Action Items)', 20, yPos + 5.5);
            yPos += 12;

            doc.setFillColor(254, 252, 232);
            doc.setDrawColor(234, 179, 8);
            const actionBoxHeight = Math.min(analysis.actionItems.length * 8 + 6, 32);
            doc.roundedRect(15, yPos, 180, actionBoxHeight, 2, 2, 'FD');
            doc.setFontSize(8);
            doc.setTextColor(113, 63, 18);
            analysis.actionItems.slice(0, 4).forEach((item, i) => {
                doc.text(`${i + 1}. ${item}`, 20, yPos + 6 + (i * 8));
            });
            yPos += actionBoxHeight + 8;

            // ========== 면책조항 ==========
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 255, 195, 255);

            doc.setFillColor(254, 243, 199);
            doc.roundedRect(15, 258, 180, 16, 2, 2, 'F');
            doc.setTextColor(146, 64, 14);
            doc.setFontSize(7);
            doc.text('본 리포트는 AI 분석 결과이며 참고용으로만 제공됩니다. 정식 법률 자문이 아니며 법적 효력이 없습니다.', 20, 265);
            doc.text('정확한 법적 판단을 위해서는 반드시 전문 변호사와 상담하시기 바랍니다.', 20, 271);

            // ========== 푸터 ==========
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(7);
            doc.text('© 2025 LawPick (Kopick Corp.) | support@lawpick.com | www.lawpick.com', 105, 283, { align: 'center' });

            doc.save(`LawPick_Report_${reportId}.pdf`);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('PDF 생성에 실패했습니다.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // 면책 배너
    const DisclaimerBanner = () => (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4 text-left">
            <p className="text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>본 결과는 <span className="font-bold">AI 분석 결과</span>이며, 최종 판단은 <span className="font-bold">전문 변호사</span>를 통해 확정하세요.</span>
            </p>
        </div>
    );

    // 결과 표시 컴포넌트
    const AnalysisResult = () => {
        if (!analysis) return null;

        const scoreColor = analysis.type === 'CRITICAL' ? 'text-red-600 bg-red-100' :
            analysis.type === 'WARNING' ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100';
        const scoreBg = analysis.type === 'CRITICAL' ? 'bg-red-500' :
            analysis.type === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500';

        return (
            <div className="p-6 space-y-5 animate-in fade-in duration-300">
                <DisclaimerBanner />

                {/* [섹션 A] 사건 브리핑 */}
                <div className="bg-slate-100 rounded-xl p-4 border-l-4 border-slate-400">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-2">
                        <Scale className="w-4 h-4" />
                        사건 브리핑
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{analysis.caseBrief}</p>
                </div>

                {/* [섹션 B] 법적 쟁점 키워드 */}
                <div>
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-2">
                        <Tag className="w-4 h-4" />
                        법적 쟁점
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {analysis.legalCategories.map((cat, i) => (
                            <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                #{cat}
                            </span>
                        ))}
                    </div>
                </div>

                {/* [섹션 C] 위험도 상세 분석 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-3">
                        <ShieldAlert className="w-4 h-4" />
                        위험도 분석
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 ${scoreBg} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                            {analysis.score}
                        </div>
                        <div className="flex-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${scoreColor} mb-1`}>
                                {analysis.type === 'CRITICAL' ? '심각' : analysis.type === 'WARNING' ? '주의' : '안전'}
                            </span>
                            <p className="text-slate-600 text-sm">{analysis.riskReason}</p>
                        </div>
                    </div>
                </div>

                {/* 핵심 사실관계 */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-slate-400 text-xs mb-1">당사자</div>
                        <div className="text-slate-700 font-medium">{analysis.keyFacts.who}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-slate-400 text-xs mb-1">시기</div>
                        <div className="text-slate-700 font-medium">{analysis.keyFacts.when}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-slate-400 text-xs mb-1">금액</div>
                        <div className="text-slate-700 font-medium">{analysis.keyFacts.money || '미상'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-slate-400 text-xs mb-1">증거 상태</div>
                        <div className="text-slate-700 font-medium">{analysis.keyFacts.evidenceStatus}</div>
                    </div>
                </div>

                {/* [섹션 D] 필요 조치 */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-3">
                        <ClipboardList className="w-4 h-4" />
                        필요 조치 (Action Items)
                    </div>
                    <ul className="space-y-2">
                        {analysis.actionItems.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-amber-900 text-sm">
                                <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 버튼들 */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={downloadPDF}
                        disabled={isGeneratingPdf}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {isGeneratingPdf ? '리포트 생성 중...' : '상세 리포트 PDF 다운로드'}
                    </button>

                    {analysis.type !== 'SAFE' && (
                        <>
                            <button
                                onClick={() => setShowLegalDocModal(true)}
                                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Stamp className="w-5 h-5" />
                                내용증명 작성하기
                            </button>
                            <button
                                onClick={onOpenAuth}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                변호사 상담 연결하기
                            </button>
                        </>
                    )}

                    <button onClick={resetAll} className="w-full text-slate-400 text-sm hover:text-slate-600 underline">
                        다시 진단하기
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-50 p-6 border-b border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3">
                    <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Lawpick Scanner</h2>
                <p className="text-slate-500 text-sm mt-1">AI가 법률 상황을 분석하여 상세 리포트를 제공합니다.</p>
            </div>

            {!analysis ? (
                <div className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">상황 설명</label>
                    <textarea
                        className="w-full h-32 p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-900 text-sm mb-3"
                        placeholder="예) 지인에게 500만원을 빌려줬는데 3개월째 연락이 안 됩니다. 차용증은 없고 카톡 대화만 있어요."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.jpg,.png,.jpeg"
                                multiple
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-2 py-1"
                            >
                                <Paperclip className="w-4 h-4 mr-1" />
                                {attachedFiles.length > 0 ? '파일 추가하기' : '증거 파일 첨부 (선택)'}
                            </button>
                            {attachedFiles.length > 0 && <span className="text-xs text-slate-400 font-bold">{attachedFiles.length}개 파일</span>}
                        </div>

                        {attachedFiles.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-2 space-y-2 max-h-24 overflow-y-auto border border-slate-200">
                                {attachedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm">
                                        <FileText className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                                        <span className="truncate flex-1">{file.name}</span>
                                        <button onClick={() => removeFile(index)} className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={(!inputText && attachedFiles.length === 0) || loading}
                        className={`w-full mt-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${(!inputText && attachedFiles.length === 0) || loading
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                AI 분석 중...
                            </>
                        ) : (
                            '무료 법률 리스크 진단하기'
                        )}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">* 입력 내용은 암호화되어 분석 후 즉시 삭제됩니다.</p>
                </div>
            ) : (
                <AnalysisResult />
            )}

            {/* 내용증명 모달 */}
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
