import React from 'react';

interface WelcomeViewProps {
    onSelectRole: (role: 'ciao' | 'developer') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectRole }) => {
    return (
        <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-700 bg-[#121212]">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

                {/* Developer / Builder Card */}
                <div
                    onClick={() => onSelectRole('developer')}
                    className="group relative h-[400px] bg-[#1c1c1c] border border-white/5 rounded-xl p-6 cursor-pointer hover:border-white/20 transition-all duration-300 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="relative z-10 mb-6 flex justify-between items-start">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </div>
                        <div className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-white/40 bg-white/5 group-hover:text-blue-400 transition-colors">
                            Build & Integrate
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-blue-400 transition-colors">Developer</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">
                            Access the Orchestration Studio, API Integration Hub, and Stream Learning tools.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span>Orchestrator Studio</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span>API Keys & Webhooks</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span>Real-time Debugging</span>
                            </div>
                        </div>
                    </div>

                    {/* Button Mockup at bottom */}
                    <div className="mt-auto relative z-10 pt-6">
                        <div className="w-full py-3 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center gap-2 text-white/40 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all font-bold tracking-wide text-xs">
                            ENTER WORKSPACE <span className="text-sm">→</span>
                        </div>
                    </div>
                </div>

                {/* CIAO / Governance Card */}
                <div
                    onClick={() => onSelectRole('ciao')}
                    className="group relative h-[400px] bg-[#1c1c1c] border border-white/5 rounded-xl p-6 cursor-pointer hover:border-white/20 transition-all duration-300 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="relative z-10 mb-6 flex justify-between items-start">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-white/40 bg-white/5 group-hover:text-emerald-400 transition-colors">
                            Govern & Oversee
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-emerald-400 transition-colors">Chief AI Officer</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-6">
                            Monitor compliance scores, review audit logs, and verify C2PA provenance.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                <span>Risk Heatmap</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                <span>Attribution (NIST)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/60">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                <span>Audit Log Explorer</span>
                            </div>
                        </div>
                    </div>

                    {/* Button Mockup at bottom */}
                    <div className="mt-auto relative z-10 pt-6">
                        <div className="w-full py-3 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center gap-2 text-white/40 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all font-bold tracking-wide text-xs">
                            ENTER COMMAND CENTER <span className="text-sm">→</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
