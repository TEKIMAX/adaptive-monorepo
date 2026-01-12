import React from 'react';
import { Scale, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface Risk {
    category: string;
    riskLevel: string;
    description: string;
    mitigation: string;
}

interface LegalRiskAssessmentCardProps {
    overallRisk: string;
    summary: string;
    risks: Risk[];
}

const LegalRiskAssessmentCard: React.FC<LegalRiskAssessmentCardProps> = ({ overallRisk, summary, risks }) => {
    const getRiskColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-stone-600 bg-stone-50 border-stone-100';
        }
    };

    return (
        <div className="my-6 w-full md:max-w-xl bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-stone-50/50 p-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 text-stone-600 rounded-lg">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-900 leading-tight">Risk Assessment</h3>
                        <p className="text-xs text-stone-500 font-medium">Legal & Compliance Check</p>
                    </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getRiskColor(overallRisk)}`}>
                    {overallRisk} Risk
                </span>
            </div>

            <div className="p-4">
                <p className="text-sm text-stone-600 italic mb-4 border-l-2 border-stone-200 pl-3">{summary}</p>

                <div className="space-y-3">
                    {risks.map((risk, idx) => (
                        <div key={idx} className="border border-stone-100 rounded-lg p-3 hover:bg-stone-50/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{risk.category}</span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getRiskColor(risk.riskLevel)}`}>{risk.riskLevel}</span>
                            </div>
                            <p className="text-xs font-bold text-stone-800 mb-1">{risk.description}</p>
                            <div className="flex gap-2 items-start mt-2 bg-stone-50 p-2 rounded text-xs text-stone-600">
                                <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span><span className="font-bold text-stone-700">Mitigation:</span> {risk.mitigation}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LegalRiskAssessmentCard;
