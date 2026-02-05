export default function TermsPage() {
    return (
        <main className="bg-white min-h-screen py-12 px-6">
            <div className="max-w-md mx-auto prose prose-slate prose-sm text-slate-700">
                <h1 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">이용약관</h1>

                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">제1조 (목적)</h2>
                    <p>
                        본 약관은 2025년부터 적용되며, 코픽(이하 "회사")이 제공하는 로픽(LawPick) 서비스의 이용조건 및 절차,
                        회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">제2조 (서비스의 내용)</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>AI 기반 법률 정보 제공 및 유사 사례 검색</li>
                        <li>파트너 변호사 연결 및 상담 예약 중개</li>
                        <li>법률 문서 작성 가이드 제공</li>
                    </ul>

                    <h2 className="text-lg font-bold text-slate-900">제3조 (면책 조항)</h2>
                    <p className="p-4 bg-slate-50 rounded-lg text-sm border border-slate-100">
                        회사는 "통신판매중개자"로서 법률 서비스의 직접적인 주체가 아닙니다.
                        제공되는 AI 답변은 참고용이며, 실제 법적 효력을 갖는 변호사의 상담을 대체할 수 없습니다.
                        서비스 이용 과정에서 발생하는 회원 간, 혹은 회원과 변호사 간의 분쟁에 대해 회사는 책임을 지지 않습니다.
                    </p>

                    <h2 className="text-lg font-bold text-slate-900">제4조 (이용 요금)</h2>
                    <p>
                        법률 매칭 서비스는 월 구독료 4,900원으로 제공되며,
                        회원은 언제든지 구독을 해지할 수 있습니다.
                        단, 이미 결제된 기간에 대한 환불은 회사의 환불 규정에 따릅니다.
                    </p>
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
