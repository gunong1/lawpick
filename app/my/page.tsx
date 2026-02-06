'use client';

import { useState, useEffect } from 'react';
import { CreditCard, User, FileText, ChevronRight, Shield, AlertTriangle, CheckCircle2, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function MyPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 가상의 구독/결제 상태
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [hasCard, setHasCard] = useState(false);
    const [isCardFormOpen, setIsCardFormOpen] = useState(false);

    // 카드 입력 상태
    const [cardNumber, setCardNumber] = useState({ p1: '', p2: '', p3: '', p4: '' });

    useEffect(() => {
        const checkLogin = () => {
            const savedUser = localStorage.getItem('session_user');
            setTimeout(() => {
                if (savedUser) {
                    setUser({
                        name: savedUser,
                        email: 'user@lawpick.com',
                        phone: '010-****-****',
                        joinDate: '2026.02.06'
                    });
                } else {
                    setUser({
                        name: '게스트',
                        email: 'guest@lawpick.com',
                        phone: '010-0000-0000',
                        joinDate: '2026.02.06'
                    });
                }
                setLoading(false);
            }, 500);
        };
        checkLogin();
    }, []);

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('session_user');
            alert('로그아웃 되었습니다.');
            router.push('/');
        }
    };

    const handleRegisterCard = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!window.IMP) return;

        // 로컬 스토리지에 저장된 카카오 정보 가져오기
        const userEmail = localStorage.getItem('user_email') || `user_${new Date().getTime()}`;
        const userName = localStorage.getItem('session_user') || '고객';

        window.IMP.request_pay({
            pg: 'html5_inicis',
            pay_method: 'card',
            merchant_uid: `card_reg_${new Date().getTime()}`,
            name: '로픽 멤버십 정기결제 카드 등록',
            amount: 0,
            customer_uid: userEmail, // [중요] 카카오 이메일을 결제 ID로 사용
            buyer_email: userEmail,
            buyer_name: userName,
        }, (rsp: any) => {
            if (rsp.success) {
                alert('카드가 성공적으로 등록되었습니다! (정기결제 준비 완료)');
                setHasCard(true);
            } else {
                alert(`카드 등록 실패: ${rsp.error_msg}`);
            }
        });
    };

    const handleSubscribe = () => {
        if (!hasCard) {
            alert('결제 수단을 먼저 등록해주세요.');
            setIsCardFormOpen(true);
            return;
        }
        if (confirm('월 4,900원 멤버십을 구독하시겠습니까?\n등록된 카드로 즉시 결제됩니다.')) {
            setIsSubscribed(true);
            alert('환영합니다! 로픽 멤버십이 활성화되었습니다.');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">로딩 중...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">

            {/* 헤더 - 밝은 배경으로 로고 가시성 확보 */}
            <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <Image src="/logo.png" alt="LawPick" width={120} height={32} className="h-8 w-auto" />
                        <span className="text-xs font-medium text-slate-400 ml-1 bg-slate-100 px-2 py-0.5 rounded">MY</span>
                    </Link>
                    <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium">
                        <LogOut className="w-4 h-4" /> 로그아웃
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-10 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* 왼쪽: 프로필 및 메뉴 */}
                    <div className="md:col-span-1 space-y-6">
                        {/* 프로필 카드 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                                🐶
                            </div>
                            <h2 className="text-xl font-bold mb-1">{user?.name}님</h2>
                            <p className="text-sm text-slate-400 mb-4">{user?.email}</p>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${isSubscribed ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                {isSubscribed ? 'PREMIUM 멤버십' : 'FREE 회원'}
                            </div>
                        </div>

                        {/* 메뉴 리스트 */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                            <div className="p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3 text-sm font-medium"><User className="w-4 h-4 text-slate-400" /> 내 정보 수정</div>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3 text-sm font-medium"><Shield className="w-4 h-4 text-slate-400" /> 보안 설정</div>
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="p-4 hover:bg-slate-700/50 cursor-pointer flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3 text-sm font-medium text-red-400"><AlertTriangle className="w-4 h-4" /> 회원 탈퇴</div>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 대시보드 메인 */}
                    <div className="md:col-span-2 space-y-6">

                        {/* 1. 구독/결제 관리 섹션 */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
                            {isSubscribed && <div className="absolute top-0 right-0 p-3 bg-blue-600 text-xs font-bold rounded-bl-xl text-white">구독 중</div>}

                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-500" /> 구독 및 결제 관리
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 구독 상태 */}
                                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                                    <div className="text-sm text-slate-400 mb-1">현재 이용 중인 플랜</div>
                                    <div className="text-xl font-bold text-white mb-2">{isSubscribed ? '로픽 멤버십 (월 4,900원)' : '무료 체험판'}</div>
                                    {!isSubscribed ? (
                                        <button onClick={handleSubscribe} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors">
                                            멤버십 시작하기
                                        </button>
                                    ) : (
                                        <div className="text-xs text-slate-500">다음 결제일: 2026.03.06</div>
                                    )}
                                </div>

                                {/* 결제 수단 */}
                                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                                    <div className="text-sm text-slate-400 mb-1">등록된 결제 수단</div>
                                    {hasCard ? (
                                        <div className="flex items-center justify-between h-full pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-5 bg-slate-200 rounded"></div>
                                                <span className="text-sm font-bold">**** 1234</span>
                                            </div>
                                            <button onClick={() => { setHasCard(false); setIsSubscribed(false); alert('카드가 삭제되었습니다.'); }} className="text-xs text-red-400 underline">삭제</button>
                                        </div>
                                    ) : (
                                        isCardFormOpen ? (
                                            <form onSubmit={handleRegisterCard} className="space-y-2">
                                                <div className="flex gap-1">
                                                    <input type="text" maxLength={4} className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-1 text-center text-sm" placeholder="0000" onChange={(e) => setCardNumber({ ...cardNumber, p1: e.target.value })} />
                                                    <input type="password" maxLength={4} className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-1 text-center text-sm" placeholder="****" />
                                                    <input type="password" maxLength={4} className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-1 text-center text-sm" placeholder="****" />
                                                    <input type="text" maxLength={4} className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-1 text-center text-sm" placeholder="0000" onChange={(e) => setCardNumber({ ...cardNumber, p4: e.target.value })} />
                                                </div>
                                                <button type="submit" className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded">등록 완료</button>
                                            </form>
                                        ) : (
                                            <button onClick={() => setIsCardFormOpen(true)} className="w-full h-10 border border-dashed border-slate-600 rounded-lg text-slate-500 text-sm hover:text-white hover:border-slate-400 transition-colors flex items-center justify-center">
                                                + 카드 등록하기
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. 최근 진단 내역 */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-500" /> 최근 법률 리스크 진단 내역
                            </h3>

                            <div className="space-y-3">
                                {/* 샘플 데이터 1 */}
                                <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-700/80 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200 group-hover:text-white">전세 계약 특약 검토</div>
                                            <div className="text-xs text-slate-500">2026.02.05 · 위험도 높음 (85점)</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300" />
                                </div>

                                {/* 샘플 데이터 2 */}
                                <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-700/80 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200 group-hover:text-white">차용증 법적 효력 분석</div>
                                            <div className="text-xs text-slate-500">2026.01.20 · 안전함 (15점)</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300" />
                                </div>
                            </div>

                            <button className="w-full mt-4 py-3 text-sm text-slate-500 font-bold hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                진단 기록 전체보기
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
