import React, { useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface CodeBlockProps {
    className?: string;
    children: React.ReactNode;
    inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, inline }) => {
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

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children));
        setIsCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setIsCopied(false), 2000);
    };

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
