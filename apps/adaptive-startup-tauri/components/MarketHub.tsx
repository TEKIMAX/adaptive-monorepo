import React from 'react';
import { ViewState, StartupData, AISettings, RolePermissions, CanvasSection, calculateARPU } from '../types';
import {
    Search, Calculator, ArrowRight, TrendingUp, Target,
    Users, BarChart3, Info, MessageSquare, Swords, LayoutTemplate, DollarSign,
    ChevronLeft, ChevronRight, Lock, CheckCircle2, AlertCircle, Sliders
} from 'lucide-react';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';
import DotPatternBackground from './DotPatternBackground';
import SizingConfigSheet from './SizingConfigSheet';

interface MarketHubProps {
    data: StartupData;
    allProjects: StartupData[];
    onUpdateProject: (updater: (project: StartupData) => StartupData) => void;
    onSwitchProject: (id: string) => void;
    onNewProject: () => void;
    onNavigate: (view: ViewState) => void;
    currentView: ViewState;
    settings: AISettings;
    allowedPages?: string[];
    permissions?: RolePermissions;
}

const STACK_STEPS = [
    {
        id: 'RESEARCH',
        title: 'Market Intelligence',
        subtitle: 'Deep Market Research',
        description: 'Generate AI-powered reports and analyze industry trends to establish your top-down foundation.',
        icon: Search,
        view: 'MARKET_RESEARCH' as ViewState,
        cta: 'Research',
        info: 'Establish the broader context of your industry.',
        color: '#f17a35'
    },
    {
        id: 'CUSTOMERS',
        title: 'Customer Discovery',
        subtitle: 'ARPU & Willingness to Pay',
        description: 'Validate your pricing and ARPU through direct customer interviews and surveys.',
        icon: Users,
        view: 'CUSTOMERS' as ViewState,
        cta: 'Survey',
        info: 'Real data from real people beats assumptions every time.',
        color: '#7c007c'
    },
    {
        id: 'COMPETITORS',
        title: 'Differential Edge',
        subtitle: 'Competitive Analysis',
        description: 'Map out your competitors and define your unique value proposition in the matrix.',
        icon: Swords,
        view: 'COMPETITIVE_MATRIX' as ViewState,
        cta: 'Analyze',
        info: 'Understand where you fit in the existing landscape.',
        color: '#3b82f6'
    },
    {
        id: 'CANVAS',
        title: 'Strategic Foundation',
        subtitle: 'Lean Canvas Segments',
        description: 'Define your target segments and problem statements to anchor your sizing logic.',
        icon: LayoutTemplate,
        view: 'CANVAS' as ViewState,
        cta: 'Refine',
        info: 'Your segments are the primary multipliers in the formula.',
        color: '#10b981'
    },
    {
        id: 'SIZING',
        title: 'Bottom up market size',
        subtitle: 'Bottom-Up Sizing',
        description: 'Calculate TAM, SAM, and SOM based on your validated customer data and segments.',
        icon: Calculator,
        view: 'BOTTOM_UP_SIZING' as ViewState,
        cta: 'Calculate',
        info: 'The final step to a pitch-perfect market model.',
        color: '#d4af37'
    }
];

