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
        <div className="my-6 w-full bg-white border border-nobel-gold/20 rounded-xl overflow-hidden shadow-md animate-fade-in-up">
            <div className="bg-nobel-dark p-5 flex items-start gap-4">
                <div className="p-3 bg-white/10 border border-white/20 rounded-xl shadow-inner text-nobel-gold shrink-0 backdrop-blur-sm">
                    <Navigation size={24} />
                </div>
                <div>
                    <h3 className="font-serif font-bold text-lg text-white mb-1">{title}</h3>
                    <p className="text-sm text-stone-300 leading-relaxed font-sans break-words whitespace-pre-wrap">{description}</p>
                </div>
            </div>

            <div className="px-5 py-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button
                    onClick={handleNavigate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-nobel-gold text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#A38035] transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    {buttonLabel} <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default ActionCard;
