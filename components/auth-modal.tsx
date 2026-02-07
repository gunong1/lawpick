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

// [약관 데이터 - 전문]
const TERMS_CONTENT = {
    terms: `제1조 (목적)
본 약관은 주식회사 로픽(이하 "회사")이 제공하는 AI 법률 분석 서비스(이하 "서비스")의 이용에 관한 조건과 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 제공하는 AI 기반 법률 문서 분석, 위험도 진단, 내용증명 생성 등의 온라인 서비스를 의미합니다.
② "회원"이란 본 약관에 동의하고 회원 가입을 완료한 자를 말합니다.
③ "비회원"이란 회원 가입 없이 서비스를 이용하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 약관은 적용일자 7일 전부터 공지합니다.
③ 회원이 개정 약관의 적용에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.

제4조 (서비스의 제공)
① 회사는 다음 서비스를 제공합니다.
  1. AI 기반 계약서 및 법률 문서 위험도 분석
  2. 사건 상황에 대한 AI 법률 진단
  3. 내용증명 자동 생성
  4. 기타 회사가 정하는 서비스
② 서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.

제5조 (회원 가입)
① 이용자는 회사가 정한 절차에 따라 약관에 동의하고 회원 가입을 신청합니다.
② 회사는 다음 각 호에 해당하는 경우 회원 가입을 거부할 수 있습니다.
  1. 타인의 명의를 도용한 경우
  2. 허위 정보를 기재한 경우
  3. 기타 회원으로 등록하는 것이 부적절하다고 판단되는 경우

제6조 (회원의 의무)
① 회원은 서비스 이용 시 다음 행위를 하여서는 안 됩니다.
  1. 타인의 정보를 도용하는 행위
  2. 회사의 서비스 운영을 방해하는 행위
  3. 서비스를 이용하여 얻은 정보를 회사의 동의 없이 상업적으로 이용하는 행위
  4. 법령 또는 공서양속에 반하는 행위

제7조 (서비스 이용의 제한)
회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 제한하거나 회원 자격을 상실시킬 수 있습니다.

제8조 (면책조항)
① 본 서비스에서 제공하는 AI 분석 결과는 참고용 정보이며, 법률적 자문이나 법적 효력을 가지지 않습니다.
② 최종적인 법률 판단은 반드시 변호사 등 법률 전문가를 통해 확인하시기 바랍니다.
③ 회사는 AI 분석 결과의 정확성, 완전성, 적시성을 보장하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
④ 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.

제9조 (저작권 및 지식재산권)
① 서비스에 포함된 모든 콘텐츠(AI 분석 알고리즘, 디자인, 텍스트 등)에 대한 저작권 및 지식재산권은 회사에 귀속됩니다.
② 회원은 서비스를 이용하면서 얻은 정보를 회사의 사전 동의 없이 복제, 전송, 출판, 배포 등의 방법으로 이용하거나 제3자에게 제공할 수 없습니다.

제10조 (분쟁 해결)
① 본 약관과 관련하여 분쟁이 발생한 경우, 회사와 회원은 상호 협의하여 해결합니다.
② 협의가 이루어지지 않는 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.

부칙
본 약관은 2025년 1월 1일부터 시행합니다.`,

    privacy: `주식회사 로픽(이하 "회사")은 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.

1. 개인정보의 수집 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다.
  • 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 본인 확인, 서비스 부정 이용 방지
  • 서비스 제공: AI 법률 분석, 내용증명 생성, 맞춤형 법률 정보 제공
  • 고객 상담 및 민원 처리: 이용자 문의 응대, 불만 처리, 공지사항 전달
  • 마케팅 및 광고 활용(선택): 이벤트 및 혜택 안내, 서비스 개선을 위한 통계 분석

2. 수집하는 개인정보 항목
  • 필수 항목
    - 카카오 로그인 시: 카카오 프로필 정보(닉네임, 프로필 이미지), 이메일 주소
    - 이메일 가입 시: 이름, 이메일 주소, 비밀번호(암호화 저장), 휴대폰 번호
  • 선택 항목: 마케팅 수신 동의 여부
  • 서비스 이용 과정에서 자동 수집되는 항목: 접속 IP, 접속 일시, 서비스 이용 기록, 기기 정보(브라우저 종류, OS)

3. 개인정보의 보유 및 이용 기간
  • 회원 탈퇴 시까지 보유 후 즉시 파기
  • 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관
    - 계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)
    - 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)
    - 접속 로그 기록: 3개월 (통신비밀보호법)

4. 개인정보의 제3자 제공
회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
  • 이용자가 사전에 동의한 경우
  • 법령에 의해 요구되는 경우 (수사기관의 적법한 요청 등)

5. 개인정보의 파기
회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 된 경우에는 지체 없이 해당 개인정보를 파기합니다.
  • 전자적 파일: 복원 불가능한 방법으로 영구 삭제
  • 서면 문서: 분쇄기로 분쇄 또는 소각

6. 개인정보의 안전성 확보 조치
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
  • 비밀번호 암호화 저장 (bcrypt 등 단방향 암호화)
  • SSL/TLS 암호화 통신
  • 개인정보 접근 권한 최소화
  • 정기적인 보안 점검

7. 이용자의 권리
이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다.
  • 개인정보 열람 요구
  • 오류 등이 있을 경우 정정 요구
  • 삭제 요구
  • 처리 정지 요구
  • 회원 탈퇴 요구

8. 쿠키의 사용
회사는 서비스 이용 편의를 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을 통해 쿠키의 저장을 거부할 수 있으며, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.

9. 개인정보 보호책임자
  • 담당자: 로픽 개인정보 보호팀
  • 이메일: privacy@lawpick.kr

10. 개인정보 처리방침의 변경
본 개인정보 처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가·삭제 및 수정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 고지합니다.

시행일: 2025년 1월 1일`,

    marketing: `[마케팅 정보 수신 동의]

주식회사 로픽은 회원님께 다음과 같은 마케팅 정보를 제공하고자 합니다.

1. 수신 항목
  • 신규 서비스 및 기능 업데이트 안내
  • 법률 관련 유용한 정보 및 콘텐츠
  • 이벤트, 프로모션 및 할인 혜택 안내
  • 맞춤형 서비스 추천

2. 수신 방법
  • 이메일, 앱 푸시 알림, 카카오톡 메시지

3. 수신 동의 철회
  • 마케팅 수신 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다.
  • 수신 동의 후에도 언제든지 마이페이지 또는 고객센터를 통해 철회할 수 있습니다.

4. 개인정보 보유 기간
  • 마케팅 목적의 개인정보는 수신 동의 철회 시 또는 회원 탈퇴 시 즉시 파기됩니다.`
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

    // 약관 보기 화면 처리
    // initialView로 열렸으면 닫을 때 모달 자체를 닫고, 회원가입 폼에서 열었으면 폼으로 돌아감
    const handleTermClose = () => {
        if (initialView !== 'NONE') {
            // 푸터 등에서 약관만 보려고 연 경우 → 모달 자체를 닫음
            setViewingTerm('NONE');
            onClose();
        } else {
            // 회원가입 폼에서 약관을 본 경우 → 폼으로 돌아감
            setViewingTerm('NONE');
        }
    };

    if (!isOpen) return null;
    if (viewingTerm !== 'NONE') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md h-[500px] flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                        <button onClick={handleTermClose} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-bold"><ChevronLeft className="w-5 h-5 mr-1" /> 뒤로</button>
                        <span className="font-bold text-slate-800">{viewingTerm === 'TERMS' ? '이용약관' : viewingTerm === 'PRIVACY' ? '개인정보처리방침' : '마케팅 수신 동의'}</span><div className="w-8"></div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto bg-white custom-scrollbar"><div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{viewingTerm === 'TERMS' ? TERMS_CONTENT.terms : viewingTerm === 'PRIVACY' ? TERMS_CONTENT.privacy : TERMS_CONTENT.marketing}</div></div>
                    <div className="p-4 border-t border-slate-100"><button onClick={handleTermClose} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">확인했습니다</button></div>
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
