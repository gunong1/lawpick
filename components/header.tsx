import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className="absolute inset-0 glass"></div>
            <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-1 group">
                    <div className="relative h-8 w-32 md:h-10 md:w-40">
                        <Image
                            src="/logo-new.png"
                            alt="LawPick Logo"
                            width={120} // Adjusted width for the new aspect ratio
                            height={32}
                            className="h-8 w-auto object-contain"
                            priority
                        />
                    </div>
                </Link>
                <button className="text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors">
                    로그인
                </button>
            </div>
        </header>
    );
}
