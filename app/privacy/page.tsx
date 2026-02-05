export default function PrivacyPage() {
    return (
        <main className="bg-white min-h-screen py-12 px-6">
            <div className="max-w-md mx-auto prose prose-slate prose-sm text-slate-700">
                <h1 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">개인정보처리방침</h1>

                <section className="space-y-4">
                    <p>
                        코픽(이하 "회사")은 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령에 따라
                        이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록
                        하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">1. 수집하는 개인정보 항목</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>필수항목: 이름, 전화번호 (또는 소셜 로그인 ID), 이용 기록</li>
                        <li>선택항목: 법률 상담을 위한 구체적인 사건 내용, 이메일 주소</li>
                    </ul>

                    <h2 className="text-lg font-bold text-slate-900">2. 개인정보의 이용 목적</h2>
                    <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>서비스 제공: 파트너 변호사 매칭, AI 상담 결과 제공</li>
                        <li>회원 관리: 본인 확인, 불량 회원의 부정 이용 방지</li>
                        <li>마케팅 및 광고: 신규 서비스 홍보, 이벤트 정보 전달 (동의 시)</li>
                    </ul>

                    <h2 className="text-lg font-bold text-slate-900">3. 개인정보의 보유 및 이용 기간</h2>
                    <p>
                        원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                        단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 정해진 기간 동안 개인정보를 보관합니다.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                        <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                    </ul>
                </section>

                <div className="mt-12 pt-6 border-t border-slate-100 text-center">
                    <a href="/" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        돌아가기
                    </a>
                </div>
            </div>
        </main>
    );
}
