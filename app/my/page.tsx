'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, Settings, Home, LogOut, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

export default function MyPage() {
    const [userName, setUserName] = useState('고객');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [hasCard, setHasCard] = useState(false);

    // [New] Warranty & Claim State
    const [isWarrantyAgreed, setIsWarrantyAgreed] = useState(false);
    const [claimStatus, setClaimStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [accountNum, setAccountNum] = useState('');

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

        // 4. [New] 보상 청구 상태 확인
        const savedClaimStatus = localStorage.getItem('lawpick_claim_status') as any;
        if (savedClaimStatus) setClaimStatus(savedClaimStatus);
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
        if (!isWarrantyAgreed) {
            alert('필수 약관(품질 보증 제한 동의)에 동의해주세요.');
            return;
        }

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

        if (!isWarrantyAgreed) {
            alert('필수 약관(품질 보증 제한 동의)에 동의해주세요.');
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

    // [New] 보상 청구 제출 함수
    const handleSubmitClaim = () => {
        if (!accountNum) {
            alert('입금받을 계좌번호를 입력해주세요.');
            return;
        }

        if (confirm('보상 신청을 제출하시겠습니까?\n허위 사실 입력 시 보상이 거절될 수 있습니다.')) {
            localStorage.setItem('lawpick_claim_status', 'PENDING');
            setClaimStatus('PENDING');
            setShowClaimForm(false);
            alert('보상 신청이 접수되었습니다.\n담당자가 내용을 검토한 후 연락드리겠습니다.');
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

                            <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-4 h-4 accent-blue-600"
                                        checked={isWarrantyAgreed}
                                        onChange={(e) => setIsWarrantyAgreed(e.target.checked)}
                                    />
                                    <span className="text-xs text-slate-300 leading-relaxed">
                                        <strong className="text-blue-400">[필수] 품질 보증 제한(면책) 동의</strong><br />
                                        본인은 범죄 행위, 유책 배우자(도덕적 귀책), 허위 사실 입력 등에 해당하지 않음을 확인하며, 이에 해당할 경우 보상금 지급이 거절됨에 동의합니다.
                                    </span>
                                </label>
                            </div>

                            {!hasCard ? (
                                <button onClick={handleRegisterCard} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-bold flex items-center justify-center transition-colors">
                                    <CreditCard className="w-4 h-4 mr-2" /> 결제 수단 등록하기 (동의 필수)
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

                {/* [New] Compensation Claim Section */}
                {isSubscribed && (
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-white">솔루션 실패 보상 신청</h3>
                            {claimStatus === 'PENDING' && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-bold">심사 중</span>}
                            {claimStatus === 'APPROVED' && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">승인됨</span>}
                            {claimStatus === 'REJECTED' && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded font-bold">거절됨</span>}
                        </div>

                        {claimStatus === 'NONE' ? (
                            !showClaimForm ? (
                                <div className="text-center py-6 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                                    <p className="text-slate-400 text-sm mb-4">
                                        로픽 솔루션으로 해결되지 않고 소송이 제기되었나요?<br />
                                        제품 하자에 대한 책임을 다하겠습니다.
                                    </p>
                                    <button
                                        onClick={() => setShowClaimForm(true)}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-colors"
                                    >
                                        보상 신청하기 (최대 300만 원)
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">증빙 자료 제출 (필수)</label>
                                        <div className="border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-800 cursor-pointer hover:bg-slate-750 transition-colors">
                                            <FileText className="w-6 h-6 text-slate-500 mb-2" />
                                            <span className="text-xs text-slate-400">법원 소장(부본) 또는 소송 안내서를 업로드하세요</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">입금 계좌번호</label>
                                        <input
                                            type="text"
                                            placeholder="은행명 / 계좌번호 / 예금주"
                                            value={accountNum}
                                            onChange={(e) => setAccountNum(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => setShowClaimForm(false)}
                                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleSubmitClaim}
                                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                                        >
                                            제출하기
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                                <div className="text-sm text-slate-300 mb-1">보상 심사가 진행 중입니다.</div>
                                <div className="text-xs text-slate-500">영업일 기준 3~5일 소요됩니다.</div>
                            </div>
                        )}
                    </div>
                )}

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
