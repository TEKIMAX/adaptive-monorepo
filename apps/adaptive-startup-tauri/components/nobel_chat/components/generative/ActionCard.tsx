import React from 'react';
import { useMutation } from 'convex/react';
import { api } from "../../../../convex/_generated/api";
import { ArrowRight, AlertCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface ActionCardProps {
    title: string;
    description: string;
    buttonLabel: string;
    navigationTarget: string;
    onNavigate?: (page: string) => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
    title, description, buttonLabel, navigationTarget, onNavigate
}) => {

    const handleNavigate = () => {
        if (onNavigate) {
            onNavigate(navigationTarget);
            toast.info(`Navigating to ${buttonLabel}...`);
        } else {
            toast.error("Navigation not available in this context.");
        }
    };

    return (
        <div className="my-6 max-w-lg w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm animate-fade-in-up">
            <div className="bg-stone-50/50 p-5 flex items-start gap-4">
                <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-sm text-stone-700 shrink-0">
                    <Navigation size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-stone-900 mb-1">{title}</h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
                </div>
            </div>

            <div className="px-5 py-4 bg-white border-t border-stone-100 flex justify-end">
                <button
                    onClick={handleNavigate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-nobel-gold hover:text-white transition-all shadow-md active:scale-95"
                >
                    {buttonLabel} <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default ActionCard;
