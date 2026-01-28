
import React, { useState } from 'react';
import { getModalitySimulation } from '../services/geminiService';
import { LearningModality } from '../types';

const ModalityDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Market Segmentation');
  const [selectedModality, setSelectedModality] = useState<LearningModality>(LearningModality.Analytical);
  const [result, setResult] = useState<{ content: string; explanation: string } | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await getModalitySimulation(topic, selectedModality);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-nobel-dark/5 p-8 rounded-2xl shadow-sm">
      <h3 className="font-serif text-2xl mb-6">Engine Modality Preview</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-nobel-dark/50 mb-2 font-semibold">Concept to Learn</label>
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-nobel-cream/50 border border-nobel-dark/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-nobel-gold"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-nobel-dark/50 mb-2 font-semibold">Learning Modality</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(LearningModality).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModality(m)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  selectedModality === m 
                  ? 'bg-nobel-dark text-white border-nobel-dark' 
                  : 'bg-transparent text-nobel-dark/60 border-nobel-dark/10 hover:border-nobel-gold'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-nobel-gold text-white py-4 rounded-lg font-medium hover:brightness-105 transition-all disabled:opacity-50"
        >
          {loading ? 'Engine Adapting...' : 'Simulate Engine Adaptation'}
        </button>

        {result && (
          <div className="mt-8 animate-fadeIn">
            <div className="p-6 bg-nobel-cream rounded-xl border border-nobel-gold/20">
              <p className="text-nobel-dark/80 italic text-sm mb-4 leading-relaxed">
                {result.content}
              </p>
              <div className="pt-4 border-t border-nobel-gold/10">
                <span className="text-[10px] uppercase tracking-tighter text-nobel-gold font-bold block mb-1">System Logic</span>
                <p className="text-xs text-nobel-dark/60">{result.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalityDemo;
