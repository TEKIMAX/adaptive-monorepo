import React, { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import ActionCard from './ActionCard';
import OKRCard from './OKRCard';

interface CodeBlockProps {
    className?: string;
    children: React.ReactNode;
    inline?: boolean;
    onNavigate?: (page: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, inline, onNavigate }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    if (inline) {
        return (
            <code className="bg-nobel-gold/10 text-nobel-gold px-1.5 py-0.5 rounded text-[13px] font-mono font-bold">
                {children}
            </code>
        );
    }

    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const isJson = language === 'json';

    // Attempt to render UI components for specific JSON structures
    if (isJson) {
        try {
            const content = String(children).replace(/\n/g, '');
            const parsed = JSON.parse(content);

            // Check for ActionCard structure
            if (parsed.title && parsed.description && parsed.buttonLabel && parsed.navigationTarget) {
                return (
                    <ActionCard
                        title={parsed.title}
                        description={parsed.description}
                        buttonLabel={parsed.buttonLabel}
                        navigationTarget={parsed.navigationTarget}
                        onNavigate={onNavigate}
                    />
                );
            }

            // Check for OKR structure
            if (parsed.keyResults && Array.isArray(parsed.keyResults) && (parsed.objective || parsed.title)) {
                // Calculate progress if not provided
                let progress = parsed.progress;
                if (progress === undefined && parsed.keyResults.length > 0) {
                    const totalProgress = parsed.keyResults.reduce((acc: number, kr: any) => acc + (kr.progress || 0), 0);
                    progress = Math.round(totalProgress / parsed.keyResults.length);
                }

                // Map Key Results
                const mappedKRs = parsed.keyResults.map((kr: any) => {
                    // Determine status
                    let status: 'completed' | 'in-progress' | 'pending' = 'pending';
                    if (kr.progress >= 100) status = 'completed';
                    else if (kr.progress > 0) status = 'in-progress';

                    return {
                        label: kr.description || kr.label || "Key Result",
                        target: `${kr.target}${kr.unit || ''}`,
                        current: `${kr.progress}${kr.unit || ''}`,
                        status: status
                    };
                });

                // Format Overall Status
                let statusLabel = parsed.status || "In Progress";
                if (statusLabel === "NOT_STARTED") statusLabel = "Not Started";
                if (statusLabel === "IN_PROGRESS") statusLabel = "On Track"; // Default to positive mapping for demo

                return (
                    <OKRCard
                        objective={parsed.objective || parsed.title}
                        timeline={parsed.title || "Quarterly Goal"} // Use title as timeline/header if objective is separate
                        status={statusLabel}
                        progress={progress || 0}
                        keyResults={mappedKRs}
                    />
                );
            }

        } catch (e) {
            // Not valid JSON or doesn't match schema, fall through to default code block
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children));
        setIsCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Special handling for plain text/markdown blocks (Light Theme)
    const isText = ['text', 'txt', 'markdown', 'md'].includes(language);

    if (isText) {
        return (
            <div className="my-4 relative group">
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 bg-white border border-stone-200 hover:border-nobel-gold rounded-md shadow-sm text-stone-400 hover:text-nobel-gold transition-colors"
                        title="Copy content"
                    >
                        {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-xl p-5 text-sm text-stone-700 leading-relaxed font-serif shadow-sm whitespace-pre-wrap">
                    {children}
                </div>
            </div>
        );
    }

    // Default Dark Terminal for Code
    return (
        <div className="my-6 rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-lg group">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/5 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-gray-400" />
                    <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                        {language}
                    </span>
                    {isJson && (
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded ml-2 font-bold uppercase tracking-wider">
                            Data Object
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                        title="Copy"
                    >
                        {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className="text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0'} overflow-auto custom-scrollbar`}>
                <pre className="p-4 m-0 text-[13px] font-mono leading-relaxed text-gray-300">
                    {children}
                </pre>
            </div>
            {!isExpanded && (
                <div className="px-4 py-2 text-[10px] text-gray-500 font-mono italic">
                    {String(children).slice(0, 50)}...
                </div>
            )}
        </div>
    );
};

export default CodeBlock;
