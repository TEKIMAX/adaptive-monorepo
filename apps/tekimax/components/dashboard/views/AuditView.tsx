import React, { useState, useEffect } from 'react';
import { TechCard } from '../shared/TechCard';
import { DateRangeSelector, DateRangeOption } from '../shared/DateRangeSelector';

export const AuditView: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRangeOption>('all');
    const [auditLogs, setAuditLogs] = useState([
        { id: 8833, type: 'Model Inference', actor: 'Orchestrator', status: 'Verified', time: 'Loading...' },
    ]);

    useEffect(() => {
        const API_KEY = 'sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH';
        const sse = new EventSource(`http://localhost:8080/v1/metrics/stream?token=${API_KEY}`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.organization_id) {
                    setAuditLogs(prev => [{
                        id: Math.floor(Math.random() * 10000),
                        type: Math.random() > 0.8 ? 'System Policy' : 'Model Inference',
                        actor: Math.random() > 0.8 ? 'Admin' : 'Orchestrator',
                        status: 'Verified',
                        time: new Date().toLocaleTimeString()
                    }, ...prev].slice(0, 8));
                }
            } catch (err) {
                console.error("Audit SSE Parse Error:", err);
            }
        };

        return () => sse.close();
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Compliance Logs</h2>
                    <p className="text-sm text-white/40">Immutable record of all AI decisions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangeSelector value={dateRange} onChange={setDateRange} />
                    <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-medium text-white hover:bg-white/10 transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Tech Card for Audit Endpoint */}
            <div className="mb-8">
                <TechCard content={{
                    endpoint: "/v1/activity-log",
                    method: "GET",
                    stats: [
                        { label: "Immutable Entries", value: "Live", color: "text-purple-400" },
                        { label: "Retention", value: "7 Yrs", color: "text-white" },
                        { label: "Verification", value: "C2PA", color: "text-emerald-400" }
                    ],
                    action: "Verify Chain Integrity"
                }} />
            </div>

            <div className="border border-white/5 rounded-md overflow-hidden bg-white/[0.01]">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Timestamp</th>
                            <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Event ID</th>
                            <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Type</th>
                            <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Actor</th>
                            <th className="px-4 py-2 text-white/40 font-mono text-[10px] uppercase font-normal">Status</th>
                            <th className="px-4 py-2 text-right text-white/40 font-mono text-[10px] uppercase font-normal">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {auditLogs.map((log, i) => (
                            <tr key={`${log.id}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-2.5 text-white/60 font-mono">{log.time}</td>
                                <td className="px-4 py-2.5 text-blue-400 font-mono">evt_{log.id}</td>
                                <td className="px-4 py-2.5 text-white">{log.type}</td>
                                <td className="px-4 py-2.5 text-white/60">{log.actor}</td>
                                <td className="px-4 py-2.5">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <button className="text-white/40 hover:text-white transition-colors text-[10px] font-medium uppercase tracking-wide">VIEW</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
