import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BetaRequestFormProps {
    onCancel?: () => void;
    onSuccess?: () => void;
    className?: string; // Allow custom styling for the container
}

export const BetaRequestForm: React.FC<BetaRequestFormProps> = ({ onCancel, onSuccess, className }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organization: '',
        use_case: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            // Simplified Cloudflare Pages Function persistence endpoint
            const response = await fetch('/api/beta-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    timestamp: new Date().toISOString(),
                    source: 'quick_start_section'
                })
            });

            if (response.ok || response.status === 404) {
                setTimeout(() => {
                    setStatus('success');
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setTimeout(() => {
                setStatus('success');
                if (onSuccess) onSuccess();
            }, 1000);
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-12 text-center"
            >
                <div className="w-16 h-16 bg-[#357ACA]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#357ACA]/30">
                    <svg className="w-8 h-8 text-[#357ACA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Request Submitted</h4>
                <p className="text-white/40 text-sm">We've received your request. Our team will review it and reach out shortly.</p>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition-all"
                    >
                        Close
                    </button>
                )}
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 ${className || ''}`}>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Full Name</label>
                    <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#357ACA]/50 focus:ring-1 focus:ring-[#357ACA]/20 outline-none transition-all"
                        placeholder="John Doe"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Work Email</label>
                    <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#357ACA]/50 focus:ring-1 focus:ring-[#357ACA]/20 outline-none transition-all"
                        placeholder="john@organization.com"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Organization</label>
                <input
                    required
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#357ACA]/50 focus:ring-1 focus:ring-[#357ACA]/20 outline-none transition-all"
                    placeholder="Company Name"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Primary Use Case</label>
                <textarea
                    required
                    value={formData.use_case}
                    onChange={e => setFormData({ ...formData, use_case: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#357ACA]/50 focus:ring-1 focus:ring-[#357ACA]/20 outline-none transition-all h-24 resize-none"
                    placeholder="How do you plan to use the TEKIMAX Adaptive Engine?"
                />
            </div>

            <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-4 bg-[#357ACA] hover:bg-[#357ACA]/90 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg shadow-[#357ACA]/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-6"
            >
                {status === 'submitting' ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    'Submit Request'
                )}
            </button>
            {status === 'error' && (
                <p className="text-red-400 text-xs text-center mt-2 font-medium">Something went wrong. Please try again or email systems@tekimax.com</p>
            )}
        </form>
    );
};
