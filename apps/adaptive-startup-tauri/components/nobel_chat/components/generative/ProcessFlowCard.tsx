import React from 'react';
import { Network, ArrowRight } from 'lucide-react';

interface Step {
    stepNumber: number;
    title: string;
    description: string;
}

interface ProcessFlowCardProps {
    title: string;
    steps: Step[];
}

const ProcessFlowCard: React.FC<ProcessFlowCardProps> = ({ title, steps }) => {
    return (
        <div className="my-6 w-full md:max-w-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                    <Network size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-stone-900 leading-tight">Workflow</h3>
                    <p className="text-xs text-stone-500 font-medium">{title}</p>
                </div>
            </div>

            <div className="space-y-0">
                {steps.sort((a, b) => a.stepNumber - b.stepNumber).map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shadow-sm z-10 group-hover:border-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                {step.stepNumber}
                            </div>
                            {idx !== steps.length - 1 && (
                                <div className="w-0.5 h-full bg-stone-100 -my-2 py-4 group-hover:bg-indigo-100 transition-colors"></div>
                            )}
                        </div>
                        <div className="pb-6 pt-1 flex-1">
                            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm group-hover:shadow-md transition-all">
                                <h4 className="font-bold text-stone-800 text-sm mb-1">{step.title}</h4>
                                <p className="text-xs text-stone-500 leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessFlowCard;
