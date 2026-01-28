import React, { useState } from 'react';
import { DateRangeSelector, DateRangeOption } from '../shared/DateRangeSelector';

export const ModalityErrorLog: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRangeOption>('all');

    // Mock data - in a real app this would be filtered by dateRange
    const allErrors = [
        { id: 'ERR-9921', user: 'User_882', pred: 'Visual', pref: 'Text', conf: '92%', time: '10:42:01' },
        { id: 'ERR-9922', user: 'User_441', pred: 'Audio', pref: 'Visual', conf: '88%', time: '10:15:22' },
        { id: 'ERR-9923', user: 'User_119', pred: 'Visual', pref: 'Interactive', conf: '76%', time: '09:30:11' },
        { id: 'ERR-9924', user: 'User_663', pred: 'Text', pref: 'Audio', conf: '95%', time: '08:12:44' },
        { id: 'ERR-9925', user: 'User_228', pred: 'Visual', pref: 'Text', conf: '64%', time: '07:55:09' },
    ];

    // Simple mock filter for demonstration
    const displayErrors = dateRange === '24h' ? allErrors.slice(0, 3) :
        dateRange === '7d' ? allErrors.slice(0, 4) :
            allErrors;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Modality Mismatch Log (Failed Calls)
                </h4>
                <div className="flex items-center gap-2">
                    <DateRangeSelector value={dateRange} onChange={setDateRange} />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {displayErrors.map((err, i) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 hover:bg-red-500/10 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-white/30">{err.id}</span>
                            <span className="text-[10px] font-mono text-white/30">{err.time}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-white/60">System:</span>
                                <span className="text-white/40 line-through decoration-red-500/50">{err.pred}</span>
                            </div>
                            <div className="text-red-400">→</div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/60">User Pref:</span>
                                <span className="text-emerald-400 font-bold">{err.pref}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-[10px] text-white/20 group-hover:text-white/40 transition-colors">
                            Sys Confidence: {err.conf} (False Positive)
                        </div>
                    </div>
                ))}
                {displayErrors.length === 0 && (
                    <div className="text-center py-8 text-white/30 text-xs">
                        No errors found in this range.
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-white/40">Total Mismatches: {142 - (allErrors.length - displayErrors.length)}</span>
                <button className="text-[10px] text-tekimax-blue hover:text-white uppercase tracking-widest font-bold transition-colors">Download Logs</button>
            </div>
        </div>
    );
};