const MarketHub: React.FC<MarketHubProps> = ({
    data,
    allProjects,
    onUpdateProject,
    onSwitchProject,
    onNewProject,
    onNavigate,
    currentView,
    settings,
    allowedPages,
    permissions
}) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isStatusExpanded, setIsStatusExpanded] = React.useState(false);
    const [isLearnSheetOpen, setIsLearnSheetOpen] = React.useState(false);
    const [isConfigOpen, setIsConfigOpen] = React.useState(false);

    // Market Config State
    const [marketConfig, setMarketConfig] = React.useState({
        samPercentage: data.marketConfig?.samPercentage || 30,
        somPercentage: data.marketConfig?.somPercentage || 5,
        naicsCode: data.marketConfig?.naicsCode,
        naicsTitle: data.marketConfig?.naicsTitle,
        geography: data.marketConfig?.geography || 'US',
        selectedSegments: data.marketConfig?.selectedSegments || [],
        yearRange: data.marketConfig?.yearRange
    });

    // Sync state with data prop
    React.useEffect(() => {
        if (data.marketConfig) {
            setMarketConfig({
                samPercentage: data.marketConfig.samPercentage ?? 30,
                somPercentage: data.marketConfig.somPercentage ?? 5,
                naicsCode: data.marketConfig.naicsCode,
                naicsTitle: data.marketConfig.naicsTitle,
                geography: data.marketConfig.geography ?? 'US',
                selectedSegments: data.marketConfig.selectedSegments ?? [],
                yearRange: data.marketConfig.yearRange
            });
        }
    }, [data.marketConfig]);

    const handleConfigChange = (newConfig: typeof marketConfig) => {
        setMarketConfig(newConfig);
        onUpdateProject(project => ({
            ...project,
            marketConfig: newConfig
        }));
    };

    const next = () => setCurrentIndex((prev) => (prev + 1) % STACK_STEPS.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + STACK_STEPS.length) % STACK_STEPS.length);

    // Prerequisites logic
    const hasInterviews = data.customerInterviews && data.customerInterviews.length > 0;
    const interviewCount = data.customerInterviews?.length || 0;
    const hasSegments = !!data.canvas?.["Customer Segments"];
    const hasProblem = !!data.canvas?.["Problem"];
    const competitorCount = data.competitorAnalysis?.competitors?.length || 0;
    const isBottomUpDisabled = !hasInterviews || !hasSegments || !hasProblem;

    const getPrerequisitesMessage = () => {
        if (!hasInterviews) return "Customer Interviews";
        if (!hasSegments) return "Customer Segments";
        if (!hasProblem) return "Problem Statement";
        return "";
    };

    const getAdviceStatus = () => {
        // 1. Research (Always Green - Exploration phase)
        if (currentIndex === 0) return 'green';

        // 2. Customer Discovery
        if (currentIndex === 1) {
            if (interviewCount === 0) return 'red';
            if (interviewCount < 5) return 'yellow';
            return 'green';
        }

        // 3. Competitors
        if (currentIndex === 2) {
            if (competitorCount === 0) return 'red';
            if (competitorCount < 3) return 'yellow';
            return 'green';
        }

        // 4. Canvas
        if (currentIndex === 3) {
            if (!hasSegments || !hasProblem) return 'red';
            return 'green';
        }

        // 5. Sizing
        if (currentIndex === 4) {
            if (isBottomUpDisabled) return 'red';
            return 'green';
        }

        return 'green';
    };

    const getDynamicAdvice = () => {
        // 1. Research
        if (currentIndex === 0) {
            return "Start by generating a broad market report to understand the macro drivers before diving into customer details.";
        }
        // 2. Customer Discovery
        if (currentIndex === 1) {
            if (interviewCount === 0) return "No interviews logged. We recommend at least 5-10 validated conversations to minimize bias.";
            if (interviewCount < 5) return `You have ${interviewCount} interviews. Aim for 10+ to detect consistent patterns.`;
            return "Excellent data volume. >10 interviews provides a strong bottom-up signal.";
        }
        // 3. Competitors
        if (currentIndex === 2) {
            if (competitorCount === 0) return "No competitors identified. Find at least 3 direct competitors to triangulate your positioning.";
            if (competitorCount < 3) return "Expand your analysis. Identifying more competitors helps refine your differentiation strategy.";
            return "Strong competitive landscape mapped. Ensure you've identified your unique value proposition against them.";
        }
        // 4. Canvas
        if (currentIndex === 3) {
            if (!hasSegments) return "Define your Customer Segments to unlock the sizing engine.";
            if (!hasProblem) return "Clearly articulate the Problem Statement for your segments.";
            return "Ensure your Problem Statement aligns perfectly with your identified segments.";
        }
        // 5. Sizing (Engine)
        if (currentIndex === 4) {
            if (isBottomUpDisabled) {
                return `Prerequisites missing: ${getPrerequisitesMessage()}. The engine requires this data to calibrate.`;
            }
            return "As your customer discovery expands and segments refine, re-run the market engine to maintain a high-resolution market trajectory.";
        }
        return "";
    };

    const statusColor = getAdviceStatus();
    const getStatusColorClasses = (status: string) => {
        switch (status) {
            case 'red': return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
            case 'yellow': return 'bg-yellow-400 shadow-[0_0_8px_#facc15]';
            case 'green': return 'bg-green-500 shadow-[0_0_8px_#22c55e]';
            default: return 'bg-stone-300';
        }
    };

    return (
        <div className="h-screen flex bg-nobel-cream relative overflow-hidden">
            {/* LEFT SIDE: HERO (30%) */}
            <div className="w-[30%] h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20">
                {/* Background Image */}
                <img
                    src="/images/working_women.png"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                    alt="Market Research Hero"
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
                            Market <br />
                            <span className="text-nobel-gold italic underline underline-offset-8 decoration-white/20">Research.</span>
                        </h2>
                        <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                        <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-medium">
                            Complete the intelligence modules to unlock the <strong>Bottom-Up Calculation</strong> engine. Precision modeling requires validated inputs.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: CARDS (70%) */}
            <div className="w-[70%] h-full flex flex-col relative z-10">
                <DotPatternBackground color="#a8a29e" />

                <header className="px-10 py-6 flex items-center justify-between relative z-30">
                    <div className="flex items-center gap-6">
                        <Logo imageClassName="h-8 w-auto" />
                        <div className="w-px h-6 bg-stone-200" />
                        <TabNavigation currentView={currentView} onNavigate={onNavigate} allowedPages={allowedPages} mode="light" />
                    </div>
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors flex items-center gap-2 border border-stone-800 shadow-lg active:scale-95"
                    >
                        <Sliders className="w-4 h-4" /> Configure
                    </button>
                </header>

                <main className="flex-grow flex flex-col items-center justify-center px-16 relative z-10">
                    <div className="max-w-4xl w-full flex flex-col items-center gap-12">
                        {/* Engine Status / Advice Accordion */}
                        <div className={`w-full max-w-2xl bg-white backdrop-blur-sm border rounded-[2rem] overflow-hidden transition-all duration-300 ${isStatusExpanded ? 'border-stone-900 shadow-2xl' : 'border-stone-200 shadow-sm hover:shadow-md'}`}>
                            <button
                                onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                                className="w-full px-10 py-5 flex items-center justify-between group bg-white"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${getStatusColorClasses(statusColor)}`} />
                                    <span className="text-[10px] text-stone-500 uppercase tracking-[0.4em] font-bold">Strategic Advice</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isStatusExpanded ? 'rotate-90 text-stone-900' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isStatusExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-stone-900"
                                    >
                                        <div className="px-10 pb-8 pt-4">
                                            <p className="text-white text-sm font-medium leading-relaxed italic">
                                                "{getDynamicAdvice()}"
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Description & Help */}
                        <div className="w-full max-w-2xl flex items-start justify-between gap-8 px-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                            <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-sm">
                                To generate a precise market research report, ensure you have validated <strong>Customer Segments</strong> and conducted at least <strong>5 interviews</strong>.
                            </p>
                            <button
                                onClick={() => setIsLearnSheetOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-nobel-gold border border-nobel-gold rounded-full shadow-md hover:bg-yellow-600 hover:border-yellow-600 transition-colors group"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Bottom-up Approach</span>
                                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30">
                                    <ArrowRight className="w-2.5 h-2.5 text-white transition-colors" />
                                </div>
                            </button>
                        </div>

                        {/* Sequential Stack */}
                        <div className="relative h-[480px] w-full flex items-center justify-center perspective-1000">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {STACK_STEPS.map((step, idx) => {
                                    const offset = idx - currentIndex;
                                    const isVisible = offset >= 0 && offset <= 2;
                                    if (!isVisible) return null;

                                    return (
                                        <motion.div
                                            key={step.id}
                                            layout
                                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                            animate={{
                                                opacity: 1 - offset * 0.4,
                                                scale: 1 - offset * 0.05,
                                                y: offset * -20,
                                                zIndex: STACK_STEPS.length - idx,
                                                filter: `blur(${offset * 1}px)`
                                            }}
                                            exit={{
                                                opacity: 0,
                                                x: -150,
                                                rotate: -5,
                                                transition: { duration: 0.3 }
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 25
                                            }}
                                            className={`absolute w-full max-w-2xl bg-white border rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col ${offset === 0 ? 'ring-1 ring-stone-900/5' : ''} ${idx === 4 ? 'border-nobel-gold/50 shadow-nobel-gold/10' : 'border-stone-200'}`}
                                            style={{ pointerEvents: offset === 0 ? 'auto' : 'none' }}
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-bold font-serif shadow-sm transition-colors ${idx === 4 && !isBottomUpDisabled ? 'bg-green-50 border-green-200 text-green-600' : 'bg-nobel-cream border-stone-200 text-nobel-gold'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            {idx === 4 && !isBottomUpDisabled && (
                                                                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-green-100">
                                                                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                                    Data Ready
                                                                </div>
                                                            )}
                                                            {idx === 4 && isBottomUpDisabled && (
                                                                <div className="flex items-center gap-1.5 bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-stone-200">
                                                                    <Lock className="w-2.5 h-2.5" />
                                                                    Locked
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-bold text-stone-900 tracking-tight">{step.title}</h3>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <button
                                                        onClick={() => onNavigate(step.view)}
                                                        disabled={idx === 4 && isBottomUpDisabled}
                                                        className={`px-8 py-3 rounded-xl font-bold uppercase tracking-[0.1em] text-[10px] transition-all flex items-center gap-2.5 ${idx === 4
                                                            ? isBottomUpDisabled
                                                                ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20 active:scale-95 border border-green-500'
                                                            : 'bg-stone-900 text-white hover:bg-nobel-gold shadow-lg shadow-stone-900/10 active:scale-95'
                                                            }`}
                                                    >
                                                        {idx === 4 && isBottomUpDisabled ? <Lock className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                                        {step.cta}
                                                    </button>
                                                    {idx === 4 && isBottomUpDisabled && (
                                                        <span className="text-[9px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-in fade-in slide-in-from-right-2">
                                                            Missing: {getPrerequisitesMessage()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-grow w-full bg-nobel-cream/50 rounded-2xl border border-stone-100 p-8 flex flex-col relative group overflow-hidden">
                                                <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                                                    <div className="w-20 h-20 rounded-3xl bg-white border border-stone-200 flex items-center justify-center text-nobel-gold mb-6 shadow-sm">
                                                        <step.icon className="w-10 h-10" />
                                                    </div>

                                                    <div className="space-y-3 max-w-sm">
                                                        <h4 className="text-lg font-bold text-stone-900 font-serif">{step.subtitle}</h4>

                                                        {step.id === 'RESEARCH' && (
                                                            data.market.reportContent ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Data Available
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                                                    <AlertCircle className="w-3 h-3" /> Data Missing
                                                                </div>
                                                            )
                                                        )}

                                                        {step.id === 'CUSTOMERS' && (
                                                            hasInterviews ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> {interviewCount} Interviews
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                                                    <AlertCircle className="w-3 h-3" /> Data Missing
                                                                </div>
                                                            )
                                                        )}

                                                        {step.id === 'COMPETITORS' && (
                                                            competitorCount > 0 ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> {competitorCount} Competitors
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                                                    <AlertCircle className="w-3 h-3" /> Data Missing
                                                                </div>
                                                            )
                                                        )}

                                                        {step.id === 'CANVAS' && (
                                                            hasSegments ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Segments Defined
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                                                    <AlertCircle className="w-3 h-3" /> Data Missing
                                                                </div>
                                                            )
                                                        )}

                                                        {step.id === 'SIZING' && (
                                                            !isBottomUpDisabled ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Ready to Calculate
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                                                                    <AlertCircle className="w-3 h-3" /> Data Missing
                                                                </div>
                                                            )
                                                        )}

                                                        <p className="text-stone-500 text-sm leading-relaxed">
                                                            {step.info}
                                                        </p>
                                                    </div>
                                                </div>


                                            </div>

                                            <div className="mt-8 text-left">
                                                <p className="text-stone-500 text-sm font-medium leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex items-center gap-12 pt-8">
                            <button
                                onClick={prev}
                                className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-nobel-cream transition-all active:scale-90 text-stone-400 hover:text-stone-900 group"
                            >
                                <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
                            </button>

                            <div className="flex gap-3">
                                {STACK_STEPS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`h-1.5 transition-all duration-500 rounded-full ${currentIndex === idx ? 'w-10 bg-stone-900' : 'w-1.5 bg-stone-200 hover:bg-stone-300'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={next}
                                className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-nobel-cream transition-all active:scale-90 text-stone-400 hover:text-stone-900 group"
                            >
                                <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
            {/* Learn Sheet */}
            <AnimatePresence>
                {isLearnSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsLearnSheetOpen(false)}
                            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 border-l border-stone-100 flex flex-col"
                        >
                            <div className="p-8 border-b border-stone-100 flex items-start justify-between bg-stone-50/50">
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Bottom-Up Market Sizing</h2>
                                    <p className="text-sm text-stone-500">Why precision beats estimation.</p>
                                </div>
                                <button
                                    onClick={() => setIsLearnSheetOpen(false)}
                                    className="p-2 -mr-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors"
                                >
                                    <CheckCircle2 className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <section>
                                    <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-900 font-serif">1</div>
                                        The Philosophy
                                    </h3>
                                    <p className="text-sm text-stone-600 leading-relaxed mb-4">
                                        Most founders guess their market size by looking at industry reports ("The cloud market is $500B"). This is <strong className="text-stone-900">Top-Down</strong> sizing, and investors rarely trust it.
                                    </p>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        <strong className="text-stone-900">Bottom-Up</strong> sizing builds your market value from the ground up:
                                        <br />
                                        <em>(Number of Customers) × (Price per Customer)</em>
                                    </p>
                                </section>

                                <div className="h-px bg-stone-100" />

                                <section>
                                    <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-nobel-gold/10 flex items-center justify-center text-nobel-gold font-serif">2</div>
                                        The Components
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Addressable Market</span>
                                            <div className="text-lg font-bold text-stone-900 mb-1">TAM</div>
                                            <p className="text-xs text-stone-500">If every possible customer in the world bought your product.</p>
                                        </div>
                                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Serviceable Available Market</span>
                                            <div className="text-lg font-bold text-stone-900 mb-1">SAM</div>
                                            <p className="text-xs text-stone-500">The segment of the TAM that fits your geographical and technological reach.</p>
                                        </div>
                                        <div className="bg-nobel-gold/5 p-4 rounded-xl border border-nobel-gold/20">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-nobel-gold">Serviceable Obtainable Market</span>
                                            <div className="text-lg font-bold text-stone-900 mb-1">SOM</div>
                                            <p className="text-xs text-stone-600">The portion of SAM you can realistically capture within 3-5 years.</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="h-px bg-stone-100" />

                                <section>
                                    <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700 font-serif">3</div>
                                        Why We Lock It
                                    </h3>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        To calculate SOM accurately, you need a validated <strong>Price Point</strong> (from Customer Discovery) and a clear <strong>Customer Profile</strong> (from Segments). Without these, your market size is just a guess.
                                    </p>
                                </section>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <SizingConfigSheet
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                config={marketConfig}
                onConfigChange={handleConfigChange}
                canvasSegments={data.canvas?.[CanvasSection.CUSTOMER_SEGMENTS] ? data.canvas[CanvasSection.CUSTOMER_SEGMENTS].split(/\n|,|•/).map((s: string) => s.trim()).filter(Boolean).filter(s => !s.includes('![AI Assisted]')) : []}
                topDownData={data.market}
                bottomUpData={data.bottomUpSizing}
                arpu={calculateARPU(data.revenueModel)}
                confidenceData={undefined} // Will be fetched via API
            />
        </div>
    );
};

export default MarketHub;
