'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';

interface PartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PartnerModal({ isOpen, onClose }: PartnerModalProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // API 연동 대신 1.5초 후 성공 처리 시뮬레이션
        setTimeout(() => {
            setLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                {/* 헤더 */}
                <div className="bg-[#0f172a] p-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white">파트너 제안서 요청</h3>
                        <p className="text-slate-400 text-sm mt-1">로픽의 비즈니스 모델과 수익 구조가 담긴<br />제안서를 이메일로 보내드립니다.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 컨텐츠 */}
                <div className="p-6">
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">변호사님 성함</label>
                                <input required type="text" placeholder="예) 김법률" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">소속 (로펌/법률사무소)</label>
                                <input required type="text" placeholder="예) 법무법인 로픽" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">이메일 (제안서 수신용)</label>
                                <input required type="email" placeholder="lawyer@lawfirm.com" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">연락처</label>
                                <input required type="tel" placeholder="010-1234-5678" className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-slate-900" />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#0f172a] text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center mt-2"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : '제안서 이메일로 받기'}
                            </button>
                            <p className="text-xs text-center text-slate-400 mt-3">
                                입력하신 정보는 제안서 발송 목적으로만 사용됩니다.
                            </p>
                        </form>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">신청이 완료되었습니다!</h3>
                            <p className="text-slate-500 mb-8">
                                입력하신 이메일로<br />
                                <strong>[로픽 파트너 제안서.pdf]</strong>가 발송되었습니다.<br />
                                확인 부탁드립니다.
                            </p>
                            <button onClick={onClose} className="w-full bg-slate-100 text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                                닫기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
