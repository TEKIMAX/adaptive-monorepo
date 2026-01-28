import React from 'react';
import { Target, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface KeyResult {
    label: string;
    target: string;
    current: string;
    status: 'completed' | 'in-progress' | 'pending';
}

interface OKRCardProps {
    objective: string;
    timeline: string;
    status: string;
    progress: number;
    keyResults: KeyResult[];
}

const OKRCard: React.FC<OKRCardProps> = ({ objective, timeline, status, progress, keyResults }) => {
    return (
        <div className="my-6 md:max-w-xl w-full bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-stone-50/50 px-5 py-4 border-b border-stone-100 flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg h-fit">
                        <Target size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{timeline}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status === 'On Track' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    status === 'At Risk' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                {status}
                            </span>
                        </div>
                        <h3 className="font-bold text-stone-900 leading-snug">{objective}</h3>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-stone-800">{progress}%</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-stone-100">
                <div className="h-full bg-purple-600 rounded-r-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Key Results */}
            <div className="p-5 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Key Results</h4>
                {keyResults.map((kr, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                        {kr.status === 'completed' ? (
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        ) : kr.status === 'in-progress' ? (
                            <div className="w-4.5 h-4.5 rounded-full border-2 border-purple-500 border-t-transparent shrink-0 animate-spin-slow" />
                        ) : (
                            <Circle size={18} className="text-stone-300 shrink-0" />
                        )}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${kr.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                {kr.label}
                            </p>
                        </div>
                        <div className="text-xs font-bold text-stone-500 bg-stone-50 px-2 py-1 rounded">
                            {kr.current} <span className="text-stone-300">/</span> {kr.target}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OKRCard;
