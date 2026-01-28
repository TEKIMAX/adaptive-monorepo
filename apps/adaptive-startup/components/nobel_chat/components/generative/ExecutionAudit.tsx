import React from 'react';
import { AlertTriangle, ClipboardList, ShieldAlert } from 'lucide-react';

interface ExecutionAuditProps {
    status: string;
    missingDataPoints: {
        category: string;
        details: string;
    }[];
    executiveSummary?: string;
}

const ExecutionAudit: React.FC<ExecutionAuditProps> = ({ status, missingDataPoints, executiveSummary }) => {
    return (
        <div className="w-full my-6 bg-stone-50 border border-red-200 rounded-xl overflow-hidden animate-fade-in-up shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900 to-stone-900 p-5 flex items-start gap-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl shadow-inner text-red-500 shrink-0 backdrop-blur-sm">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h3 className="font-serif font-bold text-xl text-white mb-1">Execution Audit</h3>
                    <p className="text-stone-300 text-sm font-sans">
                        Your current project state is <span className="text-red-400 font-bold uppercase tracking-wider">{status}</span>.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                <div>
                    <p className="text-stone-600 text-sm leading-relaxed mb-4 font-bold uppercase tracking-wide flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" /> Critical Gaps Detected
                    </p>
                    <div className="space-y-3">
                        {missingDataPoints.map((point, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 bg-white border border-stone-200 rounded-lg">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <div>
                                    <span className="font-bold text-stone-800 text-sm">{point.category}:</span>
                                    <span className="ml-1 text-stone-600 text-sm">{point.details}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {executiveSummary && (
                    <div className="bg-stone-200/50 p-4 rounded-lg border-l-4 border-nobel-gold">
                        <p className="text-stone-700 text-xs italic font-serif leading-relaxed">
                            <span className="font-bold not-italic text-nobel-gold uppercase tracking-wider text-[10px] mr-2">Executive Note</span>
                            "{executiveSummary}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionAudit;
