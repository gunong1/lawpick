import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "LawPick - 로픽 | 내 법률 위험도 무료 진단",
    description: "변호사 선임비, 로픽 멤버십으로 대비하세요.",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#1A2B45",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className="flex justify-center min-h-screen bg-neutral-50">
                <main className="w-full min-h-screen bg-white relative">
                    {children}
                </main>
            </body>
        </html>
    );
}
