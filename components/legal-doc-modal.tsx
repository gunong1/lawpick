'use client';

import { useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';

interface LegalDocModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalContent: string;
    onGenerate: (data: LegalDocData) => void;
    isGenerating: boolean;
}

export interface LegalDocData {
    senderName: string;
    senderAddress: string;
    recipientName: string;
    recipientAddress: string;
}

export default function LegalDocModal({ isOpen, onClose, originalContent, onGenerate, isGenerating }: LegalDocModalProps) {
    const [formData, setFormData] = useState<LegalDocData>({
        senderName: '',
        senderAddress: '',
        recipientName: '',
        recipientAddress: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.senderName || !formData.recipientName) {
            alert('발신인과 수신인 성명은 필수입니다.');
            return;
        }
        onGenerate(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        <div>
                            <h2 className="font-bold text-lg">내용증명 작성</h2>
                            <p className="text-slate-400 text-xs">법원 제출용 공식 문서</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left">
                    {/* 발신인 정보 */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-2 text-left">발신인 (본인) 정보</h3>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1 text-left">성명 *</label>
                            <input
                                type="text"
                                value={formData.senderName}
                                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left"
                                placeholder="홍길동"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1 text-left">주소</label>
                            <input
                                type="text"
                                value={formData.senderAddress}
                                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left"
                                placeholder="서울특별시 강남구 테헤란로 123"
                            />
                        </div>
                    </div>

                    {/* 수신인 정보 */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-2 text-left">수신인 (상대방) 정보</h3>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1 text-left">성명 *</label>
                            <input
                                type="text"
                                value={formData.recipientName}
                                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left"
                                placeholder="김철수"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1 text-left">주소</label>
                            <input
                                type="text"
                                value={formData.recipientAddress}
                                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-left"
                                placeholder="서울특별시 서초구 반포대로 456"
                            />
                        </div>
                    </div>

                    {/* 원본 내용 미리보기 */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">분석된 상황 (AI가 법률 문서로 변환)</p>
                        <p className="text-sm text-slate-700 line-clamp-2">{originalContent}</p>
                    </div>

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                내용증명 생성 중...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                내용증명 PDF 생성
                            </>
                        )}
                    </button>

                    <p className="text-xs text-center text-slate-400">
                        * 내용증명은 법적 효력을 갖추기 위해 우체국 등기 발송이 필요합니다.
                    </p>
                </form>
            </div>
        </div>
    );
}
