import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIStrategyMemoProps {
    dailyMemo: any;
    isGeneratingMemo: boolean;
    showAISettings: boolean;
    setShowAISettings: (show: boolean) => void;
    isMemoExpanded: boolean;
    setIsMemoExpanded: (expanded: boolean) => void;
    markMemoAsRead: (args: { memoId: any }) => void; // Using any for ID to avoid import complexity here
    handleRefreshMemo: () => void;
    updateProject: (args: any) => void;
    data: any;
}

export const AIStrategyMemo: React.FC<AIStrategyMemoProps> = ({
    dailyMemo,
    isGeneratingMemo,
    showAISettings,
    setShowAISettings,
    isMemoExpanded,
    setIsMemoExpanded,
    markMemoAsRead,
    handleRefreshMemo,
    updateProject,
    data
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 text-white relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-nobel-gold/10 rounded-full blur-3xl" />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-nobel-gold animate-pulse" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#B4A089]">AI Strategy Memo</p>
                        {dailyMemo && !dailyMemo.isRead && (
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-500 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse ml-2">
                                New Advice
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isGeneratingMemo && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-nobel-gold border-t-transparent rounded-full animate-spin" />
                                <span className="text-[9px] text-nobel-gold font-bold uppercase">Synthesizing...</span>
                            </div>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setShowAISettings(!showAISettings)}
                                className="p-1 hover:bg-stone-700 rounded-lg transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                            </button>
                            <AnimatePresence>
                                {showAISettings && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-4 z-50"
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">Sync Frequency</p>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[9px] text-stone-400 block mb-1">Expert Strategy</label>
                                                <select
                                                    value={data.strategyFrequencyDays || 14}
                                                    onChange={(e) => updateProject({ id: data.id as any, updates: { strategyFrequencyDays: parseInt(e.target.value) } })}
                                                    className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs px-2 py-1 text-white"
                                                >
                                                    <option value="7">Every Week</option>
                                                    <option value="14">Bi-Weekly</option>
                                                    <option value="30">Monthly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-stone-400 block mb-1">Daily Focus</label>
                                                <select
                                                    value={data.memoFrequencyDays || 1}
                                                    onChange={(e) => updateProject({ id: data.id as any, updates: { memoFrequencyDays: parseInt(e.target.value) } })}
                                                    className="w-full bg-stone-900 border border-stone-700 rounded-lg text-xs px-2 py-1 text-white"
                                                >
                                                    <option value="1">Every Morning</option>
                                                    <option value="2">Every 2 Days</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleRefreshMemo}
                                                disabled={isGeneratingMemo}
                                                className="w-full py-2 bg-nobel-gold/20 text-nobel-gold rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-nobel-gold/30 transition-all mt-2"
                                            >
                                                Force Sync
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                {/* Removed font-serif here */}
                <div className={`prose prose-sm prose-invert max-w-none relative overflow-hidden transition-all duration-500 ${isMemoExpanded ? 'max-h-[2000px]' : 'max-h-[120px]'}`}>
                    {dailyMemo ? (
                        <>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => <p className="text-base text-stone-100 leading-relaxed italic mb-3 last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="text-nobel-gold font-bold">{children}</strong>,
                                    ul: ({ children }) => <ul className="list-disc ml-4 mb-3 text-stone-200">{children}</ul>,
                                    li: ({ children }) => <li className="text-sm mb-1">{children}</li>,
                                }}
                            >
                                {dailyMemo.content}
                            </ReactMarkdown>
                            {!isMemoExpanded && dailyMemo.content.split('\n').length > 3 && (
                                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-900 to-transparent flex items-end justify-center pb-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMemoExpanded(true);
                                            if (!dailyMemo.isRead) markMemoAsRead({ memoId: dailyMemo._id });
                                        }}
                                        className="px-4 py-1.5 bg-stone-800 border border-stone-700 rounded-full text-[10px] font-bold text-nobel-gold uppercase tracking-widest hover:bg-stone-700 transition-colors shadow-lg"
                                    >
                                        Read Full Strategic Memo
                                    </button>
                                </div>
                            )}
                            {isMemoExpanded && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsMemoExpanded(false); }}
                                        className="px-4 py-1.5 bg-stone-800/50 border border-stone-700/50 rounded-full text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Collapse Memo
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-base text-stone-300 leading-relaxed italic animate-pulse">
                            Awaiting strategic synchronization...
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
