"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
    id: number;
    text: string;
    sender: "user" | "ai";
    isTyping?: boolean;
};

export default function ChatDemo() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "안녕하세요! 어떤 법률 고민이 있으신가요?",
            sender: "ai",
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleUserClick = () => {
        if (hasInteracted) return;

        setHasInteracted(true);
        const userMsg: Message = {
            id: 2,
            text: "전세금을 못 받고 있어... 도와줘!",
            sender: "user",
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            const aiMsg: Message = {
                id: 3,
                text: "걱정하지 마세요. 임차권 등기 명령 신청부터 보증금 반환 소송까지 절차를 알려드릴게요. 우선 계약서 사진을 찍어주실 수 있나요?",
                sender: "ai",
            };
            setMessages((prev) => [...prev, aiMsg]);
        }, 1500);
    };

    return (
        <section className="px-5 py-12 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-8 text-center">
                    AI 법률 비서와 <br className="md:hidden" />
                    <span className="text-blue-500"> 24시간 상담</span>해보세요
                </h2>

                <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Chat Screen */}
                    <div
                        ref={scrollRef}
                        className="h-80 bg-slate-50 p-4 overflow-y-auto scroll-smooth no-scrollbar flex flex-col gap-3"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[85%] px-5 py-3 text-sm md:text-base rounded-2xl shadow-sm ${msg.sender === "user"
                                            ? "bg-blue-500 text-white rounded-br-none"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white px-4 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area (Fake) */}
                    {!hasInteracted ? (
                        <div className="p-4 bg-white border-t border-slate-100">
                            <button
                                onClick={handleUserClick}
                                className="w-full bg-navy-900/5 hover:bg-navy-900/10 text-navy-900 py-3.5 px-5 rounded-xl text-sm md:text-base font-medium transition-colors flex items-center justify-between group"
                            >
                                <span>전세금을 못 받고 있어...</span>
                                <div className="w-7 h-7 bg-navy-900 text-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="w-full h-12 bg-slate-100 rounded-xl flex items-center px-4 text-slate-400 text-sm md:text-base">
                                메시지를 입력하세요...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
