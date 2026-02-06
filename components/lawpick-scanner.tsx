'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Loader2, Siren } from 'lucide-react';

export default function LawpickScanner() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: input }),
            });
            const data = await response.json();
            setResult(data);
        } catch (e) {
            alert("진단 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score < 30) return 'text-green-600 bg-green-50 border-green-200';
        if (score < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white mb-4">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lawpick Scanner</h1>
                <p className="text-slate-500 mt-2">법률 리스크 정밀 진단 시스템</p>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 ml-1">상황 입력 (계약서 조항 or 사건 내용)</label>
                <textarea
                    placeholder="예) 전세 만기가 1주일 남았는데 집주인이 다음 세입자가 들어와야 보증금을 준다며 연락을 피하고 있습니다."
                    className="w-full min-h-[120px] resize-none text-base p-4 border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                <button
                    onClick={handleAnalyze}
                    disabled={loading || !input}
                    className="w-full h-14 text-lg font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> 리스크 스캔 중...</>
                    ) : (
                        '위험도 무료 진단하기'
                    )}
                </button>
            </div>

            {result && typeof result.score === 'number' && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`text-center p-6 rounded-2xl border-2 ${getScoreColor(result.score)}`}>
                        <span className="text-sm font-bold opacity-80 uppercase tracking-widest">Risk Score</span>
                        <div className="text-7xl font-black tracking-tighter mt-1 mb-2">
                            {result.score}
                        </div>
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-sm text-sm font-bold border border-black/5">
                            {result.score >= 70 ? <Siren className="w-4 h-4 mr-2 animate-pulse text-red-500" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            진단 등급: {result.riskLevel}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2 text-slate-500" />
                                발견된 위험 요인
                            </h3>
                            <ul className="space-y-2">
                                {result.riskFactors?.map((factor: string, i: number) => (
                                    <li key={i} className="flex items-start text-sm text-slate-700">
                                        <span className="mr-2 text-red-500 font-bold">•</span>
                                        {factor}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-blue-600 p-5 rounded-xl shadow-lg shadow-blue-200">
                            <h3 className="font-bold text-blue-100 text-xs uppercase tracking-wide mb-1">Recommended Action</h3>
                            <p className="text-white font-bold text-lg leading-tight">{result.actionItem}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
