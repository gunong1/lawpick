import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-xs leading-relaxed">
            <div className="max-w-md mx-auto space-y-6">
                {/* Company Info */}
                <div className="space-y-1.5 text-[11px] text-slate-500 font-light tracking-tight selection:bg-slate-700">
                    <h5 className="text-slate-300 font-semibold text-sm mb-3">코픽 (Kopick) <span className="mx-2 text-slate-600">|</span> 서비스명: 로픽 (LawPick)</h5>

                    <div className="flex flex-col gap-1 md:block">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                            <span>대표자: 송치호</span>
                            <span className="text-slate-700">|</span>
                            <span>사업자등록번호: 687-09-02870</span>
                            <span className="text-slate-700">|</span>
                            <span>통신판매업신고: 제 2025-대전서구-1854호</span>
                        </div>
                        <p>주소: 대전광역시 서구 도산로 79, 1106동 705호</p>
                        <p>고객센터: <a href="mailto:support@lawpick.com" className="text-slate-400 hover:text-white transition-colors underline decoration-slate-700 underline-offset-2">support@lawpick.com</a></p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-4 border-t border-slate-800">
                    <p className="text-slate-500">
                        로픽은 변호사가 아니며, 법률 상담이나 문서를 직접 작성하지 않습니다.
                        로픽은 변호사와 의뢰인을 연결하는 플랫폼 제공자로서, 법적 책임은 각 당사자에게 있습니다.
                    </p>
                </div>

                {/* Links & Copyright */}
                <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 pt-4 border-t border-slate-800">
                    <p>© 2025 LawPick Corp. All rights reserved.</p>
                    <div className="flex gap-4 font-medium">
                        <Link href="/terms" className="hover:text-white transition-colors">
                            이용약관
                        </Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">
                            개인정보처리방침
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
