import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import StatsCounter from "@/components/stats-counter";
import ReviewMarquee from "@/components/review-marquee";
import ChatDemo from "@/components/chat-demo";
import PartnerCTA from "@/components/partner-cta";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <HeroSection />
            <StatsCounter />
            <ReviewMarquee />
            <ChatDemo />
            <PartnerCTA />

            {/* Simple Footer */}
            <footer className="text-center py-6 text-slate-300 text-[10px]">
                &copy; 2024 LawPick Corp. All rights reserved.
            </footer>
        </div>
    );
}
