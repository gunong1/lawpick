export default function HeroSection() {
    return (
        <section className="pt-32 pb-16 px-6 flex flex-col items-center text-center max-w-7xl mx-auto">
            <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide border border-blue-100 animate-fade-in-up">
                ⚖️ 1분 만에 확인하는 법률 리스크
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-navy-900 leading-tight mb-6 break-keep animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                변호사 선임비<br className="md:hidden" />
                <span className="text-blue-500"> 550만 원</span>,<br />
                4,900원에 대비하세요.
            </h1>

            <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-10 break-keep max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                전세 사기부터 교통사고까지.<br className="md:hidden" />
                언제 터질지 모르는 법적 문제,<br className="md:hidden" />
                <span className="font-semibold text-navy-900"> 로픽(LawPick) 멤버십</span>으로 예방하세요.
            </p>

            <button className="w-full max-w-xs md:max-w-sm bg-navy-900 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-200 text-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                내 법률 위험도 무료 진단
            </button>

            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    누적 진단 12,403건
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>평균 만족도 4.9/5.0</span>
            </div>
        </section>
    );
}
