'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Lock, Mail, User, Phone, AlertCircle, Check, ShieldCheck, ChevronLeft } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (userName: string) => void;
    initialView?: 'NONE' | 'TERMS' | 'PRIVACY'; // [추가] 외부에서 약관 바로가기 요청 시 사용
}

// [실전용 약관 데이터]
const TERMS_CONTENT = {
    terms: `제1조 (목적)
본 약관은 주식회사 로픽(이하 "회사")이 제공하는 법률 리스크 진단 서비스 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 한계 및 면책) ★중요
1. 회사가 제공하는 AI 진단 결과는 법률적 참고 자료일 뿐이며, 변호사의 법률 자문이나 판결과 동일한 효력을 갖지 않습니다.
2. 회원은 진단 결과를 참고용으로만 활용해야 하며, 최종적인 법적 의사결정에 대한 책임은 회원 본인에게 있습니다.
3. 회사는 천재지변, AI 알고리즘의 기술적 한계 등으로 인해 발생한 손해에 대하여 고의 또는 중과실이 없는 한 책임을 지지 않습니다.

제3조 (이용요금 및 결제)
1. 로픽 멤버십의 이용요금은 월 4,900원(VAT 별도)입니다.
2. 회원이 등록한 결제 수단으로 매월 지정된 날짜에 자동 결제됩니다.
3. 해지 시 다음 결제일부터 청구되지 않습니다.`,

    privacy: `1. 개인정보의 수집 및 이용 목적
회사는 회원 가입, 서비스 제공(AI 분석), 요금 결제를 위해 개인정보를 수집합니다.

2. 수집하는 개인정보의 항목
- 필수: 이름, 이메일, 비밀번호, 휴대전화번호
- 선택: 업로드한 계약서 내 개인정보

3. 개인정보의 보유 및 파기
회사는 목적 달성 후 개인정보를 지체 없이 파기합니다. 단, 전자상거래법 등 관련 법령에 의하여 보존할 필요가 있는 경우 정해진 기간 동안 보존합니다.`,

    marketing: `1. 수신 동의
로픽의 새로운 기능, 할인 쿠폰, 법률 뉴스레터 등 광고성 정보를 수신하는 것에 동의합니다.

2. 철회
마이페이지 > 설정에서 언제든지 철회할 수 있습니다.`
};

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialView = 'NONE' }: AuthModalProps) {
    const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
    // 초기 뷰 설정 (외부에서 요청이 있으면 그 약관을 보여줌)
    const [viewingTerm, setViewingTerm] = useState<'NONE' | 'TERMS' | 'PRIVACY' | 'MARKETING'>('NONE');

    const [loadingType, setLoadingType] = useState<'NONE' | 'EMAIL' | 'KAKAO' | 'GOOGLE'>('NONE');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [agreements, setAgreements] = useState({ all: false, terms: false, privacy: false, marketing: false });
    const [errors, setErrors] = useState({ email: '', password: '', name: '', phone: '', form: '' });

    // [수정됨] 모달이 열릴 때 초기 화면 설정
    useEffect(() => {
        if (isOpen) {
            resetForm();
            if (initialView === 'TERMS') setViewingTerm('TERMS');
            else if (initialView === 'PRIVACY') setViewingTerm('PRIVACY');
        }
    }, [isOpen, initialView]);

    const resetForm = () => {
        setEmail(''); setPassword(''); setName(''); setPhone('');
        setErrors({ email: '', password: '', name: '', phone: '', form: '' });
        setAgreements({ all: false, terms: false, privacy: false, marketing: false });
        setViewingTerm('NONE');
        setLoadingType('NONE');
    };

    const switchMode = (newMode: 'LOGIN' | 'SIGNUP') => {
        setMode(newMode); setViewingTerm('NONE');
        setErrors({ email: '', password: '', name: '', phone: '', form: '' });
    };

    const handleAllCheck = () => {
        const newValue = !agreements.all;
        setAgreements({ all: newValue, terms: newValue, privacy: newValue, marketing: newValue });
    };

    const handleSingleCheck = (key: keyof typeof agreements) => {
        setAgreements(prev => {
            const newAgreements = { ...prev, [key]: !prev[key] };
            const allChecked = newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
            return { ...newAgreements, all: allChecked };
        });
    };

    const handleSocialLogin = (type: 'KAKAO' | 'GOOGLE') => {
        setLoadingType(type);
        setTimeout(() => {
            const fakeUser = type === 'KAKAO' ? '김카카오(Kakao)' : 'Google User';
            localStorage.setItem('session_user', fakeUser);
            setLoadingType('NONE');
            onLoginSuccess(fakeUser);
            onClose();
            alert(`${type === 'KAKAO' ? '카카오' : '구글'} 계정으로 로그인되었습니다.`);
        }, 1500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let isValid = true;
        const newErrors = { email: '', password: '', name: '', phone: '', form: '' };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { newErrors.email = '유효한 이메일 주소를 입력해주세요.'; isValid = false; }

        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*?_~]).{8,20}$/;
        if (mode === 'SIGNUP') {
            if (!passwordRegex.test(password)) { newErrors.password = '영문, 숫자, 특수문자를 포함해 8자 이상 입력해주세요.'; isValid = false; }
        } else {
            if (password.length < 1) { newErrors.password = '비밀번호를 입력해주세요.'; isValid = false; }
        }

        if (mode === 'SIGNUP') {
            if (!name.trim()) { newErrors.name = '실명을 입력해주세요.'; isValid = false; }
            if (!/^[0-9]{10,11}$/.test(phone.replace(/-/g, ''))) { newErrors.phone = '휴대폰 번호를 확인해주세요.'; isValid = false; }
            if (!agreements.terms || !agreements.privacy) { alert('서비스 이용을 위해 필수 약관에 동의해주세요.'); isValid = false; }
        }

        setErrors(newErrors);
        if (!isValid) return;

        setLoadingType('EMAIL');
        setTimeout(() => {
            if (mode === 'SIGNUP') {
                const existingUser = localStorage.getItem(`user_${email}`);
                if (existingUser) {
                    setLoadingType('NONE');
                    setErrors(prev => ({ ...prev, email: '이미 가입된 이메일입니다.', form: '이미 가입된 계정입니다.' }));
                    return;
                }
                localStorage.setItem(`user_${email}`, JSON.stringify({ name, phone, password }));
                localStorage.setItem('session_user', name);
                setLoadingType('NONE');
                alert('회원가입이 완료되었습니다!');
                onLoginSuccess(name);
                onClose();
            } else {
                const userRecord = localStorage.getItem(`user_${email}`);
                if (!userRecord) {
                    setLoadingType('NONE');
                    setErrors(prev => ({ ...prev, email: '가입되지 않은 이메일입니다.', form: '계정을 찾을 수 없습니다.' }));
                    return;
                }
                const userData = JSON.parse(userRecord);
                if (userData.password !== password) {
                    setLoadingType('NONE');
                    setErrors(prev => ({ ...prev, password: '비밀번호가 일치하지 않습니다.', form: '비밀번호 불일치' }));
                    return;
                }
                localStorage.setItem('session_user', userData.name);
                setLoadingType('NONE');
                onLoginSuccess(userData.name);
                onClose();
            }
        }, 800);
    };

    if (!isOpen) return null;

    // 약관 상세 보기 화면
    if (viewingTerm !== 'NONE') {
        let title = '', content = '';
        if (viewingTerm === 'TERMS') { title = '서비스 이용약관'; content = TERMS_CONTENT.terms; }
        if (viewingTerm === 'PRIVACY') { title = '개인정보 처리방침'; content = TERMS_CONTENT.privacy; }
        if (viewingTerm === 'MARKETING') { title = '마케팅 정보 수신 동의'; content = TERMS_CONTENT.marketing; }

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md h-[500px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                        <button onClick={() => setViewingTerm('NONE')} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-bold"><ChevronLeft className="w-5 h-5 mr-1" /> 뒤로</button>
                        <span className="font-bold text-slate-800">{title}</span><div className="w-8"></div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar"><div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</div></div>
                    <div className="p-4 border-t border-slate-100"><button onClick={() => setViewingTerm('NONE')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">확인했습니다</button></div>
                </div>
            </div>
        );
    }

    // 로그인/가입 화면
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X className="w-6 h-6" /></button>
                <div className="p-8 pb-0 text-center flex-shrink-0">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">{mode === 'LOGIN' ? '로픽 로그인' : '멤버십 가입'}</h2>
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" />금융권 수준의 보안으로 보호됩니다.</p>
                </div>
                <div className="flex border-b border-slate-200 mt-6 px-8 flex-shrink-0">
                    <button onClick={() => switchMode('LOGIN')} className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${mode === 'LOGIN' ? 'text-blue-900 border-blue-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>로그인</button>
                    <button onClick={() => switchMode('SIGNUP')} className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 ${mode === 'SIGNUP' ? 'text-blue-900 border-blue-900' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>회원가입</button>
                </div>
                <div className="overflow-y-auto p-8 pt-6 custom-scrollbar">
                    <div className="space-y-3 mb-6">
                        <button type="button" onClick={() => handleSocialLogin('KAKAO')} disabled={loadingType !== 'NONE'} className="w-full bg-[#FEE500] text-[#191919] font-medium py-3 rounded-xl flex items-center justify-center hover:bg-[#FDD835] transition-colors text-sm disabled:opacity-70">{loadingType === 'KAKAO' ? <Loader2 className="animate-spin w-5 h-5" /> : <><span className="font-bold">Kakao</span>로 3초 만에 시작하기</>}</button>
                        <button type="button" onClick={() => handleSocialLogin('GOOGLE')} disabled={loadingType !== 'NONE'} className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors text-sm disabled:opacity-70">{loadingType === 'GOOGLE' ? <Loader2 className="animate-spin w-5 h-5" /> : <><span className="font-bold mr-1">Google</span>로 시작하기</>}</button>
                    </div>
                    <div className="relative flex py-2 items-center mb-6"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs">또는 이메일로 {mode === 'LOGIN' ? '로그인' : '가입'}</span><div className="flex-grow border-t border-slate-200"></div></div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.form && (<div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-2" />{errors.form}</div>)}
                        {mode === 'SIGNUP' && (<div className="space-y-4"><div><div className="relative"><User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="text" placeholder="실명 입력" value={name} onChange={(e) => setName(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>{errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}</div><div><div className="relative"><Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="tel" placeholder="휴대폰 번호 (- 없이)" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>{errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}</div></div>)}
                        <div><div className="relative"><Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>{errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}</div>
                        <div><div className="relative"><Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" /><input type="password" placeholder="비밀번호 (영문/숫자/특수문자 포함 8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-900 text-sm ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-900 focus:ring-blue-100'}`} /></div>{errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}</div>
                        {mode === 'SIGNUP' && (<div className="bg-slate-50 p-4 rounded-xl space-y-3 mt-2"><label className="flex items-center space-x-2 cursor-pointer"><div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreements.all ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}><Check className={`w-3 h-3 ${agreements.all ? 'text-white' : 'text-transparent'}`} /></div><input type="checkbox" className="hidden" checked={agreements.all} onChange={handleAllCheck} /><span className="text-sm font-bold text-slate-700">약관 전체 동의</span></label><div className="border-t border-slate-200 my-2"></div><div className="space-y-2 pl-1"><div className="flex items-center justify-between"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.terms} onChange={() => handleSingleCheck('terms')} /><span className="text-xs text-slate-500">[필수] 서비스 이용약관 동의</span></label><button type="button" onClick={() => setViewingTerm('TERMS')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button></div><div className="flex items-center justify-between"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.privacy} onChange={() => handleSingleCheck('privacy')} /><span className="text-xs text-slate-500">[필수] 개인정보 수집 및 이용 동의</span></label><button type="button" onClick={() => setViewingTerm('PRIVACY')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button></div><div className="flex items-center justify-between"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" className="accent-blue-600 w-4 h-4" checked={agreements.marketing} onChange={() => handleSingleCheck('marketing')} /><span className="text-xs text-slate-500">[선택] 마케팅 정보 수신 동의</span></label><button type="button" onClick={() => setViewingTerm('MARKETING')} className="text-xs text-slate-400 hover:text-slate-600 underline">보기</button></div></div></div>)}
                        <button type="submit" disabled={loadingType !== 'NONE'} className="w-full bg-[#0f172a] text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center mt-4 shadow-lg disabled:bg-slate-300">{loadingType === 'EMAIL' ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'LOGIN' ? '로그인하기' : '동의하고 가입하기')}</button>
                    </form>
                </div>
                <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-200 flex-shrink-0">{mode === 'LOGIN' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'} <button onClick={() => switchMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-blue-900 font-bold ml-1 hover:underline">{mode === 'LOGIN' ? '회원가입' : '로그인'}</button></div>
            </div>
        </div>
    );
}
