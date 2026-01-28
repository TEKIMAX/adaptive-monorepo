import React from 'react';
import { motion } from 'framer-motion';

// Feature Visual Components - Reusable illustrations for architecture features

interface FeatureVisualProps {
    type: 'adaptive_engine' | 'compliance_matrix' | 'orchestrator' | 'human_agency' | 'manage_dashboard' | 'api_config' | 'responsible_ai';
}

export const AdaptiveEngineVisual: React.FC = () => (
    <div className="w-full h-80 relative flex items-center justify-center bg-black/40 rounded-sm border border-white/5 overflow-hidden group/viz">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)]" />

        <div className="relative flex items-center gap-16">
            {/* Central Neural Hub */}
            <div className="relative">
                <div className="w-32 h-32 rounded-full border border-tekimax-blue/30 bg-tekimax-blue/5 flex items-center justify-center relative">
                    <div className="w-20 h-20 rounded-full border-2 border-tekimax-blue/40 flex items-center justify-center bg-tekimax-blue/5 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
                        <svg className="w-10 h-10 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[8px] font-bold text-tekimax-blue uppercase tracking-widest whitespace-nowrap shadow-lg backdrop-blur-sm">Neural Hub</div>
            </div>

            {/* Modality Stream System */}
            <div className="flex flex-col gap-6">
                {[
                    {
                        name: 'Visual',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
                        indicator: <div className="flex gap-1 items-end h-3">
                            {[40, 70, 50, 90].map((h, i) => (
                                <div key={i} className="w-1 bg-tekimax-blue/40 rounded-t" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    },
                    {
                        name: 'Auditory',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />,
                        indicator: <div className="flex gap-0.5 items-center w-8">
                            <div className="w-5 h-5 rounded-full border border-purple-500/40 border-t-purple-500 animate-spin" />
                        </div>
                    },
                    {
                        name: 'Textual',
                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />,
                        indicator: <div className="flex flex-col gap-0.5 w-6">
                            <div className="h-0.5 w-full bg-emerald-500/40" />
                            <div className="h-0.5 w-2/3 bg-emerald-500/40" />
                        </div>
                    }
                ].map((m) => (
                    <div key={m.name} className="flex items-center gap-4 group/mod">
                        <div className="w-10 h-10 rounded-xl border border-white/5 bg-white/[0.03] flex items-center justify-center group-hover/mod:border-tekimax-blue/30 transition-colors">
                            <svg className="w-5 h-5 text-white/30 group-hover/mod:text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {m.icon}
                            </svg>
                        </div>
                        <div className="flex flex-col gap-1.5 min-w-[3rem]">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 group-hover/mod:text-white/60">{m.name}</span>
                            {m.indicator}
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-white/5 text-[7px] font-mono text-white/10 group-hover/mod:text-emerald-500 transition-colors">ACTIVE</div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const ComplianceMatrixVisual: React.FC = () => (
    <div className="w-full h-80 relative flex items-center justify-center bg-black/40 rounded-sm border border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative flex gap-12 items-center">
            {/* Matrix Column 1: Frameworks */}
            <div className="flex flex-col gap-3">
                {['NIST AI RMF', 'Signed Origin', 'GDPR AI'].map((f) => (
                    <div key={f} className="px-4 py-2 rounded-lg border border-white/10 bg-[#0b0f1a] shadow-xl flex items-center gap-3 w-44 group/f hover:border-emerald-500/30 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-emerald-500/40 group-hover/f:bg-emerald-500" />
                        <span className="text-[9px] font-mono text-white/40 group-hover/f:text-white/80">{f}</span>
                    </div>
                ))}
            </div>

            {/* Alignment Visual: The "Matrix" Bridge */}
            <div className="relative flex flex-col gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                        {[1, 2, 3, 4].map((j) => (
                            <div
                                key={j}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-700 ${(i + j) % 3 === 0
                                    ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                    : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                {(i + j) % 3 === 0 && (
                                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
                {/* Scanning Line Animation */}
                <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none"
                />
            </div>

            {/* Matrix Column 2: Verifiers */}
            <div className="flex flex-col gap-6">
                <div className="p-4 rounded-xl border border-tekimax-blue/30 bg-tekimax-blue/5 backdrop-blur-md flex flex-col gap-3 w-48 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-tekimax-blue tracking-widest uppercase">Audit Active</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[92%]" />
                        </div>
                        <div className="flex justify-between text-[7px] font-mono text-white/20">
                            <span>INTEGRITY</span>
                            <span className="text-emerald-500">92%</span>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-[9px] font-mono text-white/20 text-center">
                    v1.2.4 - SIGNED_ORIGIN
                </div>
            </div>
        </div>
    </div>
);

export const OrchestratorVisual: React.FC = () => (
    <div className="w-full h-80 relative flex items-center justify-center bg-black/40 rounded-sm border border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05),transparent)]" />

        <div className="relative flex items-center gap-12">
            {/* Profile Input */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border border-tekimax-blue/30 bg-tekimax-blue/10 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                    <svg className="w-8 h-8 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-tekimax-blue">User Profile</span>
            </div>

            {/* Orchestration logic */}
            <div className="w-32 h-32 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-tekimax-blue/20 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tekimax-blue to-purple-500 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 001.414 1.96l2.387.477a2 2 0 001.96-1.414l.477-2.387a2 2 0 00-1.414-1.96l-2.387-.477z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Selection Pools */}
            <div className="flex flex-col gap-4">
                <div className="px-6 py-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Selected Functions</span>
                    <div className="flex gap-2">
                        {['Search', 'Analysis', 'Code'].map(f => (
                            <div key={f} className="px-2 py-1 rounded bg-tekimax-blue/10 border border-tekimax-blue/20 text-[8px] font-mono text-tekimax-blue">
                                {f}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-6 py-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">Optimal Models</span>
                    <div className="flex gap-2">
                        {['GPT-4o', 'Claude 3.5'].map(m => (
                            <div key={m} className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[8px] font-mono text-purple-400">
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const HumanAgencyVisual: React.FC = () => (
    <div className="w-full h-80 relative flex items-center justify-center bg-black/40 rounded-sm border border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent)]" />

        <div className="relative flex items-center gap-16">
            {/* Human Authority Node */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-tekimax-blue/50 bg-tekimax-blue/10 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)] relative">
                    <svg className="w-10 h-10 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0b0f1a] flex items-center justify-center text-[10px] text-white">✓</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-tekimax-blue">Human Authority</span>
            </div>

            {/* Connection Flow */}
            <div className="flex flex-col gap-8 py-4">
                <div className="w-24 h-px bg-gradient-to-r from-tekimax-blue/50 to-purple-500/50 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                </div>
                <div className="w-24 h-px bg-gradient-to-r from-tekimax-blue/50 to-purple-500/50 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                </div>
            </div>

            {/* AI Associate Nodes */}
            <div className="flex flex-col gap-6">
                {['Automated Workflow', 'Synthesis Engine'].map((node, i) => (
                    <div key={i} className="px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] flex items-center gap-3 group/node hover:border-tekimax-blue/30 hover:bg-white/[0.05] transition-all">
                        <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center group-hover/node:bg-tekimax-blue/20 transition-colors">
                            <svg className="w-3 h-3 text-purple-400 group-hover/node:text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-mono text-white/40 group-hover/node:text-white/60">{node}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/** Generic wrapper that renders the correct visual based on type */
export const FeatureVisual: React.FC<FeatureVisualProps> = ({ type }) => {
    switch (type) {
        case 'adaptive_engine':
        case 'api_config':
            return <AdaptiveEngineVisual />;
        case 'compliance_matrix':
        case 'responsible_ai':
            return <ComplianceMatrixVisual />;
        case 'orchestrator':
        case 'manage_dashboard':
            return <OrchestratorVisual />;
        case 'human_agency':
            return <HumanAgencyVisual />;
        default:
            return null;
    }
};
