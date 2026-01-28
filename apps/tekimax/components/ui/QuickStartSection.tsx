"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeExampleStack, sdkCodeExamples } from './code-example-stack';
import { BetaRequestDialog } from './BetaRequestDialog';

export const QuickStartSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'how-it-works' | 'example-code'>('example-code');
    const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);

    const steps = [
        {
            number: 1,
            title: "Modality-Adaptive Learning",
            description: "The engine identifies user cognitive styles - visual, auditory, or textual - to optimize content delivery autonomously.",
            subtext: "Self-Adaptive Engine",
            highlight: false
        },
        {
            number: 2,
            title: "Human Agency Guardrails",
            description: "Our orchestrator ensures AI outputs augment human decision-making, preserving agency and creative control.",
            subtext: "NIST AI RMF ALIGNED",
            highlight: false
        },
        {
            number: 3,
            title: "Cryptographic Provenance",
            description: "Every asset is signed using cryptographic standards, providing verifiable proof of human vs. AI authorship.",
            subtext: "VERIFIABLE ATTRIBUTION",
            highlight: true
        },
        {
            number: 4,
            title: "Intelligent Orchestration",
            description: "The system autonomously selects the optimal combination of tools and models based on user intent and cognitive modality preferences.",
            subtext: "DYNAMIC RESOURCE ROUTING",
            highlight: false
        }
    ];

    return (
        <section id="developers" className="pt-48 pb-32 px-6 bg-[#121212] relative overflow-hidden scroll-mt-20 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px]">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#357ACA]/10 border border-[#357ACA]/30 mb-6 transition-all hover:bg-[#357ACA]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#357ACA] animate-pulse"></span>
                        <span className="text-[#357ACA] text-[10px] font-bold uppercase tracking-wider">Private Beta Access Only</span>
                    </div>

                    <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4 leading-tight flex flex-col md:flex-row items-center justify-center gap-4">
                        <div>
                            Quick <span className="text-tekimax-blue">Start</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#3178C6]/10 border border-[#3178C6]/30 group transition-all hover:bg-[#3178C6]/20">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1V23H23V1H1Z" fill="#3178C6" />
                                    <path d="M17.438 18.156C17.438 19.344 16.719 20.25 15.281 20.25C14.031 20.25 13.094 19.531 12.656 18.75L13.875 17.969C14.156 18.5 14.656 19 15.281 19C15.844 19 16.188 18.719 16.188 18.313C16.188 17.906 15.938 17.719 15.094 17.344C13.844 16.781 12.75 16.125 12.75 14.719C12.75 13.563 13.594 12.5 15.188 12.5C16.344 12.5 17.156 13.125 17.594 14.125L16.438 14.813C16.156 14.281 15.75 13.781 15.125 13.781C14.656 13.781 14.031 14.031 14.031 14.656C14.031 15.031 14.344 15.25 15.156 15.625C16.469 16.219 17.438 16.781 17.438 18.156ZM11.656 20.125H10.375V13.688H7.719V12.625H14.344V13.688H11.656V20.125Z" fill="white" />
                                </svg>
                                <span className="text-[#3178C6] text-[10px] font-bold uppercase tracking-tight">TypeScript</span>
                            </div>

                        </div>
                    </h2>
                    <p className="text-white/40 text-sm max-w-lg mx-auto mb-8">
                        Deploy responsible AI infrastructure that prioritizes human agency over mere data compliance.
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setIsBetaModalOpen(true)}
                            className="px-6 py-2.5 bg-[#357ACA] hover:bg-[#357ACA]/90 text-white rounded-sm text-sm font-bold shadow-lg shadow-[#357ACA]/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            Request Beta Access
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                        <a
                            href="https://github.com/tekimax/tekimax-sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-sm text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            GitHub
                        </a>
                    </div>
                </div>

                {/* Tab Switcher - Dashboard-inspired Underline Style */}
                <div className="flex justify-center mb-16">
                    <div className="flex border-b border-white/5 w-full max-w-2xl justify-center relative">
                        <button
                            onClick={() => setActiveTab('example-code')}
                            className={`px-8 py-4 text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${activeTab === 'example-code'
                                ? 'text-[#357ACA]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <span>Example Code</span>
                            {activeTab === 'example-code' && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#357ACA] shadow-[0_0_15px_rgba(53,122,202,0.5)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('how-it-works')}
                            className={`px-8 py-4 text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${activeTab === 'how-it-works'
                                ? 'text-[#357ACA]'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <span>How it works</span>
                            {activeTab === 'how-it-works' && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#357ACA] shadow-[0_0_15px_rgba(53,122,202,0.5)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[520px] relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'example-code' ? (
                            <motion.div
                                key="example-code"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full flex flex-col items-center pt-4"
                            >
                                <div className="w-full max-w-4xl">
                                    <CodeExampleStack items={sdkCodeExamples} scaleFactor={0.05} offset={15} />
                                </div>

                                {/* Installation prompt */}
                                <div className="mt-16 hidden lg:flex justify-center">
                                    <div className="bg-[#0b0f19] rounded-sm border border-white/10 px-8 py-4 font-mono text-base inline-flex items-center gap-4 shadow-2xl hover:border-[#357ACA]/40 transition-all cursor-pointer group">
                                        <span className="text-tekimax-teal select-none font-bold">$</span>
                                        <span className="text-white group-hover:text-[#357ACA] transition-colors">npm install</span>
                                        <span className="text-[#357ACA] font-bold">tekimax-sdk</span>

                                        <div className="w-px h-6 bg-white/10 mx-2"></div>

                                        <svg className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="how-it-works"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full max-w-6xl mx-auto"
                            >
                                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                                    {steps.map((step) => (
                                        <div
                                            key={step.number}
                                            className={`flex gap-5 p-6 rounded-lg border transition-all duration-300 group ${step.highlight
                                                ? 'bg-[#357ACA]/10 border-[#357ACA]/30 shadow-[0_0_35px_rgba(53,122,202,0.15)] ring-1 ring-[#357ACA]/20'
                                                : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${step.highlight
                                                ? 'bg-[#357ACA] text-white shadow-lg shadow-[#357ACA]/40'
                                                : 'bg-white/5 text-white/40 border border-white/10 group-hover:border-[#357ACA]/30 group-hover:text-[#357ACA]'
                                                }`}>
                                                {step.number}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="text-white font-bold mb-1.5 text-lg group-hover:text-[#357ACA] transition-colors">{step.title}</h4>
                                                <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">{step.description}</p>
                                                {step.subtext && (
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <div className={`w-1 h-1 rounded-full ${step.highlight ? 'bg-[#357ACA]' : 'bg-white/20'}`}></div>
                                                        <p className={`${step.highlight ? 'text-[#357ACA]' : 'text-white/20'} text-[10px] uppercase tracking-[0.15em] font-black`}>{step.subtext}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <BetaRequestDialog
                    isOpen={isBetaModalOpen}
                    onClose={() => setIsBetaModalOpen(false)}
                />
            </div>
            {/* Background elements */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-tekimax-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tekimax-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
        </section>
    );
};
