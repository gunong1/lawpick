"use client";

import { motion, useInView } from "framer-motion";
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
    const inView = useInView(nodeRef, { once: true, margin: "-20%" });
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (inView && !hasAnimated) {
            setHasAnimated(true);
            const node = nodeRef.current;
            const controls = { value: from };

            let start: number;
            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / (duration * 1000), 1);

                // Ease out quart
                const ease = 1 - Math.pow(1 - progress, 4);

                const currentValue = from + (to - from) * ease;

                if (node) {
                    node.textContent = currentValue.toFixed(decimals) + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);
        }
    }, [inView, from, to, duration, suffix, decimals, hasAnimated]);

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
                        <span className="text-slate-500 text-sm font-medium">누적 진단 건수</span>
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
                        <span className="text-slate-500 text-sm font-medium">파트너 변호사</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center text-center p-4"
                    >
                        <span className="text-4xl font-bold text-blue-500 mb-2">
                            <Counter from={0} to={4.9} decimals={1} suffix="" />
                            <span className="text-2xl text-slate-300 ml-1">/ 5.0</span>
                        </span>
                        <span className="text-slate-500 text-sm font-medium">평균 만족도</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
