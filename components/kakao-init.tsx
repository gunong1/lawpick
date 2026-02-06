'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
    interface Window {
        Kakao: any;
    }
}

export default function KakaoInit() {
    useEffect(() => {
        // SDK가 로드된 후 초기화 시도
        // beforeInteractive라도 useEffect 시점에는 window.Kakao가 있어야 함
        const interval = setInterval(() => {
            if (window.Kakao) {
                if (!window.Kakao.isInitialized()) {
                    window.Kakao.init('83b4c730554c3027ec9d1b0552367309');
                    console.log('Kakao SDK Initialized (Global)');
                }
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <Script
            src="https://developers.kakao.com/sdk/js/kakao.js"
            strategy="beforeInteractive"
        />
    );
}
