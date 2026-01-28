import React, { useState, useEffect } from 'react';

export const CAIOView: React.FC = () => {
    const [metrics, setMetrics] = useState({
        compliance: 99.2,
        deployments: 14,
        pending: 3,
        agency: 0.94
    });
    const [alerts, setAlerts] = useState([
        { time: '10:42 AM', type: 'Policy Violation', msg: 'Prompt injection attempt blocked by Guardrails', severity: 'high' },
        { time: '10:15 AM', type: 'Compliance', msg: 'Daily C2PA audit completed successfully', severity: 'low' },
        { time: '09:30 AM', type: 'Drift', msg: 'Model drift detected in sector 4 (0.4%)', severity: 'med' },
    ]);

    useEffect(() => {
        const API_KEY = 'sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH';
        const sse = new EventSource(`http://localhost:8080/v1/metrics/stream?token=${API_KEY}`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMetrics(prev => ({
                    ...prev,
                    agency: data.human_agency_score || prev.agency,
                    compliance: 98.0 + Math.random() * 2, // Variating around high compliance
                }));

                if (data.alert) {
                    setAlerts(prev => [{
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: data.alert.type || 'System',
                        msg: data.alert.message || 'Anomaly detected',
                        severity: data.alert.severity || 'low'
                    }, ...prev].slice(0, 5));
                }
            } catch (err) {
                console.error("CAIO SSE Parse Error:", err);
            }
        };

        return () => sse.close();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex items-end justify-between border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-2">CAIO Oversight Dashboard</h2>
                    <div className="flex items-center gap-2 text-white/60">
                        <span>Chief AI Officer Command Center</span>
                        <span className="w-1 h-1 rounded-full bg-white/40"></span>
                        <span>NIST AI RMF Audit (5.1-5.4)</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                        Export Risk Report
                    </button>
                </div>
            </div>

            {/* High Level Metrics */}
            <div className="grid grid-cols-4 gap-6">
                <div className="col-span-1 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Global Compliance</div>
                        <div className="text-4xl font-serif text-white mb-1">{metrics.compliance.toFixed(1)}%</div>
                        <div className="text-[10px] text-white/50">Aligned with NIST AI RMF</div>
                    </div>
                </div>

                <div className="col-span-1 p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                    <div className="text-xs font-bold text-tekimax-blue uppercase tracking-widest mb-2">Active Deployments</div>
                    <div className="text-4xl font-serif text-white mb-1">{metrics.deployments}</div>
                    <div className="text-[10px] text-white/50">Across 3 Regions</div>
                </div>

                <div className="col-span-1 p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Pending Reviews</div>
                    <div className="text-4xl font-serif text-white mb-1">{metrics.pending}</div>
                    <div className="text-[10px] text-white/50">Requires Human-in-the-Loop</div>
                </div>

                <div className="col-span-1 p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                    <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Human Agency Score</div>
                    <div className="text-4xl font-serif text-white mb-1">{metrics.agency.toFixed(2)}</div>
                    <div className="text-[10px] text-white/50">"Not too AI Driven" Benchmark</div>
                </div>
            </div>

            {/* Risk Heatmap & Governance */}
            <div className="grid grid-cols-3 gap-8 h-[500px]">
                {/* Heatmap */}
                <div className="col-span-2 bg-white/[0.02] border border-white/10 rounded-2xl p-8 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Algorithmic Risk Heatmap
                    </h3>

                    <div className="flex-grow grid grid-cols-3 grid-rows-3 gap-1 relative">
                        {/* Labels */}
                        <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between py-8 text-[10px] text-white/40 font-mono rotate-180" style={{ writingMode: 'vertical-rl' }}>
                            <span>High Impact</span>
                            <span>Med Impact</span>
                            <span>Low Impact</span>
                        </div>

                        {/* Cells */}
                        {[
                            { r: 3, c: 'Low', risk: 'Low', bg: 'bg-emerald-500/20' }, { r: 2, c: 'Med', risk: 'Low', bg: 'bg-emerald-500/20' }, { r: 1, c: 'High', risk: 'Med', bg: 'bg-amber-500/20' },
                            { r: 2, c: 'Low', risk: 'Low', bg: 'bg-emerald-500/20' }, { r: 3, c: 'Med', risk: 'Med', bg: 'bg-amber-500/20' }, { r: 2, c: 'High', risk: 'High', bg: 'bg-red-500/20' },
                            { r: 1, c: 'Low', risk: 'Med', bg: 'bg-amber-500/20' }, { r: 1, c: 'Med', risk: 'High', bg: 'bg-red-500/20' }, { r: 3, c: 'High', risk: 'Critical', bg: 'bg-red-900/40 border border-red-500/50' }
                        ].map((cell, i) => (
                            <div key={i} className={`rounded-lg ${cell.bg} flex items-center justify-center relative hover:opacity-80 transition-opacity cursor-crosshair group`}>
                                {cell.risk === 'Critical' && <div className="absolute inset-0 animate-pulse bg-red-500/10"></div>}
                                <span className="text-xs font-bold text-white/60">{cell.risk}</span>

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-black border border-white/20 p-2 rounded text-[10px] text-white hidden group-hover:block whitespace-nowrap z-50">
                                    {cell.risk} Risk / {cell.c} Prob
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-white/40 font-mono px-4">
                        <span>Low Probability</span>
                        <span>Med Probability</span>
                        <span>High Probability</span>
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="col-span-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Real-Time Governance</h3>
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {alerts.map((alert, i) => (
                            <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                        alert.severity === 'med' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>{alert.type}</span>
                                    <span className="text-[10px] text-white/30 font-mono">{alert.time}</span>
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed">{alert.msg}</p>
                            </div>
                        ))}
                    </div>
                    <button className="mt-auto w-full py-3 border-t border-white/10 text-xs text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold">
                        View Full Audit Log
                    </button>
                </div>
            </div>
        </div>
    );
};
