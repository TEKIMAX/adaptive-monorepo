import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StrategySummarySheetProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string;
    isGenerating: boolean;
}

export const StrategySummarySheet: React.FC<StrategySummarySheetProps> = ({
    isOpen,
    onClose,
    summary,
    isGenerating
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-[600px] bg-white border-l border-stone-200 overflow-hidden flex flex-col z-50 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-nobel-gold" />
                                    Strategic Summary
                                </h3>
                                <p className="text-xs text-stone-400 mt-2">AI-generated analysis of your current priorities.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-8">
                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-8 h-8 border-4 border-stone-200 border-t-nobel-gold rounded-full animate-spin"></div>
                                    <p className="text-stone-500 text-sm font-medium animate-pulse">Analyzing your startup data...</p>
                                </div>
                            ) : summary ? (
                                <div className="prose prose-stone prose-sm max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-stone-900 mb-4 mt-6" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-stone-900 mb-3 mt-5" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-md font-bold text-stone-900 mb-2 mt-4" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-stone-600 leading-relaxed mb-4" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-stone-600" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-nobel-gold pl-4 italic text-stone-500 my-4" {...props} />
                                        }}
                                    >
                                        {summary}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                                    <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                                    <p>No summary generated yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-stone-100 bg-stone-50/50">
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-3 bg-black text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors shadow-lg"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
