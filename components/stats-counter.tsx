"use client";

import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

type CounterProps = {
    from: number;
    to: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
};

const Counter = ({ from, to, duration = 2, suffix = "", decimals = 0 }: CounterProps) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const inView = useInView(nodeRef, { once: true }); // Removed negative margin

    useEffect(() => {
        if (!inView) return;

        const node = nodeRef.current;
        if (!node) return;

        // Use framer-motion's animate function for hardware-accelerated value interpolation
        const controls = animate(from, to, {
            duration: duration,
            ease: "easeOut",
            onUpdate(value) {
                node.textContent = value.toFixed(decimals) + suffix;
            },
        });

        return () => controls.stop();
    }, [inView, from, to, duration, suffix, decimals]);

    return <span ref={nodeRef} className="tabular-nums">{from.toFixed(decimals) + suffix}</span>;
};

export default function StatsCounter() {
    return (
        <section className="py-12 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center text-center p-4"
                    >
                        <span className="text-4xl font-bold text-navy-900 mb-2">
                            <Counter from={0} to={14203} suffix="+" />
                        </span>
                        <span className="text-slate-500 text-sm font-medium">AI 학습 판례 데이터</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center text-center p-4"
                    >
                        <span className="text-4xl font-bold text-navy-900 mb-2">
                            <Counter from={0} to={50} suffix="+" />
                        </span>
                        <span className="text-slate-500 text-sm font-medium">진단 가능 법률 분야</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center text-center p-4"
                    >
                        <span className="text-4xl font-bold text-blue-500 mb-2">
                            365일 24시간
                        </span>
                        <span className="text-slate-500 text-sm font-medium">실시간 AI 상담 가동</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
