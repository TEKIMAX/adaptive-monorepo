
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from 'sonner';

interface ModelCanvasCardProps {
    section: string;
    content: string;
    projectId?: string | null;
    onNavigate?: (view: string) => void;
}

const ModelCanvasCard: React.FC<ModelCanvasCardProps> = ({ section, content, projectId, onNavigate }) => {
    const updateCanvas = useMutation(api.canvas.updateSection);
    const [isSaved, setIsSaved] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        if (!projectId) {
            toast.error("No project selected to save to.");
            return;
        }

        setIsSaving(true);
        try {
            await updateCanvas({
                projectId,
                section,
                content,
                tags: ['AI Assisted']
            });
            setIsSaved(true);
            toast.success(`Saved to ${section}`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to save to canvas");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="my-6 border border-nobel-gold/20 rounded-2xl shadow-sm bg-white overflow-hidden animate-fade-in">
            <div className="bg-nobel-dark px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-serif text-lg font-medium">{section}</h3>
                <span className="text-[10px] text-nobel-gold uppercase tracking-[0.2em] font-bold bg-white/5 px-2 py-1 rounded">
                    Canvas Suggestion
                </span>
            </div>

            <div className="p-6">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-sans prose-nobel">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={() => onNavigate?.('CANVAS')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-stone-50 hover:text-nobel-gold transition-all shadow-sm"
                    >
                        <ExternalLink size={14} /> Go to Canvas
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaved || isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isSaved
                            ? 'bg-emerald-50 text-emerald-600 cursor-default'
                            : 'bg-nobel-dark text-white hover:bg-nobel-gold shadow-md active:scale-95 disabled:opacity-50'
                            }`}
                    >
                        {isSaved ? (
                            <><CheckCircle size={14} /> Saved to Canvas</>
                        ) : (
                            <>
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? 'Saving...' : 'Save to Canvas'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelCanvasCard;
