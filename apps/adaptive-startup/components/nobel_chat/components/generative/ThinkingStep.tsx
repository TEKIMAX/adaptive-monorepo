import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ChevronDown, BrainCircuit } from 'lucide-react';

interface ThinkingStepProps {
    reasoning: string;
    isStreaming: boolean;
    hasContent: boolean;
}

const ThinkingStep: React.FC<ThinkingStepProps> = ({ reasoning, isStreaming, hasContent }) => {
    // Logic: "Thinking" means streaming is active BUT content hasn't started yet.
    const isThinking = isStreaming && !hasContent;
    const isDone = !isThinking; // Either content started or stream finished.

    const [isOpen, setIsOpen] = useState(isThinking);

    // Auto-open when thinking starts, Auto-close when thinking ends (content starts)
    useEffect(() => {
        if (isThinking) {
            setIsOpen(true);
        } else if (hasContent) {
            // Close when content appears
            setIsOpen(false);
        }
    }, [isThinking, hasContent]);

    return (
        <div className="mb-4 animate-fade-in-down">
            <details
                className="group/reasoning"
                open={isOpen}
                onToggle={(e) => setIsOpen((e.currentTarget as HTMLDetailsElement).open)}
            >
                <summary className="list-none flex items-center gap-3 cursor-pointer select-none p-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <div className={`p-1.5 rounded-md ${isThinking ? 'bg-stone-100 text-stone-600' : 'bg-stone-100 text-stone-500'}`}>
                        {isThinking ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <BrainCircuit size={16} />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isThinking ? 'text-stone-600' : 'text-stone-500'}`}>
                                {isThinking ? 'Processing...' : 'Thought Process'}
                            </span>
                            {!isThinking && <CheckCircle2 size={12} className="text-green-600" />}
                        </div>
                        {isThinking && (
                            <span className="text-[10px] text-stone-400 font-medium animate-pulse">
                                Synthesizing venture data...
                            </span>
                        )}
                    </div>

                    <ChevronDown
                        size={14}
                        className={`ml-auto text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </summary>

                <div className="mt-2 pl-4 border-l-2 border-stone-100 ml-3">
                    <div className="p-4 bg-stone-50/50 rounded-r-xl rounded-bl-xl text-sm text-stone-600 italic leading-relaxed whitespace-pre-wrap font-mono">
                        {reasoning}
                        {isThinking && <span className="inline-block w-1.5 h-3 ml-1 bg-amber-400 animate-pulse align-middle" />}
                    </div>
                </div>
            </details>
        </div>
    );
};

export default ThinkingStep;
