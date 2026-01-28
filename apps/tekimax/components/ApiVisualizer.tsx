
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiEndpoint {
    id: string;
    title: string;
    description: string;
    method: 'GET' | 'POST';
    path: string;
    capabilities: string[];
}

const ENDPOINTS: ApiEndpoint[] = [
    {
        id: 'learning',
        title: 'Adaptive Learning',
        description: 'Generates modality-adaptive AI content with automatic audit tagging and cryptographic signatures.',
        method: 'POST',
        path: '/v1/stream-learning-content',
        capabilities: ['Dynamic Complexity', 'Supervisory Check', 'Audit Logging']
    },
    {
        id: 'adaptive',
        title: 'Self-Adaptive Profiles',
        description: 'Analyzes interaction history to determine optimal learning modalities (Visual, Auditory, Textual).',
        method: 'POST',
        path: '/v1/user/modality-profile',
        capabilities: ['Algorithmic Affinity', 'Preference Detection', 'Accessibiltiy Sync']
    },
    {
        id: 'compliance',
        title: 'Contestability & Redress',
        description: 'Meaningful recourse flow for users to flag and correct AI outputs per OMB M-25-21.',
        method: 'POST',
        path: '/v1/contest-outcome',
        capabilities: ['Hallucination Reporting', 'Bias Detection', 'Automated Redress']
    },
    {
        id: 'provenance',
        title: 'Content Provenance',
        description: 'Cryptographic authentication of content origin and human-to-AI attribution metrics.',
        method: 'GET',
        path: '/v1/provenance/{id}',
        capabilities: ['Human Agency Scoring', 'Origin Chains', 'Signoff Verification']
    },
    {
        id: 'agent',
        title: 'Intelligent Orchestration',
        description: 'FunctionGemma-style orchestrator that analyzes queries to route to the correct platform capability.',
        method: 'POST',
        path: '/v1/agent/orchestrate',
        capabilities: ['Tool Selection', 'Routing Reasoning', 'Multi-Tenant Logic']
    }
];

export const ApiVisualizer: React.FC = () => {
    const [activeTab, setActiveTab] = useState(ENDPOINTS[0].id);
    const activeEndpoint = ENDPOINTS.find(e => e.id === activeTab) || ENDPOINTS[0];

    return (
        <div className="mt-20 w-full max-w-5xl mx-auto reveal-on-scroll">
            <div className="text-center mb-12">
                <h3 className="font-serif text-3xl md:text-5xl text-white mb-4">Architecture <span className="italic text-tekimax-blue">API.</span></h3>
                <p className="text-white/40 text-sm max-w-xl mx-auto font-light">
                    Cognitive expansion and modality-based learning support API with built-in compliance and provenance tracking.
                </p>
            </div>

            {/* Tab bar - Horizontal Rounded Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-16 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm self-center">
                {ENDPOINTS.map((endpoint) => (
                    <button
                        key={endpoint.id}
                        onClick={() => setActiveTab(endpoint.id)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === endpoint.id
                            ? 'bg-tekimax-blue text-white shadow-lg'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {endpoint.title}
                    </button>
                ))}
            </div>

            {/* Visualizer Canvas */}
            <div className="relative h-[480px] w-full rounded-[2.5rem] bg-[#0b0f1a]/80 border border-white/10 overflow-hidden p-8 md:p-12 shadow-inner group">

                {/* Connection Background Layer (SVG) */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full opacity-20">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#60A5FA" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                        <AnimatePresence mode="wait">
                            <motion.path
                                key={activeTab}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                d="M 150 240 L 400 240 M 600 240 L 850 240"
                                stroke="url(#lineGrad)"
                                strokeWidth="2"
                                fill="none"
                            />
                        </AnimatePresence>
                    </svg>
                </div>

                <div className="relative h-full flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Node 1: Request */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-center gap-4 group/node"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover/node:border-tekimax-blue/50 transition-colors">
                            <svg className="w-8 h-8 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Client Request</span>
                    </motion.div>

                    {/* Node 2: The Core Engine (Selected Activity) */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="flex-grow max-w-lg w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative"
                        >
                            <div className="absolute -top-3 left-8 px-4 py-1 rounded-full bg-tekimax-blue text-white text-[9px] font-black uppercase tracking-widest">
                                Pulse Core Pipeline
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-tekimax-blue/10 text-tekimax-blue text-[10px] font-bold uppercase tracking-wider border border-tekimax-blue/20">
                                            {activeEndpoint.method} {activeEndpoint.path}
                                        </span>
                                    </div>
                                    <h4 className="text-xl text-white font-medium mb-2">{activeEndpoint.title}</h4>
                                    <p className="text-sm text-white/50 font-light leading-relaxed">
                                        {activeEndpoint.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {activeEndpoint.capabilities.map((cap, i) => (
                                        <div key={i} className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] text-white/70 font-semibold uppercase tracking-wider text-center">
                                            {cap}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Node 3: Result */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-center gap-4 group/node"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover/node:border-tekimax-blue/50 transition-colors">
                            <svg className="w-8 h-8 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compliance Result</span>
                    </motion.div>

                </div>

                {/* Floating Background Pills for texture */}
                <div className="absolute bottom-10 right-10 flex gap-2 opacity-5">
                    <div className="px-10 py-4 border border-white rounded-full"></div>
                    <div className="px-10 py-4 border border-white rounded-full"></div>
                    <div className="px-10 py-4 border border-white rounded-full"></div>
                </div>
            </div>
        </div>
    );
};
