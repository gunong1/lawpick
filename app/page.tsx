'use client';

import { useState, useEffect } from 'react';
import LawpickScanner from '@/components/lawpick-scanner';
import PartnerModal from '@/components/partner-modal';
import AuthModal from '@/components/auth-modal';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Briefcase, ChevronRight, Star, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authInitialView, setAuthInitialView] = useState<'NONE' | 'TERMS' | 'PRIVACY'>('NONE');

    // 로그인 상태 관리
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');

    // [추가됨] 페이지 새로고침 시 로그인 상태 복구
    useEffect(() => {
        const savedUser = localStorage.getItem('session_user');
        if (savedUser) {
            setUserName(savedUser);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLoginSuccess = (name: string) => {
        // [추가됨] 로그인 성공 시 브라우저에 세션 저장
        localStorage.setItem('session_user', name);
        setUserName(name);
        setIsLoggedIn(true);
    };

    // 실제 후기 데이터
    const reviews = [
        { text: "변호사님 연결이 진짜 빠르네요. 바로 내용증명 보냈습니다.", user: "박OO님 (40대, 자영업)", score: 5 },
        { text: "법률 용어가 너무 어려웠는데 AI가 쉽게 진단해줘서 좋았습니다.", user: "최OO님 (50대, 임대업)", score: 5 },
        { text: "작은 사고였지만 불안했는데 로픽 덕분에 안심했어요.", user: "정OO님 (30대, 회사원)", score: 4.5 },
        { text: "전세금 못 받을까 봐 떨었는데 빨간불 보고 바로 대응했습니다.", user: "김OO님 (30대, 신혼부부)", score: 5 },
        { text: "월 4,900원에 이런 퀄리티라니... 진짜 든든합니다.", user: "이OO님 (20대, 대학생)", score: 5 },
        { text: "내용증명 보내니까 집주인 태도가 확 달라지네요. 강추!", user: "한OO님 (30대, 직장인)", score: 5 },
    ];

    return (
        <main className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500 selection:text-white overflow-x-hidden">

            <PartnerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => { setIsAuthModalOpen(false); setAuthInitialView('NONE'); }}
                onLoginSuccess={handleLoginSuccess}
                initialView={authInitialView}
            />

            {/* 1. Header - 흰색 배경 */}
            <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="cursor-pointer" onClick={() => window.location.href = '/'}>
                        <Image src="/logo.png" alt="LawPick" width={130} height={36} className="h-9 w-auto" />
                    </div>

                    {isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:block text-sm text-slate-600">
                                <span className="text-blue-600 font-bold">{userName}</span>님, 안전합니다.
                            </div>
                            <Link href="/my">
                                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full transition-colors text-sm font-bold">
                                    <User className="w-4 h-4" />
                                    MY 로픽
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="text-sm font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                        >
                            로그인 / 가입
                        </button>
                    )}
                </div>
            </header>

            {/* 2. Hero Section */}
            <section className="pt-32 pb-16 px-4 text-center">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-bold mb-6 tracking-wide hover:bg-blue-900/40 transition-colors cursor-default">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    국내 최초 법률 방어 시스템
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                    변호사 선임비 <span className="text-blue-500">550만 원</span>,<br />
                    <span className="text-white border-b-4 border-blue-600">4,900원</span>에 대비하세요.
                </h1>

                <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    전세 사기부터 교통사고까지. 언제 터질지 모르는 법적 문제,<br />
                    <strong className="text-white">로픽(LawPick) 멤버십</strong>으로 미리 예방하세요.
                </p>

                <div className="max-w-xl mx-auto bg-white/5 rounded-3xl border border-white/10 p-2 shadow-2xl backdrop-blur-sm relative z-10">
                    <LawpickScanner onOpenAuth={() => setIsAuthModalOpen(true)} />
                </div>
            </section>

            {/* 3. Social Proof */}
            <section className="py-16 bg-[#0b1120] border-y border-white/5 overflow-hidden">
                <div className="container mx-auto px-4 mb-10 text-center">
                    <div className="grid grid-cols-3 gap-4 text-center max-w-4xl mx-auto mb-12 divide-x divide-slate-800">
                        <div>
                            <div className="text-3xl md:text-5xl font-black text-white mb-2">14,203+</div>
                            <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider">AI 학습 판례 데이터</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-5xl font-black text-white mb-2">50+</div>
                            <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider">진단 가능 법률 분야</div>
                        </div>
                        <div>
                            <div className="text-3xl md:text-5xl font-black text-blue-500 mb-2">24h</div>
                            <div className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider">실시간 리스크 진단</div>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold">
                        이미 <span className="text-blue-500">1.4만 명</span>의 사용자가 로픽으로 보호받고 있습니다
                    </h3>
                </div>

                <div className="relative w-full">
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0b1120] to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0b1120] to-transparent z-10"></div>

                    <div className="flex animate-scroll hover:[animation-play-state:paused] w-max">
                        <div className="flex gap-4 px-2">
                            {reviews.map((review, i) => (
                                <div key={`orig-${i}`} className="w-80 p-6 rounded-2xl bg-slate-800/40 border border-slate-700 backdrop-blur-sm flex-shrink-0">
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(review.score) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-slate-200 text-sm mb-4 leading-relaxed line-clamp-2">"{review.text}"</p>
                                    <div className="text-xs text-slate-500 font-bold">{review.user}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 px-2">
                            {reviews.map((review, i) => (
                                <div key={`dup-${i}`} className="w-80 p-6 rounded-2xl bg-slate-800/40 border border-slate-700 backdrop-blur-sm flex-shrink-0">
                                    <div className="flex mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(review.score) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-slate-200 text-sm mb-4 leading-relaxed line-clamp-2">"{review.text}"</p>
                                    <div className="text-xs text-slate-500 font-bold">{review.user}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Why Lawpick */}
            <section className="py-20 bg-[#0f172a]">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20">
                            <AlertTriangle className="text-red-500 mb-4 w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-xl mb-2 text-white">01. 위험 감지</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                AI가 계약서와 상황을 실시간으로 분석하여 독소 조항과 법적 위험을 사전에 감지합니다.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20">
                            <Lock className="text-yellow-500 mb-4 w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-xl mb-2 text-white">02. 내용증명 발송</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                변호사 명의의 경고장으로 상대방을 압박하여 소송 전 분쟁을 조기에 종결합니다.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 group hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20">
                            <CheckCircle2 className="text-blue-500 mb-4 w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="font-bold text-xl mb-2 text-white">03. 소송 비용 지원</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                로픽 멤버십 회원은 소송 발생 시 규정에 따라 변호사 선임비를 지원받습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Partner Lawyers */}
            <section className="py-10 px-4">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 md:p-10 border border-slate-700 flex flex-col md:flex-row items-center justify-between shadow-2xl">
                    <div className="mb-6 md:mb-0 text-center md:text-left">
                        <div className="inline-block px-3 py-1 bg-blue-900/50 text-blue-300 text-xs font-bold rounded mb-3 border border-blue-500/30">
                            변호사님을 모십니다
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">로픽 파트너가 되어주세요</h2>
                        <p className="text-slate-400 text-sm">광고비 0원, 월 고정 자문료 지급. <br className="hidden md:block" />오직 법률 검토에만 집중하세요.</p>
                    </div>
                    <button
                        onClick={() => setIsPartnerModalOpen(true)}
                        className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 px-6 rounded-lg transition-colors flex items-center shadow-lg"
                    >
                        파트너 제안서 받기 <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </section>

            {/* 6. Footer (Business Info - 실제 사업자 정보 반영) */}
            <footer className="py-12 bg-[#050912] border-t border-slate-900 text-slate-500 text-xs leading-relaxed">
                <div className="container mx-auto px-4 max-w-5xl">

                    {/* 상단: 상호명 및 서비스명 */}
                    <div className="mb-6 border-b border-slate-800 pb-6">
                        <h3 className="text-lg font-bold text-slate-200 mb-1">
                            코픽 (Kopick) <span className="text-slate-600 mx-2">|</span> 서비스명: 로픽 (LawPick)
                        </h3>
                    </div>

                    {/* 중간: 상세 사업자 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-8">
                        <div className="space-y-1">
                            <p>대표자: <span className="text-slate-300">송치호</span> <span className="mx-1 text-slate-700">|</span> 사업자등록번호: <span className="text-slate-300">687-09-02870</span></p>
                            <p>통신판매업신고: <span className="text-slate-300">제 2025-대전서구-1854호</span></p>
                            <p>주소: <span className="text-slate-300">대전광역시 서구 도산로 79, 1106동 705호</span></p>
                            <p>고객센터: <span className="text-slate-300">support@lawpick.com</span></p>
                        </div>
                    </div>

                    {/* 하단: 법적 면책 조항 + AI 안전장치 강화 */}
                    <div className="border-t border-slate-800 pt-6 mb-6">
                        <p className="mb-4 leading-loose text-slate-600">
                            로픽은 변호사가 아니며, 법률 상담이나 문서를 직접 작성하지 않습니다. 로픽은 변호사와 의뢰인을 연결하는 플랫폼 제공자로서, 법적 책임은 각 당사자에게 있습니다.
                        </p>
                        <p className="text-slate-500 font-bold">
                            ⚠ AI 진단 유의사항: 로픽의 AI 진단 결과는 법률적 참고 자료일 뿐이며 법적 효력이 없습니다. 최종 판단은 반드시 변호사와 상의하시기 바랍니다.
                        </p>
                    </div>

                    {/* 최하단: Copyright 및 약관 링크 */}
                    <div className="flex flex-col md:flex-row justify-between items-center text-slate-600">
                        <p className="mb-2 md:mb-0">© 2025 LawPick Corp. All rights reserved.</p>
                        <div className="flex gap-6">
                            <button onClick={() => { setAuthInitialView('TERMS'); setIsAuthModalOpen(true); }} className="hover:text-slate-300 transition-colors">이용약관</button>
                            <button onClick={() => { setAuthInitialView('PRIVACY'); setIsAuthModalOpen(true); }} className="hover:text-slate-300 transition-colors font-bold">개인정보처리방침</button>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
