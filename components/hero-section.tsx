import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-slate-900">
            {/* Aurora Background */}
            <div className="absolute inset-0 -z-10 bg-slate-900">
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-blue-500/30 blur-3xl rounded-full translate-y-[-50%] pointer-events-none" />

                <div
                    className="absolute -top-[20%] -left-[10%] w-[140%] h-[140%] bg-gradient-radial from-blue-900 via-slate-900 to-transparent blur-3xl opacity-50 animate-pulse"
                    style={{ animationDuration: '4s' }}
                />
                <div
                    className="absolute top-[10%] inset-x-0 w-full h-[600px] bg-gradient-conic from-blue-500/20 via-cyan-400/20 to-transparent blur-[100px] opacity-30"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div
                    className="inline-block px-4 py-1.5 mb-8 rounded-full bg-blue-500/10 text-blue-300 text-sm font-semibold tracking-wide border border-blue-500/20 backdrop-blur-sm animate-fade-in-up"
                >
                    ⚖️ 1분 만에 확인하는 법률 리스크
                </div>

                <h1
                    className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 break-keep animate-fade-in-up"
                    style={{ animationDelay: '0.1s' }}
                >
                    변호사 선임비<br className="md:hidden" />
                    <span className="text-blue-400"> 550만 원</span>,<br />
                    4,900원에 대비하세요.
                </h1>

                <p
                    className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 break-keep max-w-2xl mx-auto animate-fade-in-up"
                    style={{ animationDelay: '0.2s' }}
                >
                    전세 사기부터 교통사고까지.<br className="md:hidden" />
                    언제 터질지 모르는 법적 문제,<br className="md:hidden" />
                    <span className="font-semibold text-white"> 로픽(LawPick) 멤버십</span>으로 예방하세요.
                </p>

                <div
                    className="w-full max-w-xs md:max-w-sm animate-fade-in-up"
                    style={{ animationDelay: '0.3s' }}
                >
                    <div className="space-y-4">
                        <Link
                            href="/diagnosis"
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl shadow-blue-900/30 transition-all hover:scale-105"
                        >
                            내 법률 위험도 무료 진단
                        </Link>
                        <p className="text-slate-400 text-sm">
                            * 3분 소요 / 별도 회원가입 없음
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
