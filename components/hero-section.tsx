"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-slate-900">
            {/* Aurora Background */}
            <div className="absolute inset-0 -z-10 bg-slate-900">
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-blue-500/30 blur-3xl rounded-full translate-y-[-50%] pointer-events-none" />

                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                        opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                    className="absolute -top-[20%] -left-[10%] w-[140%] h-[140%] bg-gradient-radial from-blue-900 via-slate-900 to-transparent blur-3xl opacity-50"
                />
                <motion.div
                    animate={{
                        x: ["-20%", "20%", "-20%"],
                        y: ["-10%", "10%", "-10%"],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                    }}
                    className="absolute top-[10%] inset-x-0 w-full h-[600px] bg-gradient-conic from-blue-500/20 via-cyan-400/20 to-transparent blur-[100px]"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-block px-4 py-1.5 mb-8 rounded-full bg-blue-500/10 text-blue-300 text-sm font-semibold tracking-wide border border-blue-500/20 backdrop-blur-sm"
                >
                    ⚖️ 1분 만에 확인하는 법률 리스크
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 break-keep"
                >
                    변호사 선임비<br className="md:hidden" />
                    <span className="text-blue-400"> 550만 원</span>,<br />
                    4,900원에 대비하세요.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 break-keep max-w-2xl mx-auto"
                >
                    전세 사기부터 교통사고까지.<br className="md:hidden" />
                    언제 터질지 모르는 법적 문제,<br className="md:hidden" />
                    <span className="font-semibold text-white"> 로픽(LawPick) 멤버십</span>으로 예방하세요.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.6 }}
                    className="w-full max-w-xs md:max-w-sm"
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
                </motion.div>
            </div>
        </section>
    );
}
