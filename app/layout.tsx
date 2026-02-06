import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import KakaoInit from "@/components/kakao-init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LawPick - 대한민국 1등 법률 방어 시스템",
    description: "변호사 선임비 550만 원, 월 4,900원에 미리 대비하세요.",
    openGraph: {
        title: "LawPick - 내 손안의 변호사",
        description: "지금 바로 무료로 법률 위험도를 진단해보세요.",
        type: "website",
        locale: "ko_KR",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={inter.className}>
                {/* 1. 포트원 결제 스크립트 */}
                <Script
                    src="https://cdn.iamport.kr/v1/iamport.js"
                    strategy="beforeInteractive"
                />

                {/* 2. [추가됨] 카카오 로그인 스크립트 (Client Component로 분리) */}
                <KakaoInit />

                {/* 3. 구글 애널리틱스 (기존 유지) */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
                </Script>

                {children}
            </body>
        </html>
    );
}
