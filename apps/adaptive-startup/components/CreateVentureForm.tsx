import React, { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface CreateVentureFormProps {
    onComplete: (name: string, hypothesis: string, foundingDate: number) => void;
    onBack: () => void;
    user?: any;
    projects?: any[];
}

export const CreateVentureForm: React.FC<CreateVentureFormProps> = ({ onComplete, onBack }) => {
    const [name, setName] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [foundingYear, setFoundingYear] = useState<string>(new Date().getFullYear().toString());

    return (
        <div className="w-full max-w-2xl animate-fade-in-up mx-auto p-4">
            <div className="text-center mb-10">
                <button
                    onClick={onBack}
                    className="mb-8 inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                </button>
                <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-2">
                    New Venture
                </h2>
                <p className="text-stone-500">
                    Start a new journey. You are already subscribed.
                </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                Startup Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Acme AI"
                                className="w-full px-4 py-3 bg-[#F9F8F4] border-b-2 border-stone-200 focus:border-nobel-gold outline-none transition-colors text-lg text-stone-900 placeholder-stone-300"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                Est. Year
                            </label>
                            <input
                                type="number"
                                value={foundingYear}
                                onChange={(e) => setFoundingYear(e.target.value)}
                                placeholder="2024"
                                className="w-full px-4 py-3 bg-[#F9F8F4] border-b-2 border-stone-200 focus:border-nobel-gold outline-none transition-colors text-lg text-stone-900 placeholder-stone-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                            Value Proposition (Hypothesis)
                        </label>
                        <textarea
                            value={hypothesis}
                            onChange={(e) => setHypothesis(e.target.value)}
                            placeholder="We help [Target Audience] solve [Problem] by [Solution] with [Secret Sauce]."
                            className="w-full px-4 py-4 bg-[#F9F8F4] border border-stone-200 rounded-lg focus:border-nobel-gold outline-none transition-all text-base text-stone-600 font-light leading-relaxed h-32 resize-none"
                        />
                    </div>

                    <button
                        onClick={() => {
                            if (name.trim()) {
                                const year = parseInt(foundingYear) || new Date().getFullYear();
                                const foundingDate = new Date(year, 0, 1).getTime();
                                onComplete(name, hypothesis, foundingDate);
                            }
                        }}
                        disabled={!name.trim()}
                        className="w-full py-4 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200 flex items-center justify-center gap-2"
                    >
                        Launch Venture <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
