"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

const questions = [
    {
        id: 1,
        question: "현재 거주 형태가 어떻게 되시나요?",
        options: ["자가 (내 집)", "전세 (보증금 있음)", "월세 (보증금 있음)"],
    },
    {
        id: 2,
        question: "직업 형태가 어떻게 되시나요?",
        options: ["직장인 (4대보험)", "개인사업자", "프리랜서 / 기타"],
    },
    {
        id: 3,
        question: "최근 1년 내 100만 원 이상 거래 경험이 있나요?",
        options: ["있음 (중고거래, 계약 등)", "없음"],
    },
    {
        id: 4,
        question: "평소 운전을 하시나요?",
        options: ["자차 운전", "대중교통 / 도보"],
    },
];

export default function DiagnosisPage() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ score: number; riskLevel: string; summary: string } | null>(null);

    const handleOptionClick = async (option: string) => {
        const newAnswers = [...answers, option];
        setAnswers(newAnswers);

        if (step < questions.length - 1) {
            setTimeout(() => setStep(step + 1), 200);
        } else {
            // Finish & Analyze
            setLoading(true);
            try {
                const res = await fetch("/api/diagnosis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: newAnswers }),
                });
                const data = await res.json();
                setResult(data);
            } catch (e) {
                console.error(e);
                setResult({ score: 50, riskLevel: "주의", summary: "분석 중 오류가 발생했습니다." });
            } finally {
                setLoading(false);
            }
        }
    };

    // Result View
    if (result) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center"
                >
                    <div className="mb-6 flex justify-center">
                        {result.score >= 70 ? (
                            <AlertTriangle className="w-20 h-20 text-red-500" />
                        ) : result.score >= 40 ? (
                            <ShieldCheck className="w-20 h-20 text-yellow-500" />
                        ) : (
                            <CheckCircle2 className="w-20 h-20 text-green-500" />
                        )}
                    </div>

                    <h2 className="text-xl text-slate-400 mb-2">나의 법률 위험도</h2>
                    <div className="text-6xl font-extrabold mb-6 flex items-center justify-center gap-2">
                        <span className={result.score >= 70 ? "text-red-400" : result.score >= 40 ? "text-yellow-400" : "text-green-400"}>
                            {result.score}
                        </span>
                        <span className="text-2xl text-slate-500">/ 100</span>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl mb-8 border border-slate-700">
                        <h3 className={`text-lg font-bold mb-2 ${result.score >= 70 ? "text-red-400" : "text-white"}`}>
                            {result.riskLevel} 단계입니다
                        </h3>
                        <p className="text-slate-300 leading-relaxed word-keep">
                            {result.summary}
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="block w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-lg shadow-blue-900/30"
                    >
                        월 4,900원으로 대비하기
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Loading View
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold animate-pulse">AI 변호사가 분석 중입니다...</h2>
            </div>
        );
    }

    // Question View
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                />
            </div>

            <div className="max-w-md w-full">
                <header className="mb-12 text-center">
                    <span className="text-blue-400 font-medium text-sm tracking-wider uppercase mb-2 block">
                        Legal Risk Diagnosis
                    </span>
                    <h1 className="text-3xl font-bold">무료 법률 위험 진단</h1>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-2xl font-semibold mb-8 text-center leading-relaxed">
                            Q{step + 1}. {questions[step].question}
                        </h2>

                        <div className="space-y-3">
                            {questions[step].options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleOptionClick(option)}
                                    className="w-full p-4 text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl transition-all flex items-center justify-between group"
                                >
                                    <span className="text-lg text-slate-200 group-hover:text-white">{option}</span>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
