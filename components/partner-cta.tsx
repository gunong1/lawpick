export default function PartnerCTA() {
    return (
        <section className="px-5 py-20">
            <div className="max-w-4xl mx-auto bg-navy-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 rounded-full bg-blue-400/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                    <div>
                        <span className="inline-block bg-blue-500/20 text-blue-300 text-sm font-bold px-3 py-1 rounded-lg mb-4 border border-blue-500/30">
                            변호사님을 모십니다
                        </span>

                        <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                            로픽 파트너가 되어주세요
                        </h3>

                        <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                            광고비 0원, 월 고정 자문료 지급.<br />
                            오직 법률 상담에만 집중하세요.
                        </p>
                    </div>

                    <button className="w-full md:w-auto md:min-w-[240px] bg-white text-navy-900 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg flex items-center justify-center gap-2 whitespace-nowrap">
                        <span>파트너 제안서 받기</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
