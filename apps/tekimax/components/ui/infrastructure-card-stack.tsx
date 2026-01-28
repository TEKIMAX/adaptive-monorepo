"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export type InfrastructureCard = {
    id: number;
    title: string;
    quote: string;
    icon: React.ReactNode;
    color: string; // e.g., "blue", "yellow", "red"
    role: string;
    techLead: string;
    badgeText: string;
    explanation?: string;
    nistLink?: string;
};

// Map color names to Tailwind classes for borders, backgrounds, and text
const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
        blue: {
            bg: "bg-blue-500/10",
            text: "text-blue-500",
            border: "border-blue-500/20",
            gradient: "from-blue-500/20",
        },
        yellow: {
            bg: "bg-yellow-500/10",
            text: "text-yellow-500",
            border: "border-yellow-500/20",
            gradient: "from-yellow-500/20",
        },
        red: {
            bg: "bg-red-500/10",
            text: "text-red-500",
            border: "border-red-500/20",
            gradient: "from-red-500/20",
        },
        purple: {
            bg: "bg-purple-500/10",
            text: "text-purple-500",
            border: "border-purple-500/20",
            gradient: "from-purple-500/20",
        },
        green: {
            bg: "bg-green-500/10",
            text: "text-green-500",
            border: "border-green-500/20",
            gradient: "from-green-500/20",
        },
        pink: {
            bg: "bg-pink-500/10",
            text: "text-pink-500",
            border: "border-pink-500/20",
            gradient: "from-pink-500/20",
        },
    };
    return map[color] || map.blue;
};

export const InfrastructureCardStack = ({
    items,
    offset,
    scaleFactor,
    darkButton = false,
}: {
    items: InfrastructureCard[];
    offset?: number;
    scaleFactor?: number;
    darkButton?: boolean;
}) => {
    const CARD_OFFSET = offset || 10;
    const SCALE_FACTOR = scaleFactor || 0.06;
    const [cards, setCards] = useState<InfrastructureCard[]>(items);

    const moveNext = () => {
        setCards((prevCards) => {
            const newArray = [...prevCards];
            const bottomCard = newArray.pop();
            if (bottomCard) {
                newArray.unshift(bottomCard);
            }
            return newArray;
        });
    };

    const goToIndex = (targetId: number) => {
        setCards((prevCards) => {
            const index = prevCards.findIndex(c => c.id === targetId);
            if (index === -1) return prevCards;
            const rest = prevCards.slice(index);
            const beginning = prevCards.slice(0, index);
            return [...rest, ...beginning];
        });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative h-[28rem] w-full md:w-[32rem]">
                {cards.map((card, index) => {
                    const colors = getColorClasses(card.color);

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute top-0 left-0 right-0 mx-auto rounded-sm bg-[#0B0F19] border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col justify-between h-[28rem] w-[22rem] md:w-full max-w-[95vw]"
                            style={{
                                transformOrigin: "top center",
                            }}
                            animate={{
                                top: index * -CARD_OFFSET,
                                scale: 1 - index * SCALE_FACTOR,
                                zIndex: cards.length - index,
                            }}
                            transition={{
                                duration: 0.4,
                                ease: "easeInOut"
                            }}
                        >
                            {/* Terminal Window Header */}
                            <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                <div className="ml-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">bash - 80x24</div>
                            </div>

                            {/* Internal Card Content matching the 'premium' aesthetic */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-transparent opacity-10 pointer-events-none`}></div>

                            <div className="relative z-10 h-full flex flex-col p-3 md:p-6 font-mono">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center border ${colors.border}`}>
                                            {card.icon}
                                        </div>
                                        <div>
                                            <div className="text-white text-[10px] md:text-xs">{card.badgeText}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md ${colors.bg} border ${colors.border}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                                            {card.role}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-white/30 text-xs">$ ./execute_module </span>
                                        <span className={`text-sm font-bold text-white`}>{card.title}</span>
                                    </div>

                                    <div className="pl-4 border-l border-white/10 ml-1">
                                        <p className="text-white/60 text-xs leading-relaxed">
                                            <span className="text-green-500/50 mr-2">{">"}</span>
                                            "{card.quote}"
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-dashed border-white/10 flex flex-col gap-2">

                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[12px]">
                                            <span className="text-white/30 uppercase text-[9px] md:text-[10px]">Endpoint</span>
                                            <code className={`bg-black/30 px-2 py-1 rounded ${colors.text} text-[10px] md:text-[11px]`}>{card.techLead}</code>
                                        </div>
                                        {card.explanation && (
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[11px] text-white/50 italic text-right max-w-[90%] self-end leading-tight">
                                                    // {card.explanation}
                                                </span>
                                                {card.nistLink && (
                                                    <a
                                                        href={card.nistLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-1 flex items-center gap-2 px-3 py-2 rounded-full bg-white text-black text-[9px] font-bold uppercase tracking-wider hover:bg-white/90 transition-colors self-end group/link shadow-lg"
                                                    >
                                                        <span>Reference</span>
                                                        <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <div className="animate-pulse w-2 h-4 bg-white/50"></div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Pagination Dots */}
            <div className="mt-8 flex gap-2">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => goToIndex(item.id)}
                        className={`w-2 h-2 rounded-full transition-all ${cards[0].id === item.id
                            ? "bg-tekimax-blue w-6"
                            : "bg-white/20 hover:bg-white/40"
                            }`}
                        aria-label={`Go to step ${item.id}`}
                    />
                ))}
            </div>
            <div className="mt-8 flex items-center gap-4">
                {/* Back Button */}
                <button
                    onClick={() => {
                        setCards((prevCards) => {
                            const lastCard = prevCards[prevCards.length - 1];
                            const rest = prevCards.slice(0, -1);
                            return [lastCard, ...rest];
                        });
                    }}
                    className={`group flex items-center justify-center w-12 h-12 rounded-sm transition-all active:scale-95 ${darkButton
                        ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                    aria-label="Previous Module"
                >
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center group-hover:-translate-x-1 transition-transform ${darkButton ? "bg-white/20" : "bg-white/10"}`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </button>

                {/* Next Button */}
                <button
                    onClick={moveNext}
                    className={`group flex items-center justify-center w-12 h-12 rounded-sm transition-all active:scale-95 ${darkButton
                        ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        }`}
                    aria-label="Next Module"
                >
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center group-hover:translate-x-1 transition-transform ${darkButton ? "bg-white/20" : "bg-white/10"}`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            </div>
        </div >
    );
};
