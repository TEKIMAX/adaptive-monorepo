import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface HealthScoreProps {
    healthScore: number;
    setShowHealthSheet: (show: boolean) => void;
    getHealthColor: (score: number) => string;
    getHealthBg: (score: number) => string;
}

export const HealthScore: React.FC<HealthScoreProps> = ({
    healthScore,
    setShowHealthSheet,
    getHealthColor,
    getHealthBg
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-center relative group"
        >
            <button
                onClick={() => setShowHealthSheet(true)}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-nobel-gold hover:bg-nobel-gold/10 rounded-full transition-all"
            >
                <Info className="w-4 h-4" />
            </button>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">Health Score</p>
            <div className="flex items-baseline gap-2">
                {/* Removed font-serif */}
                <span className={`text-5xl font-bold ${getHealthColor(healthScore)}`}>{healthScore}</span>
                <span className="text-stone-300 text-lg">/100</span>
            </div>
            <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${getHealthBg(healthScore)}`}
                />
            </div>
        </motion.div>
    );
};
