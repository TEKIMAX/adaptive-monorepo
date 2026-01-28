import React from 'react';

interface TechCardProps {
    content: any;
    onClick?: () => void;
}

export const TechCard: React.FC<TechCardProps> = ({ content, onClick }) => (
    <div
        className={`bg-white/[0.02] border border-white/5 rounded-md overflow-hidden mt-4 hover:border-white/10 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="bg-white/[0.02] border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${content.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {content.method}
                </span>
                <span className="text-white/60">{content.endpoint}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></div>
                <span className="text-[10px] uppercase text-white/30 font-medium">Active</span>
            </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5">
            {content.stats.map((stat: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                    <span className="text-[10px] uppercase text-white/40 mb-0.5">{stat.label}</span>
                    <span className={`text-xl font-medium ${stat.color}`}>{stat.value}</span>
                </div>
            ))}
        </div>

        <div className="px-4 py-3 bg-white/[0.01] flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors">
                <span>Configure</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
            </button>
        </div>
    </div>
);
