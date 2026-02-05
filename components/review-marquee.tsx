"use client";

import { motion } from "framer-motion";

const REVIEWS = [
    { id: 1, text: "전세금 못 받을까 봐 떨었는데 해결됐어요.", author: "김OO님 (30대)" },
    { id: 2, text: "월 4,900원에 이런 퀄리티라니...", author: "이OO님 (20대)" },
    { id: 3, text: "변호사님 연결이 진짜 빠르네요.", author: "박OO님 (40대)" },
    { id: 4, text: "법률 용어가 너무 어려웠는데 쉽게 설명해주셔서 좋았습니다.", author: "최OO님 (50대)" },
    { id: 5, text: "작은 사고였지만 불안했는데 로픽 덕분에 안심했어요.", author: "정OO님 (30대)" },
];

export default function ReviewMarquee() {
    return (
        <section className="py-16 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
                <h2 className="text-2xl font-bold text-navy-900">
                    이미 <span className="text-blue-500">1.4만 명</span>이 로픽을 선택했습니다
                </h2>
            </div>

            <div className="relative w-full flex">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>

                <motion.div
                    className="flex gap-6 whitespace-nowrap"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30,
                    }}
                >
                    {/* Duplicate list for seamless infinite scroll */}
                    {[...REVIEWS, ...REVIEWS, ...REVIEWS].map((review, index) => (
                        <div
                            key={`${review.id}-${index}`}
                            className="inline-block w-80 p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0"
                        >
                            <p className="text-navy-900 font-medium mb-3 whitespace-normal break-keep leading-relaxed">
                                "{review.text}"
                            </p>
                            <p className="text-slate-400 text-sm text-right">
                                {review.author}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
