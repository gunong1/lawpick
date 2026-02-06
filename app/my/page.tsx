'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, Settings, Home, LogOut } from 'lucide-react';
import Link from 'next/link';

declare global {
    interface Window {
        IMP: any;
    }
}

export default function MyPage() {
    const [userName, setUserName] = useState('고객');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [hasCard, setHasCard] = useState(false);

    useEffect(() => {
        // 1. 로그인 세션 확인
        const savedUser = localStorage.getItem('session_user');
        if (savedUser) setUserName(savedUser);

        // 2. 구독 상태 확인
        const subStatus = localStorage.getItem('lawpick_subscription');
        if (subStatus === 'true') {
            setIsSubscribed(true);
            setHasCard(true);
        }

        // 3. 포트원 초기화 (대표님의 실제 코드를 적용했습니다!)
        if (typeof window !== 'undefined' && window.IMP) {
            // 이미지에서 확인한 '고객사 식별코드'를 넣었습니다.
            window.IMP.init('imp02261832');
        }
    }, []);

    // 로그아웃 함수
    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('session_user');
            localStorage.removeItem('user_email');
            localStorage.removeItem('lawpick_subscription');
            window.location.href = '/';
        }
    };

    // 구독 해지 함수
    const handleCancelSubscription = () => {
        if (confirm('정말 멤버십을 해지하시겠습니까?\n\n해지 시 다음 결제일부터 요금이 청구되지 않으며,\n프리미엄 기능 이용이 제한됩니다.')) {
            // 구독 해지 처리
            localStorage.removeItem('lawpick_subscription');
            setIsSubscribed(false);
            setHasCard(false);
            alert('멤버십이 해지되었습니다.\n그동안 로픽을 이용해주셔서 감사합니다.');
            // (실무에서는 서버에 해지 요청을 보내야 합니다)
        }
    };

    // ★ 다날 정기결제 빌링키 발급 함수
    const handleRegisterCard = () => {
        if (!window.IMP) {
            alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 카카오 이메일이나 유저 ID를 가져옴
        const userEmail = localStorage.getItem('user_email') || `user_${new Date().getTime()}`;

        // 포트원 빌링키 발급 요청 (0원 결제)
        window.IMP.request_pay({
            pg: 'danal_tpay', // [확인됨] 다날 일반/정기결제 V1 코드
            pay_method: 'card',
            merchant_uid: `billing_${new Date().getTime()}`, // 주문번호 (매번 달라야 함)
            name: '로픽 멤버십 정기결제 카드 등록',
            amount: 0, // 0원으로 인증만 진행 (실제 청구 X)
            customer_uid: userEmail, // [중요] 나중에 이 ID로 4,900원 결제를 요청하게 됩니다.
            buyer_email: userEmail,
            buyer_name: userName,
            buyer_tel: '010-0000-0000',
        }, (rsp: any) => {
            if (rsp.success) {
                alert('카드가 안전하게 등록되었습니다.\n이제 멤버십을 시작할 수 있습니다.');
                setHasCard(true);
                // (실무에서는 여기서 서버로 rsp.customer_uid를 보내 저장해야 합니다)
            } else {
                alert(`카드 등록 실패: ${rsp.error_msg}`);
            }
        });
    };

    const handleSubscribe = () => {
        if (!hasCard) {
            alert('결제 수단을 먼저 등록해주세요.');
            return;
        }

        if (confirm('월 4,900원 멤버십을 구독하시겠습니까?\n(테스트 모드: 실제 돈은 나가지 않습니다)')) {
            setIsSubscribed(true);
            // 구독 성공 도장 찍기
            localStorage.setItem('lawpick_subscription', 'true');
            alert('환영합니다! 로픽 멤버십이 활성화되었습니다.\n이제 진단 결과의 모든 잠금이 해제됩니다.');
            // 메인으로 이동
            window.location.href = '/';
        }
    };

    return (
        <main className="min-h-screen bg-[#0f172a] text-white">
            {/* 상단 네비게이션 바 */}
            <nav className="fixed top-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-700 z-50">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    {/* 로고 (홈으로 이동) */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-sm">L</span>
                        </div>
                        <span className="font-bold text-lg">Lawpick</span>
                    </Link>

                    {/* 오른쪽 버튼들 */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">홈</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">로그아웃</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* 메인 콘텐츠 (상단바 높이만큼 패딩) */}
            <div className="max-w-2xl mx-auto p-4 pt-20 pb-20">
                <h1 className="text-3xl font-black mb-2">MY 로픽</h1>
                <p className="text-slate-400 mb-8">내 법률 안전 등급과 구독 관리</p>

                {/* 대시보드 카드 */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-xl font-bold">
                                {userName.slice(0, 1)}
                            </div>
                            <div>
                                <div className="font-bold text-lg">{userName}님</div>
                                <div className="text-sm text-slate-400">{isSubscribed ? '프리미엄 멤버십 이용 중' : '무료 회원'}</div>
                            </div>
                        </div>
                        {isSubscribed && <span className="bg-blue-600 text-xs px-2 py-1 rounded font-bold">ACTIVE</span>}
                    </div>

                    {/* 구독 상태에 따른 UI 분기 */}
                    {!isSubscribed ? (
                        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                            <h3 className="font-bold mb-2 flex items-center"><AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />구독이 필요합니다</h3>
                            <p className="text-sm text-slate-400 mb-4">카드 등록하고 첫 달 무료 혜택을 받아보세요.</p>

                            {!hasCard ? (
                                <button onClick={handleRegisterCard} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-bold flex items-center justify-center transition-colors">
                                    <CreditCard className="w-4 h-4 mr-2" /> 결제 수단 등록하기
                                </button>
                            ) : (
                                <button onClick={handleSubscribe} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold flex items-center justify-center transition-colors animate-pulse">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> 멤버십 시작하기 (월 4,900원)
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-900/20 rounded-xl p-5 border border-blue-500/30">
                            <h3 className="font-bold mb-2 text-blue-400 flex items-center"><ShieldCheck className="w-4 h-4 mr-2" />안전하게 보호받고 있습니다</h3>
                            <p className="text-sm text-slate-400 mb-4">다음 결제일: 2026. 03. 06 (4,900원)</p>
                            <button onClick={handleCancelSubscription} className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-lg font-bold text-sm text-slate-400 transition-colors">결제 수단 관리 / 해지</button>
                        </div>
                    )}
                </div>

                {/* 하단 메뉴 리스트 */}
                <div className="space-y-3">
                    <div className="bg-slate-800 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-slate-300">내 진단 리포트 보관함</span> <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-slate-300">작성한 내용증명 관리</span> <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors">
                        <span className="font-bold text-slate-300">계정 설정</span> <Settings className="w-5 h-5 text-slate-500" />
                    </div>
                </div>
            </div>
        </main>
    );
}
