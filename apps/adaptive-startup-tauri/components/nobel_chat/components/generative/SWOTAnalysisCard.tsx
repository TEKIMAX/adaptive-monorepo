import React from 'react';
import { Shield, Zap, Target, AlertTriangle } from 'lucide-react';

interface SWOTAnalysisCardProps {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    competitorName?: string;
}

const SWOTAnalysisCard: React.FC<SWOTAnalysisCardProps> = ({
    strengths, weaknesses, opportunities, threats, competitorName
}) => {
    const sections = [
        {
            title: 'Strengths',
            items: strengths,
            icon: Shield,
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            headerText: 'text-emerald-800'
        },
        {
            title: 'Weaknesses',
            items: weaknesses,
            icon: AlertTriangle,
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-700',
            headerText: 'text-amber-800'
        },
        {
            title: 'Opportunities',
            items: opportunities,
            icon: Zap,
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
            headerText: 'text-blue-800'
        },
        {
            title: 'Threats',
            items: threats,
            icon: Target,
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-700',
            headerText: 'text-red-800'
        }
    ];

    return (
        <div className="my-6 w-full md:max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                        <Target size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-stone-900 leading-tight">SWOT Analysis</h3>
                        {competitorName && <p className="text-xs text-stone-500 font-medium">Target: {competitorName}</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section, idx) => (
                    <div key={idx} className={`${section.bg} ${section.border} border rounded-xl p-4 shadow-sm`}>
                        <div className="flex items-center gap-2 mb-3">
                            <section.icon size={16} className={section.text} />
                            <h4 className={`text-sm font-bold uppercase tracking-wider ${section.headerText}`}>{section.title}</h4>
                        </div>
                        <ul className="space-y-2">
                            {section.items.map((item, i) => (
                                <li key={i} className="flex gap-2 text-xs font-medium text-stone-700 leading-relaxed">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${section.text.replace('text-', 'bg-')} opacity-50 shrink-0`}></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SWOTAnalysisCard;
