import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BetaRequestForm } from './BetaRequestForm';

interface BetaRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BetaRequestDialog: React.FC<BetaRequestDialogProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Request Beta Access</h3>
                                <p className="text-white/40 text-sm">Join the TEKIMAX private beta and start deploying responsible AI infrastructure.</p>
                            </div>
                            <button onClick={onClose} className="text-white/20 hover:text-white transition-colors p-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <BetaRequestForm onCancel={onClose} />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
