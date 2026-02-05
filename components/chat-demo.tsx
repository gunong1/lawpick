"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Bot, User, Send } from "lucide-react";
import clsx from "clsx";

export default function ChatDemo() {
    const chatHelpers = useChat({
        // initialMessages: [
        //     {
        //         id: 'welcome',
        //         role: 'assistant',
        //         content: '안녕하세요! 로픽(LawPick) AI 변호사입니다. \n전세 사기, 교통사고 등 걱정되는 법률 문제가 있으신가요?',
        //     }
        // ]
    }) as any;

    const { messages, input = "", handleInputChange, handleSubmit, isLoading, append } = chatHelpers;

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom using scrollTop to prevent window jumping
    useEffect(() => {
        if (messages.length > 1 && scrollRef.current) {
            const { scrollHeight, clientHeight } = scrollRef.current;
            scrollRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    return (
        <section className="bg-slate-50 py-10">
            <div className="px-6 max-w-md mx-auto w-full">
                <h3 className="text-xl font-bold text-navy-900 mb-6 text-center">
                    AI 변호사에게 물어보세요
                </h3>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col h-[500px]">
                    {/* Chat Window */}
                    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 no-scrollbar">
                        {messages.length === 0 && (
                            <div className="space-y-4">
                                {/* Welcome Message */}
                                <div className="flex items-start gap-3 mr-auto max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none text-slate-700 border border-slate-100 text-sm leading-relaxed shadow-sm">
                                        안녕하세요! 로픽 AI 변호사 제미나입니다.<br />
                                        무엇을 도와드릴까요?
                                    </div>
                                </div>

                                {/* Suggestion Chips */}
                                <div className="pl-11 grid grid-cols-1 gap-2">
                                    {[
                                        "🏠 전세 보증금 반환",
                                        "🚗 교통사고 과실 비율",
                                        "💰 중고거래 사기 신고",
                                        "📝 차용증 작성법"
                                    ].map((text) => (
                                        <button
                                            key={text}
                                            type="button"
                                            onClick={() => void append({ role: "user", content: text })}
                                            className="text-left px-4 py-3 bg-white hover:bg-blue-50 cursor-pointer border border-slate-200 rounded-xl text-sm text-slate-700 transition-colors shadow-sm hover:shadow-md"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={clsx(
                                    "flex items-start gap-3 max-w-[85%]",
                                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div
                                    className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                        m.role === "user" ? "bg-navy-900" : "bg-blue-500"
                                    )}
                                >
                                    {m.role === "user" ? (
                                        <User className="w-5 h-5 text-white" />
                                    ) : (
                                        <Bot className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div
                                    className={clsx(
                                        "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        m.role === "user"
                                            ? "bg-navy-900 text-white rounded-tr-none"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                    )}
                                    style={{ whiteSpace: "pre-wrap" }}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 mr-auto">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSubmit}
                        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
                    >
                        <input
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                            value={input}
                            placeholder="예: 전세보증금을 돌려받지 못하고 있어요..."
                            onChange={handleInputChange}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md disabled:bg-slate-300 disabled:shadow-none transition-all hover:bg-blue-700"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
