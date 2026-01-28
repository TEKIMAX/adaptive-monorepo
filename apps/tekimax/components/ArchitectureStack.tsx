"use client";
import React from "react";
import { motion } from "framer-motion";

interface ArchitectureLayer {
    id: string;
    label: string;
    sublabel: string;
    color: string;
    borderColor: string;
    items: string[];
}

const layers: ArchitectureLayer[] = [
    {
        id: "client",
        label: "CLIENT SIDE",
        sublabel: "Your Application",
        color: "#22D3EE",
        borderColor: "rgba(34, 211, 238, 0.4)",
        items: ["React", "Vue", "Next.js", "Mobile"],
    },
    {
        id: "api",
        label: "API LAYER",
        sublabel: "Developer Features",
        color: "#3B82F6",
        borderColor: "rgba(59, 130, 246, 0.4)",
        items: ["Modality Profiles", "Agency Scores", "Content Signing"],
    },
    {
        id: "engine",
        label: "CORE ENGINE",
        sublabel: "TEKIMAX Adaptive Engine",
        color: "#14B8A6",
        borderColor: "rgba(20, 184, 166, 0.4)",
        items: ["Orchestrator", "HITL", "Compliance", "Modality"],
    },
    {
        id: "llm",
        label: "FOUNDATION",
        sublabel: "Core Language Model",
        color: "#A855F7",
        borderColor: "rgba(168, 85, 247, 0.4)",
        items: ["NVIDIA NIM", "OpenAI", "Anthropic"],
    }
];

export function ArchitectureStack() {
    return (
        <div className="relative w-full">
            {/* Isometric container with perspective */}
            <div
                className="relative"
                style={{
                    perspective: "1200px",
                    perspectiveOrigin: "50% 40%"
                }}
            >
                <motion.div
                    className="relative flex flex-col gap-5"
                    style={{
                        transformStyle: "preserve-3d",
                        transform: "rotateX(10deg) rotateY(-5deg) rotateZ(1deg)"
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {layers.map((layer, index) => (
                        <motion.div
                            key={layer.id}
                            className="relative group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                delay: 0.1 + index * 0.12,
                                duration: 0.5,
                                ease: "easeOut"
                            }}
                            style={{
                                transformStyle: "preserve-3d",
                                transform: `translateZ(${(3 - index) * 15}px)`
                            }}
                        >
                            {/* Card */}
                            <div
                                className="relative rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02]"
                                style={{
                                    background: "linear-gradient(135deg, rgba(26, 31, 46, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)",
                                    border: `1px solid ${layer.borderColor}`,
                                    boxShadow: `0 4px 24px ${layer.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`
                                }}
                            >
                                {/* Gradient glow on hover */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(ellipse at 30% 0%, ${layer.color}15 0%, transparent 60%)`
                                    }}
                                />

                                <div className="relative z-10 p-5">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* Animated dot */}
                                            <motion.div
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: layer.color }}
                                                animate={{
                                                    opacity: [0.5, 1, 0.5],
                                                    scale: [0.9, 1.1, 0.9]
                                                }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Infinity,
                                                    delay: index * 0.4
                                                }}
                                            />
                                            {/* Label badge */}
                                            <span
                                                className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.15em]"
                                                style={{
                                                    backgroundColor: `${layer.color}15`,
                                                    color: layer.color,
                                                    border: `1px solid ${layer.color}30`
                                                }}
                                            >
                                                {layer.label}
                                            </span>
                                        </div>
                                        {/* Layer ID badge */}
                                        <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest">
                                            {layer.id}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-white font-semibold text-base mb-4 pl-6">
                                        {layer.sublabel}
                                    </h4>

                                    {/* Items row */}
                                    <div className="flex flex-wrap gap-2 pl-6">
                                        {layer.items.map((item, itemIndex) => (
                                            <motion.span
                                                key={item}
                                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
                                                style={{
                                                    backgroundColor: "rgba(0,0,0,0.4)",
                                                    color: "rgba(255,255,255,0.6)",
                                                    border: "1px solid rgba(255,255,255,0.08)"
                                                }}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{
                                                    delay: 0.3 + index * 0.1 + itemIndex * 0.05,
                                                    duration: 0.3
                                                }}
                                            >
                                                {item}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom accent line */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-px"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${layer.color}40, transparent)`
                                    }}
                                />
                            </div>

                            {/* Connection line to next layer */}
                            {index < layers.length - 1 && (
                                <div className="absolute left-1/2 -bottom-5 w-px h-5 -translate-x-1/2">
                                    <motion.div
                                        className="w-full h-full"
                                        style={{
                                            background: `linear-gradient(180deg, ${layer.color}40, ${layers[index + 1].color}40)`
                                        }}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ delay: 0.5 + index * 0.15, duration: 0.3 }}
                                    />
                                    {/* Arrow */}
                                    <motion.div
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                                        style={{
                                            borderLeft: "4px solid transparent",
                                            borderRight: "4px solid transparent",
                                            borderTop: `6px solid ${layers[index + 1].color}60`
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 + index * 0.15 }}
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Data flow indicator */}
            <motion.div
                className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 hidden lg:flex"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
            >
                <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest" style={{ writingMode: "vertical-rl" }}>
                    Data Flow
                </span>
                <svg width="12" height="40" viewBox="0 0 12 40" fill="none" className="mt-2">
                    <motion.path
                        d="M6 0 L6 34 M2 30 L6 38 L10 30"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                    />
                </svg>
            </motion.div>
        </div>
    );
}

export default ArchitectureStack;
