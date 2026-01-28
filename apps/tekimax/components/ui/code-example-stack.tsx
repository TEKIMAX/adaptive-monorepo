"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

export type CodeExampleCard = {
    id: number;
    step: number;
    title: string;
    filename: string;
    color: string; // e.g., "blue", "teal", "cyan", "pink"
    badge: string;
    code: React.ReactNode;
    description: string;
};

const TypewriterText = ({ text, delay = 50 }: { text: string; delay?: number }) => {
    const [displayedText, setDisplayedText] = React.useState("");
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [currentIndex, delay, text]);

    return <span>{displayedText}</span>;
};

// Map color names to Tailwind classes
const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
        blue: {
            bg: "bg-blue-500/10",
            text: "text-blue-500",
            border: "border-blue-500/20",
            gradient: "from-blue-500/20",
        },
        teal: {
            bg: "bg-teal-500/10",
            text: "text-teal-500",
            border: "border-teal-500/20",
            gradient: "from-teal-500/20",
        },
        cyan: {
            bg: "bg-cyan-500/10",
            text: "text-cyan-500",
            border: "border-cyan-500/20",
            gradient: "from-cyan-500/20",
        },
        pink: {
            bg: "bg-pink-500/10",
            text: "text-pink-500",
            border: "border-pink-500/20",
            gradient: "from-pink-500/20",
        },
        orange: {
            bg: "bg-orange-500/10",
            text: "text-orange-500",
            border: "border-orange-500/20",
            gradient: "from-orange-500/20",
        },
        gold: {
            bg: "bg-yellow-500/10",
            text: "text-yellow-500",
            border: "border-yellow-500/20",
            gradient: "from-yellow-500/20",
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
    };
    return map[color] || map.blue;
};

export const CodeExampleStack = ({
    items,
    offset,
    scaleFactor,
}: {
    items: CodeExampleCard[];
    offset?: number;
    scaleFactor?: number;
}) => {
    const CARD_OFFSET = offset || 10;
    const SCALE_FACTOR = scaleFactor || 0.06;
    const [cards, setCards] = useState<CodeExampleCard[]>(items);

    const moveNext = () => {
        setCards((prevCards) => {
            const [topCard, ...rest] = prevCards;
            return [...rest, topCard];
        });
    };

    const movePrev = () => {
        setCards((prevCards) => {
            const lastCard = prevCards[prevCards.length - 1];
            const rest = prevCards.slice(0, -1);
            return [lastCard, ...rest];
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
            <div className="relative h-[24rem] w-full md:w-[42rem]">
                {cards.map((card, index) => {
                    const colors = getColorClasses(card.color);

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute top-0 left-0 right-0 mx-auto rounded-sm bg-[#0B0F19] border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[24rem] w-[90vw] md:w-full max-w-[42rem]"
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
                                <div className="ml-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">{card.filename}</div>
                            </div>

                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} to-transparent opacity-10 pointer-events-none`}></div>

                            {/* Card Content */}
                            <div className="relative z-10 flex-1 flex flex-col p-4 md:p-5 font-mono">
                                {/* Header Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center border ${colors.border}`}>
                                            <span className={`${colors.text} text-sm font-bold`}>{card.step}</span>
                                        </div>
                                        <div>
                                            <div className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-widest">Step {card.step}</div>
                                            <div className="text-white text-xs md:text-sm font-bold">{card.title}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md ${colors.bg} border ${colors.border}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>
                                            {card.badge}
                                        </span>
                                    </div>
                                </div>

                                {/* Code Block */}
                                <div className="flex-1 bg-black/30 rounded-lg p-4 border border-white/5 overflow-auto">
                                    <div className="pl-3 border-l-2 border-white/10">
                                        {card.code}
                                    </div>
                                </div>

                                {/* Cursor & Typing Simulation */}
                                <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs">
                                    <div className="flex-1 text-white/40 italic">
                                        {index === 0 ? <TypewriterText text={card.description} /> : card.description}
                                    </div>
                                    <div className="animate-pulse w-1.5 h-3.5 bg-tekimax-blue/50"></div>
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
                        aria-label={`Go to step ${item.step}`}
                    />
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center gap-4">
                {/* Back Button */}
                <button
                    onClick={movePrev}
                    className="group flex items-center justify-center w-12 h-12 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                    aria-label="Previous Step"
                >
                    <div className="w-6 h-6 rounded-sm bg-white/10 flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </button>

                {/* Next Button */}
                <button
                    onClick={moveNext}
                    className="group flex items-center justify-center w-12 h-12 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                    aria-label="Next Step"
                >
                    <div className="w-6 h-6 rounded-sm bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
};


export default CodeExampleStack;
