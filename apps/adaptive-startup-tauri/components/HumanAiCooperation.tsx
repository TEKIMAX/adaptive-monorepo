
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAIGenerateCooperationReport } from '../hooks/useAI';
import { useCreateDocument } from '../hooks/useCreate';
import { api } from "../convex/_generated/api";
import { StartupData, AISettings, ViewState, PageAccess } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Loader2, User, Bot, RefreshCw, ShieldCheck, ChevronRight, ChevronLeft, Play, Activity, FileText, X } from 'lucide-react';
import { Id } from '../convex/_generated/dataModel';
import { Logo } from './Logo';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { SaveToFilesDialog } from './nobel_chat/SaveToFilesDialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DotPatternBackground from './DotPatternBackground';

interface HumanAiCooperationProps {
    data: StartupData;
    settings: AISettings;
    allProjects: StartupData[];
    onSwitchProject: (id: string) => void;
    onNewProject: () => void;
    onNavigate: (view: ViewState) => void;
    currentView: ViewState;
    allowedPages: PageAccess[];
    currentUserRole?: string;
}

export const HumanAiCooperation: React.FC<HumanAiCooperationProps> = ({
    data,
    settings,
    allProjects,
    onSwitchProject,
    onNewProject,
    onNavigate,
    currentView,
    allowedPages,
    currentUserRole
}) => {
    const stats = useQuery(api.analytics.getCooperationStats, { projectId: data.id as Id<"projects"> });
    const lastReport = useQuery(api.analytics.getLatestReport, { projectId: data.id as Id<"projects"> });
    const generateReport = useAIGenerateCooperationReport();
    const saveReport = useMutation(api.analytics.saveReport);
    const createDocument = useCreateDocument();

    const [report, setReport] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    // Load last report when it arrives
    useEffect(() => {
        if (lastReport) {
            setReport(lastReport.content);
        } else {
            setReport("");
        }
    }, [lastReport, data.id]);

    const handleGenerate = async () => {
        if (!stats) return;
        setIsGenerating(true);
        setIsReportOpen(true); // Open the report panel when generating
        try {
            const result = await generateReport({
                startupData: data,
                humanCount: stats.humanCount,
                aiCount: stats.aiCount,
                tagCounts: stats.tagCounts,
                featureUsage: stats.featureUsage,
                modelName: settings.modelName
            });
            setReport(result);

            // Persist to Convex
            await saveReport({
                projectId: data.id as Id<"projects">,
                content: result,
                stats: {
                    humanRatio: stats.humanRatio,
                    aiRatio: stats.aiRatio,
                    humanCount: stats.humanCount,
                    aiCount: stats.aiCount
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveToDocs = async (folderId: string | null, filename: string) => {
        if (!report) return;

        try {
            await createDocument({
                projectId: data.id as Id<"projects">,
                folderId: folderId ? folderId as Id<"folders"> : undefined,
                title: filename.endsWith('.md') ? filename : `${filename}.md`,
                content: report,
                type: 'doc'
            });
            toast.success("Report saved to documents");
            setIsSaveDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save report");
        }
    };

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-nobel-cream">
                <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
            </div>
        );
    }

    const humanPercent = stats.humanRatio;
    const aiPercent = stats.aiRatio;

    return (
        <div className="h-screen flex bg-nobel-cream relative overflow-hidden">
            {/* LEFT SIDE: HERO IMAGE (30%) - Hidden when report is open */}
            <AnimatePresence>
                {!isReportOpen && (
                    <motion.div
                        initial={{ width: '30%', opacity: 1 }}
                        animate={{ width: '30%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20"
                    >
                        {/* Background Image */}
                        <img
                            src="/ProfessionalDiscussion.png"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                            alt="Human AI Cooperation Hero"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-900/80" />

                        {/* Top Logo */}
                        <div className="absolute top-12 left-12 z-30">
                            <Logo imageClassName="h-10 w-auto brightness-0 invert" />
                        </div>

                        {/* Bottom Overlay Content */}
                        <div className="absolute inset-x-0 bottom-0 p-12 space-y-6 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pt-32">
                            <div className="space-y-4">
                                <h2 className="text-white text-4xl font-serif font-bold leading-tight">
                                    Human-AI <br />
                                    <span className="text-nobel-gold italic underline underline-offset-8 decoration-white/20">Cooperation.</span>
                                </h2>
                                <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                                <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-medium">
                                    Monitor your dependency ratio to ensure you remain the <strong>pilot</strong>. We believe in Human-Centered AI.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RIGHT SIDE: MAIN CONTENT */}
            <motion.div
                animate={{ width: isReportOpen ? '100%' : '70%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="h-full flex flex-col relative z-10"
            >
                <DotPatternBackground color="#a8a29e" />

                {/* Header */}
                <header className="px-10 py-6 flex items-center justify-between relative z-30">
                    <div className="flex items-center gap-6">
                        <TabNavigation currentView={currentView} onNavigate={onNavigate} allowedPages={allowedPages} mode="light" currentUserRole={currentUserRole} />
                    </div>
                    {report && !isReportOpen && (
                        <button
                            onClick={() => setIsReportOpen(true)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-2 border border-emerald-500 shadow-lg active:scale-95"
                        >
                            <FileText className="w-4 h-4" /> View Report
                        </button>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-grow flex relative z-10 overflow-hidden">
                    {/* Visualization Panel */}
                    <div className={`${isReportOpen ? 'w-1/2' : 'w-full'} flex flex-col items-center justify-center px-16 transition-all duration-300`}>
                        <div className="max-w-2xl w-full space-y-8">
                            {!isReportOpen && (
                                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-6">Human-AI<br />Cooperation</h1>
                                    <p className="text-stone-500 text-lg max-w-2xl font-light leading-relaxed">
                                        We believe in <strong>Human-Centered AI</strong>. Monitor your dependency ratio to ensure you remain the pilot.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="relative z-10 flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-stone-900 text-white rounded-lg">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-stone-900">Human Insight</h3>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Core Value</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-stone-900">{humanPercent.toFixed(1)}%</div>
                                    </div>
                                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-stone-900 rounded-full transition-all duration-1000 ease-out" style={{ width: `${humanPercent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                                        <span>{stats.humanCount} Actions</span>
                                        <span>Target: &gt;70%</span>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="relative z-10 flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-nobel-gold/10 text-nobel-gold rounded-lg">
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-xl text-stone-600">AI Assisted</h3>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Co-Pilot Support</span>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-nobel-gold">{aiPercent.toFixed(1)}%</div>
                                    </div>
                                    <div className="h-3 bg-stone-100 rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-nobel-gold rounded-full transition-all duration-1000 ease-out" style={{ width: `${aiPercent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                                        <span>{stats.aiCount} Actions</span>
                                        <span>Target: &lt;30%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            {!report && (
                                <div className="flex justify-center pt-8">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="bg-stone-900 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-nobel-gold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                        {isGenerating ? 'Analyzing...' : 'Generate Analysis'}
                                    </button>
                                </div>
                            )}

                            {/* Stats Grid - Only show when report is not open */}
                            {!isReportOpen && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-lg">
                                        <h4 className="font-serif text-lg text-white mb-4">Most Used Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(stats.tagCounts).sort(([, a]: [string, any], [, b]: [string, any]) => b - a).slice(0, 10).map(([tag, count]: [string, any]) => (
                                                <span key={tag} className="px-2 py-1 bg-stone-800 border border-stone-700 rounded text-xs text-stone-300 font-medium">
                                                    {tag} <span className="text-stone-500 ml-1">({count})</span>
                                                </span>
                                            ))}
                                            {Object.keys(stats.tagCounts).length === 0 && <span className="text-stone-500 text-sm italic">No data yet.</span>}
                                        </div>
                                    </div>

                                    <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-lg">
                                        <h4 className="font-serif text-lg text-white mb-4">AI Dependency by Feature</h4>
                                        <div className="space-y-3">
                                            {Object.entries(stats.featureUsage).map(([feature, counts]: [string, any]) => {
                                                const total = (counts.human || 0) + (counts.ai || 0);
                                                const aiPct = total > 0 ? (counts.ai / total) * 100 : 0;
                                                return (
                                                    <div key={feature} className="flex items-center justify-between text-sm">
                                                        <span className="text-stone-300 font-medium">{feature}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                                                                <div className={`h-full ${aiPct > 50 ? 'bg-red-500' : 'bg-nobel-gold'}`} style={{ width: `${aiPct}%` }}></div>
                                                            </div>
                                                            <span className={`text-xs font-bold ${aiPct > 50 ? 'text-red-400' : 'text-stone-500'}`}>{aiPct.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Toggle Button - Only show when report panel is closed and report exists */}
                {!isReportOpen && report && (
                    <button
                        onClick={() => setIsReportOpen(true)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 text-white rounded-l-full hover:bg-emerald-600 transition-all z-50 shadow-lg group"
                        title="Open Report"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
            </motion.div>

            {/* Report Panel - Fixed overlay taking full height */}
            <AnimatePresence>
                {isReportOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-1/2 bg-white border-l border-stone-200 overflow-hidden flex flex-col z-50 shadow-2xl"
                    >
                        {/* Report Header */}
                        <div className="px-8 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 rounded-full text-emerald-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-xl text-stone-900">Cooperation Report</h2>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Strategic Balance Analysis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {report && (
                                    <>
                                        <button
                                            onClick={() => setIsSaveDialogOpen(true)}
                                            className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                            title="Save to Documents"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                            title="Refresh Analysis"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsReportOpen(false)}
                                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                    title="Close Report"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="flex-1 overflow-y-auto px-8 py-4">
                            {report ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <MarkdownRenderer content={report} />
                                    <div className="mt-8 p-4 bg-stone-900 rounded-lg text-center">
                                        <p className="text-stone-400 font-mono text-xs italic">
                                            "The assistant should always be lower than the human edited."
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center text-stone-400">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                        <Activity className="w-8 h-8 opacity-20" />
                                    </div>
                                    <h3 className="font-serif text-xl text-stone-900 mb-3">Analyze Your Workflow</h3>
                                    <p className="max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                                        Use AI to detect if you are leaning too heavily on automation. Keeping the human touch is vital for founder success.
                                    </p>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="bg-stone-900 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-nobel-gold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                        {isGenerating ? 'Analyzing...' : 'Generate Analysis'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SaveToFilesDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                projectId={data.id as Id<"projects">}
                onSave={handleSaveToDocs}
                title="Save Cooperation Report"
            />
        </div>
    );
};
