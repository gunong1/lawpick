'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Lock, Mail, User, Phone, AlertCircle, Check, ShieldCheck, ChevronLeft } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (userName: string) => void;
    initialView?: 'NONE' | 'TERMS' | 'PRIVACY';
}

declare global {
    interface Window {
        Kakao: any;
    }
}

// [약관 데이터 유지]
const TERMS_CONTENT = {
    terms: `제1조 (목적)\n본 약관은 주식회사 로픽(이하 "회사")이 제공하는 서비스 이용 조건을 규정합니다... (중략)`,
    privacy: `1. 수집 목적: 회원 식별 및 서비스 제공\n2. 수집 항목: 카카오톡 프로필 정보(닉네임, 이메일)... (중략)`,
    marketing: `이벤트 및 혜택 알림 수신 동의...`
};

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialView = 'NONE' }: AuthModalProps) {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
    const [viewingTerm, setViewingTerm] = useState<'NONE' | 'TERMS' | 'PRIVACY' | 'MARKETING'>('NONE');
    const [loadingType, setLoadingType] = useState<'NONE' | 'EMAIL' | 'KAKAO' | 'GOOGLE'>('NONE');

    // 카카오 SDK 초기화 (모달 열릴 때)
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined' && window.Kakao) {
            if (!window.Kakao.isInitialized()) {
                // ★ [중요] 여기에 아까 복사한 'JavaScript 키'를 붙여넣으세요!
                window.Kakao.init('83b4c730554c3027ec9d1b0552367309');
            }
        }
    }, [isOpen]);

    // 이메일 로그인/회원가입 상태
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // 에러 및 약관 동의 상태
    const [errors, setErrors] = useState<any>({});
    const [agreements, setAgreements] = useState({
        all: false,
        terms: false,
        privacy: false,
        marketing: false,
    });

    useEffect(() => {
        if (isOpen && initialView !== 'NONE') setViewingTerm(initialView);
    }, [isOpen, initialView]);

    const validateForm = () => {
        const newErrors: any = {};
        if (!email) newErrors.email = '이메일을 입력해주세요.';
        if (!password) newErrors.password = '비밀번호를 입력해주세요.';
        if (mode === 'SIGNUP') {
            if (!name) newErrors.name = '이름을 입력해주세요.';
            if (!phone) newErrors.phone = '휴대폰 번호를 입력해주세요.';
            if (!agreements.terms) newErrors.form = '필수 약관에 동의해주세요.';
            if (!agreements.privacy) newErrors.form = '필수 약관에 동의해주세요.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoadingType('EMAIL');
        // 가상의 로그인 딜레이 (1초)
        setTimeout(() => {
            setLoadingType('NONE');
            if (mode === 'LOGIN') {
                if (email.includes('@')) {
                    const userName = email.split('@')[0];
                    localStorage.setItem('session_user', userName);
                    localStorage.setItem('user_email', email);
                    // 커스텀 이벤트 발생 (스캐너에서 감지)
                    window.dispatchEvent(new Event('lawpick_login'));
                    onLoginSuccess(userName);
                    onClose();
                } else {
                    setErrors({ form: '이메일 형식이 올바르지 않습니다.' });
                }
            } else {
                alert('가입이 완료되었습니다! 로그인해주세요.');
                setMode('LOGIN');
            }
        }, 1000);
    };

    const handleAllCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setAgreements({ all: checked, terms: checked, privacy: checked, marketing: checked });
    };

    const handleSingleCheck = (key: keyof typeof agreements) => {
        const newAgreements = { ...agreements, [key]: !agreements[key] };
        const allChecked = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
        setAgreements({ ...newAgreements, all: allChecked });
    };

    // [핵심] 실제 카카오 로그인 함수
    const handleKakaoLogin = () => {
        console.log('Kakao Login Clicked. window.Kakao:', window.Kakao);

        if (!window.Kakao) {
            alert('카카오 로그인을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        if (!window.Kakao.isInitialized()) {
            window.Kakao.init('83b4c730554c3027ec9d1b0552367309');
        }

        setLoadingType('KAKAO');

        // 카카오 로그인 팝업 띄우기
        window.Kakao.Auth.login({
            success: function (authObj: any) {
                // 로그인 성공 시 사용자 정보 가져오기
                window.Kakao.API.request({
                    url: '/v2/user/me',
                    success: function (res: any) {
                        console.log('Kakao User Info Response:', res); // 디버깅 로그 추가
                        const kakaoAccount = res.kakao_account;
                        const nickname = kakaoAccount?.profile?.nickname || `카카오 회원 (${res.id})`;
                        const email = kakaoAccount?.email || `kakao_${res.id}`; // 이메일이 없을 경우 ID로 대체

                        // 로그인 성공 처리
                        localStorage.setItem('session_user', nickname);
                        localStorage.setItem('user_email', email); // 결제 연동을 위해 이메일 저장
                        // 커스텀 이벤트 발생 (스캐너에서 감지)
                        window.dispatchEvent(new Event('lawpick_login'));

                        setLoadingType('NONE');
                        onLoginSuccess(nickname);
                        onClose();
                        // alert(`반갑습니다, ${nickname}님! 카카오로 로그인되었습니다.`); // 너무 잦은 알림 방지
                    },
                    fail: function (error: any) {
                        alert('사용자 정보를 불러오는데 실패했습니다.');
                        setLoadingType('NONE');
                    }
                });
            },
            fail: function (err: any) {
                // alert('로그인에 실패했습니다.'); // 창을 닫거나 취소했을 때
                setLoadingType('NONE');
            },
        });
    };

    // 약관 보기 화면 처리 (기존 동일)
    if (!isOpen) return null;
    if (viewingTerm !== 'NONE') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md h-[500px] flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                        <button onClick={() => setViewingTerm('NONE')} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-bold"><ChevronLeft className="w-5 h-5 mr-1" /> 뒤로</button>
                        <span className="font-bold text-slate-800">{viewingTerm === 'TERMS' ? '이용약관' : '개인정보처리방침'}</span><div className="w-8"></div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar"><div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{viewingTerm === 'TERMS' ? TERMS_CONTENT.terms : TERMS_CONTENT.privacy}</div></div>
                    <div className="p-4 border-t border-slate-100"><button onClick={() => setViewingTerm('NONE')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">확인했습니다</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X className="w-6 h-6" /></button>

                <div className="p-8 pb-0 text-center flex-shrink-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">{mode === 'LOGIN' ? '로픽 로그인' : '로픽 가입'}</h2>
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" />금융권 수준의 보안으로 보호됩니다.</p>
                </div>

                <div className="flex border-b border-slate-200 mt-6 px-8 flex-shrink-0">
                    <button onClick={() => setMode('LOGIN')} className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${mode === 'LOGIN' ? 'text-blue-900 border-blue-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>로그인</button>
                    <button onClick={() => setMode('SIGNUP')} className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${mode === 'SIGNUP' ? 'text-blue-900 border-blue-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>회원가입</button>
                </div>

                <div className="overflow-y-auto p-8 pt-6 custom-scrollbar">
                    <div className="space-y-3 mb-6">
                        {/* [수정됨] 진짜 카카오 로그인 버튼 연결 */}
                        <button
                            type="button"
                            onClick={handleKakaoLogin}
                            disabled={loadingType !== 'NONE'}
                            className="w-full bg-[#FEE500] text-[#191919] font-medium py-3 rounded-xl flex items-center justify-center hover:bg-[#FDD835] transition-colors text-sm disabled:opacity-70"
                        >
                            {loadingType === 'KAKAO' ? <Loader2 className="animate-spin w-5 h-5" /> : <><span className="font-bold">Kakao</span>로 3초 만에 시작하기</>}
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center mb-6">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">또는 이메일로 {mode === 'LOGIN' ? '로그인' : '가입'}</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* 이메일 로그인/가입 폼 복구 */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.form && (<div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-2" />{errors.form}</div>)}

                        {mode === 'SIGNUP' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="relative"><User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="text" placeholder="실명 입력" value={name} onChange={(e) => setName(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>
                                    {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <div className="relative"><Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="tel" placeholder="휴대폰 번호 (- 없이)" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>
                                    {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>
                            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                        </div>

                        <div>
                            <div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="password" placeholder="비밀번호 (영문/숫자/특수문자 포함 8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>
                            {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
                        </div>

                        {mode === 'SIGNUP' && (
                            <div className="bg-slate-50 p-4 rounded-xl space-y-3 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreements.all ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        <Check className={`w-3 h-3 ${agreements.all ? 'text-white' : 'text-transparent'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={agreements.all} onChange={handleAllCheck} />
                                    <span className="text-sm font-bold text-slate-700">약관 전체 동의</span>
                                </label>
                                <div className="border-t border-slate-200 my-2"></div>
                                <div className="space-y-2 pl-1">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.terms} onChange={() => handleSingleCheck('terms')} />
                                            <span className="text-xs text-slate-500">[필수] 서비스 이용약관 동의</span>
                                        </label>
                                        <button type="button" onClick={() => setViewingTerm('TERMS')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.privacy} onChange={() => handleSingleCheck('privacy')} />
                                            <span className="text-xs text-slate-500">[필수] 개인정보 수집 및 이용 동의</span>
                                        </label>
                                        <button type="button" onClick={() => setViewingTerm('PRIVACY')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.marketing} onChange={() => handleSingleCheck('marketing')} />
                                            <span className="text-xs text-slate-500">[선택] 마케팅 정보 수신 동의</span>
                                        </label>
                                        <button type="button" onClick={() => setViewingTerm('MARKETING')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loadingType !== 'NONE'} className="w-full bg-[#0f172a] text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center mt-4 shadow-lg disabled:bg-slate-300">
                            {loadingType === 'EMAIL' ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'LOGIN' ? '로그인하기' : '동의하고 가입하기')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
