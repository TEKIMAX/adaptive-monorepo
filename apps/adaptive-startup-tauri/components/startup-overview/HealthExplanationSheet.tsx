import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface HealthExplanationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    healthScore: number;
    legalDocs: Record<string, boolean>;
}

export const HealthExplanationSheet: React.FC<HealthExplanationSheetProps> = ({
    isOpen,
    onClose,
    healthScore,
    legalDocs
}) => {
    const foundationalDocs = [
        { id: 'Business Registration', label: 'Business Registration', desc: 'Official government registration of your entity.' },
        { id: 'EIN Number', label: 'EIN Number', desc: 'Federal Tax ID from the IRS.' },
        { id: 'Operating Agreement', label: 'Operating Agreement', desc: 'Governing document for LLCs or Bylaws for Corporations.' },
        { id: 'Bylaws', label: 'Bylaws', desc: 'Internal rules for corporate governance.' }
    ];

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
                        className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-stone-200 overflow-hidden flex flex-col z-50 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-stone-900">Foundational Health</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthScore >= 80 ? 'bg-emerald-500 text-white' :
                                            healthScore >= 60 ? 'bg-nobel-gold text-white' :
                                                'bg-red-500 text-white'
                                        }`}>
                                        Score: {healthScore}/100
                                    </div>
                                    <p className="text-xs text-stone-400">Core legal compliance</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-8 space-y-8">
                            <div>
                                <p className="text-sm text-stone-500 leading-relaxed">
                                    Your Health Score is calculated based on the existence of foundational legal documents. These are the critical items required for any startup to operate legally and be investor-ready.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400">Score Breakdown</h4>
                                <div className="space-y-3">
                                    {foundationalDocs.map((doc) => {
                                        const isDone = legalDocs[doc.id];
                                        return (
                                            <div
                                                key={doc.id}
                                                className={`p-4 rounded-xl border transition-all ${isDone
                                                        ? 'bg-emerald-50/30 border-emerald-100'
                                                        : 'bg-stone-50 border-stone-100'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-3">
                                                        <div className={`mt-0.5 ${isDone ? 'text-emerald-500' : 'text-stone-300'}`}>
                                                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <h5 className={`font-bold text-sm ${isDone ? 'text-stone-900' : 'text-stone-500'}`}>
                                                                {doc.label}
                                                            </h5>
                                                            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                                                                {doc.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${isDone ? 'text-emerald-600' : 'text-stone-300'}`}>
                                                        {isDone ? '+25' : '0'} pts
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <h5 className="text-sm font-bold text-amber-900">Why exclusion matters</h5>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                        Documents like Stock Purchase or IP Assignment are critical for scaling, but "Foundational Health" focuses on the initial registration and governance required to exist as a entity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-stone-100 bg-stone-50/50">
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
