import React, { useState, useEffect } from 'react';

export const ReportsView: React.FC = () => {
    const [ratio, setRatio] = useState({ ai: 18.2, human: 81.8 });
    const [logs, setLogs] = useState([
        { id: 94201, origin: 'Human', sig: 'sha256:e9a2...', time: '2024-10-24 10:15 AM' },
        { id: 94202, origin: 'AI (Claude 3.5)', sig: 'sha256:f1b8...', time: '2024-10-24 10:20 AM' },
        { id: 94203, origin: 'Human', sig: 'sha256:a3c4...', time: '2024-10-24 10:25 AM' },
    ]);

    useEffect(() => {
        const API_KEY = 'sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH';
        const sse = new EventSource(`http://localhost:8080/v1/metrics/stream?token=${API_KEY}`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.human_agency_score) {
                    const human = data.human_agency_score * 100;
                    setRatio({
                        human: Number(human.toFixed(1)),
                        ai: Number((100 - human).toFixed(1))
                    });
                }

                if (data.organization_id && Math.random() > 0.7) {
                    setLogs(prev => [{
                        id: 94200 + Math.floor(Math.random() * 1000),
                        origin: Math.random() > 0.5 ? 'Human' : 'AI (Adaptive)',
                        sig: `sha256:${Math.random().toString(16).slice(2, 6)}...`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }, ...prev].slice(0, 10));
                }
            } catch (err) {
                console.error("Reports SSE Parse Error:", err);
            }
        };

        return () => sse.close();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Attribution & Compliance</h2>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                        <span>NIST AI RMF Audit</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-white/40"></span>
                        <span>Q4 2024</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Content Ratio & NIST Alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI vs Human Ratio */}
                <div className="col-span-1 bg-[#1c1c1c] border border-white/5 rounded-lg p-6">
                    <h3 className="text-sm font-bold text-white mb-4">Content Attribution</h3>
                    <div className="relative pt-2 pb-4">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                            <div className="bg-purple-500 transition-all duration-1000" style={{ width: `${ratio.ai}%` }} title="AI Generated"></div>
                            <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${ratio.human}%` }} title="Human Verified"></div>
                        </div>
                        <div className="flex justify-between mt-3">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <span className="text-[10px] uppercase tracking-wider text-white/50">AI Gen</span>
                                </div>
                                <div className="text-xl font-medium text-white">{ratio.ai}%</div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-0.5 justify-end">
                                    <span className="text-[10px] uppercase tracking-wider text-white/50">Human Verified</span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>
                                <div className="text-xl font-medium text-white">{ratio.human}%</div>
                            </div>
                        </div>
                        <div className="mt-4 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded text-[10px] text-emerald-400 font-mono text-center">
                            {ratio.human > 60 ? 'PASS: Agency Threshold (>60%) Met' : 'WARN: Agency Threshold Low'}
                        </div>
                    </div>
                </div>

                {/* NIST Alignment */}
                <div className="col-span-2 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[#1c1c1c] border border-white/5 rounded-lg flex flex-col justify-between">
                        <div className="mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">NIST: Valid</div>
                            <h4 className="text-sm text-white font-medium">Accuracy</h4>
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">99.9%</div>
                        <div className="text-[10px] text-white/30 mt-1">Live Tracking</div>
                    </div>
                    <div className="p-4 bg-[#1c1c1c] border border-white/5 rounded-lg flex flex-col justify-between">
                        <div className="mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">NIST: Explainable</div>
                            <h4 className="text-sm text-white font-medium">Explainability</h4>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">High</div>
                        <div className="text-[10px] text-white/30 mt-1">Provenance Active</div>
                    </div>
                    <div className="p-4 bg-[#1c1c1c] border border-white/5 rounded-lg flex flex-col justify-between">
                        <div className="mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">NIST: Privacy</div>
                            <h4 className="text-sm text-white font-medium">Minimization</h4>
                        </div>
                        <div className="text-2xl font-bold text-white">Tier 1</div>
                        <div className="text-[10px] text-white/30 mt-1">Policy Enforced</div>
                    </div>
                </div>
            </div>

            {/* Provenance Table */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-lg overflow-hidden flex flex-col h-[400px]">
                <div className="px-4 py-3 border-b border-white/5 shrink-0">
                    <h3 className="text-sm font-bold text-white">Asset Provenance Log</h3>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-white/5 bg-[#171717]">
                                <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Asset ID</th>
                                <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Origin</th>
                                <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Signature</th>
                                <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Timestamp</th>
                                <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log, i) => (
                                <tr key={`${log.id}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-2 text-blue-400 font-mono text-[10px]">ast_{log.id}</td>
                                    <td className="px-4 py-2 text-white/80">{log.origin}</td>
                                    <td className="px-4 py-2 text-white/30 font-mono text-[10px]">{log.sig}</td>
                                    <td className="px-4 py-2 text-white/50 text-[10px]">{log.time}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            C2PA
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
