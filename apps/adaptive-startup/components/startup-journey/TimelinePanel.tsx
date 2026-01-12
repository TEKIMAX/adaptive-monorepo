import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, Paperclip, FileText, Link, Zap, Star } from 'lucide-react';
import { format } from 'date-fns';
import { StartupData, Milestone } from '../../types';
import { YearSegment } from './YearSegment';
import { MilestoneIcon } from './MilestoneIcon';
import { YEAR_THEMES } from './constants';

interface TimelinePanelProps {
    data: StartupData;
    expandedYear: number | null;
    setExpandedYear: (year: number | null) => void;
    onEditMilestone: (milestone: Milestone) => void;
    onAddMilestone: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
    data,
    expandedYear,
    setExpandedYear,
    onEditMilestone,
    onAddMilestone
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const milestonesByYear = useMemo(() => {
        const groups: Record<number, Milestone[]> = {};
        const sorted = [...(data.milestones || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach(m => {
            const year = new Date(m.date).getFullYear();
            if (!groups[year]) groups[year] = [];
            groups[year].push(m);
        });
        return groups;
    }, [data.milestones]);

    const sortedYears = Object.keys(milestonesByYear).map(Number).sort((a, b) => a - b);

    // Auto-expand latest year on mount (logic was in parent, but maybe fine here or controlled by parent)
    // Parent controls it via expandedYear prop.

    return (
        <div className="w-[55%] bg-[#F9F8F4] relative flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-end z-10">
                <div>
                    <h2 className="font-serif text-3xl font-bold text-stone-900">Timeline</h2>
                    <p className="text-stone-500 text-sm">Visual history of your execution.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold focus:outline-none focus:ring-1 focus:ring-nobel-gold w-48 transition-all"
                        />
                    </div>
                    <button className="p-2 bg-white border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:border-stone-300 transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onAddMilestone}
                        className="pl-3 pr-4 py-2 bg-nobel-gold text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#A38035] transition-colors shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                </div>
            </div>

            {/* Timeline Scroll Area */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden custom-scrollbar relative px-8 pb-12 pt-4 cursor-grab active:cursor-grabbing">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6d3d1; border-radius: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                `}</style>
                <div className="flex h-full items-start min-w-max pt-10">
                    {/* Start Node */}
                    <div className="flex flex-col items-center justify-center mr-8 mt-4 opacity-50">
                        <div className="w-3 h-3 rounded-full bg-stone-300 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Inception</span>
                    </div>

                    {sortedYears.map((year, index) => {
                        const milestones = milestonesByYear[year];
                        const strategy = milestones.find(m => m.theme)?.theme || 'foundation';
                        const theme = YEAR_THEMES[strategy] || YEAR_THEMES['foundation'];
                        const isExpanded = expandedYear === year;

                        // Filter by search
                        const displayMilestones = searchTerm
                            ? milestones.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()))
                            : milestones;

                        if (searchTerm && displayMilestones.length === 0) return null;

                        return (
                            <YearSegment
                                key={year}
                                year={year}
                                color={theme.color}
                                isExpanded={isExpanded}
                                onToggle={() => setExpandedYear(isExpanded ? null : year)}
                            >
                                <div className="absolute top-20 left-0 w-full px-4 space-y-4">
                                    {/* Timeline Line */}
                                    <div className="absolute top-8 left-0 w-full h-px bg-stone-200 -z-10 border-t border-dashed border-stone-300" />

                                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-start pl-2">
                                        {displayMilestones.map((m, i) => (
                                            <div
                                                key={m.id}
                                                onClick={(e) => { e.stopPropagation(); onEditMilestone(m); }}
                                                className={`
                                                    relative group cursor-pointer transition-all duration-300
                                                    ${isExpanded ? 'w-64 opacity-100 translate-y-0' : 'w-10 opacity-60 hover:opacity-100 hover:-translate-y-2'}
                                                `}
                                            >
                                                {/* Node on Timeline */}
                                                {!isExpanded && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <MilestoneIcon type={m.type} isFeatured={m.isFeatured || false} size="small" />
                                                        <div className="h-4 w-px bg-stone-300" />
                                                        <span className="text-[9px] font-bold text-stone-500 -rotate-45 origin-top-left whitespace-nowrap mt-2">{format(new Date(m.date), 'MMM d, yyyy')}</span>
                                                    </div>
                                                )}

                                                {/* Expanded Card */}
                                                {isExpanded && (
                                                    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm group-hover:shadow-xl group-hover:border-nobel-gold/50 transition-all text-left relative overflow-hidden">
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${m.tractionType === 'Traction' ? 'bg-emerald-500' : m.tractionType === 'Pivot' ? 'bg-red-500' : 'bg-stone-200'}`} />

                                                        <div className="flex justify-between items-start mb-3 pl-2">
                                                            <MilestoneIcon type={m.type} isFeatured={m.isFeatured || false} />
                                                            <span className="text-[9px] font-bold text-stone-400">{format(new Date(m.date), 'MMM d, yyyy')}</span>
                                                        </div>

                                                        <h4 className="font-serif font-bold text-lg text-stone-900 leading-tight mb-2 pl-2">
                                                            {m.title}
                                                        </h4>

                                                        <div className="pl-2 mb-3 flex flex-wrap gap-1">
                                                            {m.tags?.includes('AI Assisted') && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-nobel-gold text-white px-2 py-0.5 rounded border border-nobel-gold font-bold uppercase tracking-wider">
                                                                    <Zap className="w-3 h-3 fill-current" /> AI Assisted
                                                                </span>
                                                            )}
                                                            {m.isFeatured && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 font-bold uppercase tracking-wider">
                                                                    <Star className="w-3 h-3 fill-current" /> Featured
                                                                </span>
                                                            )}
                                                        </div>

                                                        {m.imageUrl && (
                                                            <img src={m.imageUrl} alt="Asset" className="w-full h-32 object-contain bg-stone-50 rounded-lg mb-4 border border-stone-100 ml-2" />
                                                        )}

                                                        {m.documents && m.documents.length > 0 && (
                                                            <div className="mb-4 pl-2">
                                                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1">
                                                                    <Paperclip className="w-3 h-3" /> Reference Documents
                                                                </h5>
                                                                <div className="space-y-1">
                                                                    {m.documents.map(doc => (
                                                                        <a
                                                                            key={doc.id}
                                                                            href={doc.url || '#'}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 p-2 rounded border border-stone-100 bg-stone-50 hover:bg-stone-100 transition-colors text-xs text-stone-700"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            {doc.type === 'Legal' ? <FileText className="w-3 h-3 text-stone-500" /> : <Link className="w-3 h-3 text-stone-500" />}
                                                                            <span className="truncate flex-1">{doc.name}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <p className="text-sm text-stone-600 leading-relaxed font-light pl-2">
                                                            {m.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </YearSegment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
