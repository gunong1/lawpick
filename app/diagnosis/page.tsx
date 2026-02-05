"use client";

import Header from "@/components/header";
import LawpickScanner from "@/components/lawpick-scanner";

export default function DiagnosisPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />
            <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
                <LawpickScanner />
            </main>
        </div>
    );
}
