// GoalSetting component with auto‑sync for automatic Key Results
import { toast } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import { StartupData, AISettings, Goal, KeyResult } from "../types";
import { Plus, Loader2, Trash2, LayoutList, PieChart, ChevronRight, Cloud, X, RefreshCw, Info, Target, Archive, Clock, Check, Sparkles, AlertTriangle } from "lucide-react";
import TabNavigation from "./TabNavigation";
import { Logo } from "./Logo";
import { generateOKRProposal } from "../services/geminiService";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCreateGoal, useCreateKeyResult } from "../hooks/useCreate";
import { useUpdateGoal, useUpdateKeyResult, useSyncKeyResult } from "../hooks/useUpdate";
import { useDeleteGoal, useDeleteKeyResult } from "../hooks/useDelete";

interface GoalSettingProps {
    data: StartupData;
    allProjects: StartupData[];
    onUpdateProject: (updater: (project: StartupData) => StartupData) => void;
    onSwitchProject: (id: string) => void;
    onNewProject: () => void;
    onNavigate: (view: any) => void;
    currentView: any;
    settings: AISettings;
    allowedPages?: string[];
}

const GoalSetting: React.FC<GoalSettingProps> = ({
    data,
    allProjects,
    onUpdateProject,
    onSwitchProject,
    onNewProject,
    onNavigate,
    currentView,
    settings,
    allowedPages,
}) => {
    // Mutations
    const createGoal = useCreateGoal();
    const updateGoalMutation = useUpdateGoal();
    const deleteGoalMutation = useDeleteGoal();
    const createKR = useCreateKeyResult();
    const updateKR = useUpdateKeyResult();
    const deleteKR = useDeleteKeyResult();
    const syncKR = useSyncKeyResult();

    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'overview' | 'kanban' | 'history'>('overview');
    const [detailViewMode, setDetailViewMode] = useState<'list' | 'board'>('list');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showAiProposal, setShowAiProposal] = useState(false);
    const [aiProposal, setAiProposal] = useState<{ rationale: string, goals: Goal[] } | null>(null);
    const [showContextReview, setShowContextReview] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

    // Local state for smooth input performance
    const [localGoalTitle, setLocalGoalTitle] = useState("");
    const [localGoalDescription, setLocalGoalDescription] = useState("");
    const [localKRData, setLocalKRData] = useState<Record<string, { description?: string, target?: any, current?: any, unit?: string }>>({});



    const lastEditingId = useRef<string | null>(null);

    // Sync local state when editingGoalId changes
    useEffect(() => {
        if (!editingGoalId) {
            setLocalGoalTitle("");
            setLocalGoalDescription("");
            setLocalKRData({});
            lastEditingId.current = null;
            return;
        }

        const goal = data.goals?.find(g => g.id === editingGoalId);
        if (!goal) return;

        if (editingGoalId !== lastEditingId.current) {
            // Hard reset when switching goals
            setLocalGoalTitle(goal.title || "");
            setLocalGoalDescription(goal.description || "");
            const krData: Record<string, any> = {};
            (goal.keyResults || []).forEach(kr => {
                krData[kr.id] = {
                    description: kr.description,
                    target: kr.target,
                    current: kr.current,
                    unit: kr.unit
                };
            });
            setLocalKRData(krData);
            lastEditingId.current = editingGoalId;
        } else {
            // Only add missing KRs to avoid overwriting typed content
            setLocalKRData(prev => {
                const newData = { ...prev };
                let changed = false;
                (goal.keyResults || []).forEach(kr => {
                    if (!newData[kr.id]) {
                        newData[kr.id] = {
                            description: kr.description,
                            target: kr.target,
                            current: kr.current,
                            unit: kr.unit
                        };
                        changed = true;
                    }
                });
                return changed ? newData : prev;
            });
        }
    }, [editingGoalId, data.goals]);

    // Auto‑sync effect for automatic KRs when editing a goal
    useEffect(() => {
        if (!editingGoalId) return;
        const activeGoal = data.goals?.find(g => g.id === editingGoalId);
        if (!activeGoal) return;
        (activeGoal.keyResults || []).forEach(kr => {
            if (kr.updateType === 'automatic') {
                syncKR({ id: kr.id }).catch(e => console.error('Auto‑sync failed', e));
            }
        });
    }, [editingGoalId, data.goals, syncKR]);

    // Helper functions
    const addGoal = async (status: any = 'Upcoming') => {
        setIsCreating(true);
        try {
            const goalId = await createGoal({
                projectId: data.id,
                title: "New Objective",
                description: "",
                type: "Strategic",
                timeframe: "Quarterly",
                status,
            });
            // Cast to any to satisfy TypeScript Id type
            setEditingGoalId(goalId as any);
            toast.success("New objective created!");
        } catch (e: any) {
            console.error('Failed to add goal:', e);
            toast.error('Failed to create goal. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const updateGoal = async (id: string, updates: Partial<Goal>) => {
        await updateGoalMutation({ id: id as any, updates });
    };

    const deleteGoal = async (id: string) => {
        setGoalToDelete(id);
    };

    const confirmDeleteGoal = async () => {
        if (goalToDelete) {
            await deleteGoalMutation({ id: goalToDelete as any });
            setGoalToDelete(null);
            setEditingGoalId(null);
            toast.success("Goal deleted successfully.");
        }
    };

    const addKeyResult = async (goalId: string) => {
        // Default to automatic updates for simplified tracking
        await createKR({
            goalId: goalId as any,
            description: "New Key Result",
            target: 100,
            unit: "%",
            updateType: 'automatic',
            metricSource: 'revenue'
        });
    };

    const updateKeyResult = async (goalId: string, krId: string, updates: Partial<KeyResult>) => {
        await updateKR({ id: krId as any, updates });
    };

    const deleteKeyResult = async (goalId: string, krId: string) => {
        await deleteKR({ id: krId as any });
    };

    const calculateProgress = (goal: Goal) => {
        if (!goal.keyResults || goal.keyResults.length === 0) return 0;
        const total = goal.keyResults.reduce((acc, kr) => {
            const p = Math.min(100, Math.max(0, (kr.current / kr.target) * 100));
            return acc + p;
        }, 0);
        return Math.round(total / goal.keyResults.length);
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        const goalId = e.dataTransfer.getData("goalId");
        if (goalId) {
            const goal = data.goals.find(g => g.id === goalId);
            if (!goal) return;

            // Prevent dragging out of Completed if archived (though filters hide it)
            if (goal.archived) return;

            await updateGoalMutation({
                id: goalId as any,
                updates: { status }
            });

            if (status === 'Completed') {
                await Promise.all((goal.keyResults || []).map(kr =>
                    updateKR({ id: kr.id as any, updates: { current: kr.target, status: 'Done' } })
                ));
            } else if (status === 'Upcoming') {
                await Promise.all((goal.keyResults || []).map(kr =>
                    updateKR({ id: kr.id as any, updates: { current: 0, status: 'Not Started' } })
                ));
            }
        }
    };

    // Helper to check for auto-completion
    const checkGoalCompletion = async (goalId: string, krUpdates: { id: string, status: string }[]) => {
        const goal = data.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Combine existing KRs with the updates
        const allKRsDone = (goal.keyResults || []).every(kr => {
            const update = krUpdates.find(u => u.id === kr.id);
            return (update ? update.status : kr.status) === 'Done';
        });

        if (allKRsDone && goal.status !== 'Completed') {
            await updateGoalMutation({
                id: goalId as any,
                updates: { status: 'Completed' }
            });
            toast.success("Goal completed! All metrics achieved.");
        }
    };

    // Sub-Kanban for Key Results
    const handleKRDrop = async (e: React.DragEvent, newStatus: string, goalId: string) => {
        const krId = e.dataTransfer.getData("krId");
        if (!krId) return;

        const goal = data.goals.find(g => g.id === goalId);
        const kr = goal?.keyResults?.find(k => k.id === krId);

        if (kr) {
            const updates: Partial<KeyResult> = { status: newStatus as any };
            if (newStatus === 'Done') {
                updates.current = kr.target;
            } else if (newStatus === 'Not Started') {
                updates.current = 0;
            }
            await updateKR({ id: krId as any, updates });

            // Auto-start Goal if interaction happens
            if (goal) {
                // If moving to In Progress or Done, and goal is Upcoming, start it
                if ((newStatus === 'In Progress' || newStatus === 'Done') && goal.status === 'Upcoming') {
                    await updateGoalMutation({
                        id: goalId as any,
                        updates: { status: 'In Progress' }
                    });
                    toast.info("Goal started automatically.");
                }

                // If moving back to In Progress from Done, and Goal was Completed, re-open it
                // (Assuming user might drag a KR back if they made a mistake)
                if (newStatus === 'In Progress' && goal.status === 'Completed') {
                    await updateGoalMutation({
                        id: goalId as any,
                        updates: { status: 'In Progress' }
                    });
                    toast.info("Goal re-opened.");
                }
            }

            // Check if this move completes the goal
            if (newStatus === 'Done') {
                // We pass specific update for this KR to the check function
                await checkGoalCompletion(goalId, [{ id: krId, status: 'Done' }]);
            }
        }
    };

    const handleArchive = async (goalId: string) => {
        await updateGoalMutation({
            id: goalId as any,
            updates: { archived: true }
        });
        toast.success("Goal archived to history.");
    };

    const handleOpenContextReview = () => {
        setShowContextReview(true);
    };

    const confirmContextAndGenerate = async () => {
        setIsGenerating(true);
        setShowContextReview(false);
        try {
            const proposal = await generateOKRProposal(data as any, {
                provider: 'google',
                modelName: 'gemini-1.5-flash',
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
            });

            if (proposal.goals.length > 0) {
                setAiProposal(proposal);
                setShowAiProposal(true);
            } else {
                toast.error("Could not generate suggestions. Please check if data is sufficient.");
            }
        } catch (error) {
            toast.error("Failed to generate goals.");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmAiProposal = async () => {
        if (!aiProposal) return;

        try {
            const goals = aiProposal.goals;
            for (const goal of goals) {
                const newGoalId = await createGoal({
                    projectId: data.id as any, // Using string ID directly
                    title: goal.title,
                    description: goal.description,
                    type: goal.type,
                    timeframe: goal.timeframe,
                    status: goal.status as any,
                });

                // Create Key Results for the new goal
                for (const kr of goal.keyResults) {
                    await createKR({
                        goalId: newGoalId,
                        description: kr.description,
                        target: kr.target,
                        unit: kr.unit,
                        updateType: kr.updateType || 'manual', // Default to manual if not specified
                        metricSource: kr.metricSource || undefined,
                        current: kr.current || 0,
                        status: kr.status || 'Not Started'
                    });
                }
            }
            toast.success(`Created ${goals.length} strategic objectives.`);
            setShowAiProposal(false);
            setAiProposal(null);
        } catch (error) {
            toast.error("Failed to apply goals.");
            console.error("Failed to apply AI proposal:", error);
        }
    }

    const activeGoal = data.goals?.find(g => g.id === editingGoalId);
    const activeGoals = data.goals.filter(g => !g.archived);
    const overallProgress = activeGoals.length > 0
        ? Math.round(activeGoals.reduce((acc, g) => acc + calculateProgress(g), 0) / activeGoals.length)
        : 0;

    // Kanban Logic
    const Column = ({ title, status, goals, onDrop }: { title: string, status: string, goals: Goal[], onDrop: (e: React.DragEvent, status: string) => void }) => {
        return (
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, status)}
                className="flex-1 min-w-[300px] bg-stone-50/50 rounded-xl p-4 border border-stone-200 h-full flex flex-col"
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'Upcoming' ? 'bg-stone-400' :
                            status === 'In Progress' ? 'bg-nobel-gold' :
                                'bg-emerald-500'
                            }`} />
                        <h3 className="font-serif text-lg text-stone-700">{title}</h3>
                    </div>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-stone-400 border border-stone-200 shadow-sm">
                        {goals.length}
                    </span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-grow pr-2">
                    {goals.map(goal => (
                        <div
                            key={goal.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("goalId", goal.id)}
                            onClick={() => setEditingGoalId(goal.id)}
                            className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm cursor-pointer hover:border-nobel-gold hover:shadow-md transition-all group relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${goal.type === 'Strategic' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {goal.type}
                                </span>
                                {/* Archive Button for Completed Goals */}
                                {status === 'Completed' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchive(goal.id);
                                        }}
                                        className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"
                                        title="Archive to History"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <h4 className="font-medium text-stone-900 mb-2 leading-tight">{goal.title}</h4>

                            {/* Progress Bar */}
                            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-nobel-gold transition-all duration-500"
                                    style={{
                                        width: `${(goal.keyResults || []).length > 0
                                            ? Math.round((goal.keyResults || []).reduce((acc, kr) => acc + (Math.min(100, (kr.current / kr.target) * 100)), 0) / (goal.keyResults || []).length)
                                            : 0
                                            }%`
                                    }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-stone-500">
                                <div className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    <span>{goal.keyResults?.length || 0} Metrics</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{goal.timeframe}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => addGoal(status)} className="w-full py-3 mt-4 border-t border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-nobel-gold hover:bg-stone-50">
                    <Plus className="w-3 h-3 inline mr-2" /> Add Objective
                </button>
            </div>
        );
    };


    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F4] text-stone-900 font-sans overflow-hidden">
            <header className="px-6 py-4 bg-[#F9F8F4]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between border-b border-stone-200">
                <div className="flex items-center gap-6">
                    <Logo imageClassName="h-8 w-auto" />
                    <div className="w-px h-6 bg-stone-200" />
                    <TabNavigation
                        currentView={currentView}
                        onNavigate={onNavigate}
                        allowedPages={allowedPages}
                        projectFeatures={{
                            canvasEnabled: data.canvasEnabled,
                            marketResearchEnabled: data.marketResearchEnabled
                        }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-stone-200 rounded-lg p-1 mr-2">
                        <button onClick={() => setActiveView('overview')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeView === 'overview' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}>
                            <PieChart className="w-3 h-3" /> Overview
                        </button>
                        <button onClick={() => setActiveView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeView === 'kanban' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}>
                            <LayoutList className="w-3 h-3" /> Kanban
                        </button>
                        <button onClick={() => setActiveView('history')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeView === 'history' ? 'bg-stone-900 text-white' : 'text-stone-500'}`}>
                            <Archive className="w-3 h-3" /> History
                        </button>
                    </div>
                    <button onClick={handleOpenContextReview} disabled={isGenerating} className="bg-stone-900 text-white px-5 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider hover:bg-nobel-gold transition-all flex items-center gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                        {isGenerating ? "Thinking..." : "AI Generate"}
                    </button>
                </div>
            </header>

            <main className="flex-grow flex relative overflow-hidden">
                <div className={`flex-grow p-8 md:p-12 overflow-x-auto transition-all duration-300 ${editingGoalId ? 'mr-[500px]' : ''}`}>
                    <div className="max-w-[1600px] mx-auto min-w-[1000px] h-full flex flex-col">
                        <div className="mb-10 flex items-end justify-between">
                            <div>
                                <div className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Execution</div>
                                <h1 className="font-serif text-4xl text-stone-900">Objectives & Key Results</h1>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Total Progress</span>
                                <div className="w-32 bg-stone-100 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-nobel-gold transition-all duration-1000" style={{ width: `${overallProgress}%` }}></div>
                                </div>
                                <span className="font-mono font-bold text-lg text-stone-900">{overallProgress}%</span>
                            </div>
                        </div>

                        {activeView === 'kanban' ? (
                            <div className="flex gap-8 items-start h-[calc(100vh-250px)] pb-4">
                                <Column title="To Do" status="Upcoming" goals={data.goals.filter(g => g.status === 'Upcoming' && !g.archived)} onDrop={handleDrop} />
                                <Column title="In Progress" status="In Progress" goals={data.goals.filter(g => g.status === 'In Progress' && !g.archived)} onDrop={handleDrop} />
                                <Column title="Completed" status="Completed" goals={data.goals.filter(g => g.status === 'Completed' && !g.archived)} onDrop={handleDrop} />
                            </div>
                        ) : activeView === 'history' ? (
                            <div className="animate-in fade-in duration-500 pb-20">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {data.goals.filter(g => g.archived).length === 0 ? (
                                        <div className="text-center py-20 bg-stone-50/50 rounded-xl border-2 border-dashed border-stone-200">
                                            <Archive className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                                            <h3 className="font-serif text-lg text-stone-500">No archived goals</h3>
                                            <p className="text-xs text-stone-400">Completed objectives will appear here for audit trails.</p>
                                        </div>
                                    ) : (
                                        Object.entries(
                                            data.goals
                                                .filter(g => g.archived)
                                                .reduce((groups, goal) => {
                                                    const date = new Date(goal.createdAt || Date.now());
                                                    const year = date.getFullYear();
                                                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                                                    const key = `${year} Q${quarter}`;
                                                    if (!groups[key]) groups[key] = [];
                                                    groups[key].push(goal);
                                                    return groups;
                                                }, {} as Record<string, Goal[]>)
                                        )
                                            .sort((a, b) => b[0].localeCompare(a[0])) // Sort by date desc
                                            .map(([period, goals]) => (
                                                <div key={period}>
                                                    <h3 className="text-lg font-serif font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2">{period}</h3>
                                                    <div className="space-y-4">
                                                        {goals.map(goal => (
                                                            <div key={goal.id} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between group hover:border-nobel-gold transition-colors cursor-pointer" onClick={() => setEditingGoalId(goal.id)}>
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-1">
                                                                        <h4 className="font-bold text-stone-900">{goal.title}</h4>
                                                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Completed</span>
                                                                    </div>
                                                                    <p className="text-xs text-stone-500 line-clamp-1">{goal.description || "No description"}</p>
                                                                </div>
                                                                <div className="flex items-center gap-8">
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Results</div>
                                                                        <div className="font-mono text-sm font-bold text-stone-900">{goal.keyResults?.length || 0} KRs</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Final Score</div>
                                                                        <div className="font-mono text-xl font-bold text-nobel-gold">{calculateProgress(goal)}%</div>
                                                                    </div>
                                                                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-nobel-gold transition-colors" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 animate-in fade-in duration-500">
                                {data.goals.filter(g => !g.archived).length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                                        <LayoutList className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                                        <h3 className="font-serif text-lg text-stone-500 mb-2">No objectives set</h3>
                                        <p className="text-xs text-stone-400 mb-6 max-w-sm mx-auto">Define strategic goals to guide your startup's execution.</p>
                                        <button onClick={() => addGoal()} disabled={isCreating} className="px-6 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-nobel-gold transition-colors shadow-lg flex items-center gap-2 mx-auto">
                                            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add First Goal"}
                                        </button>
                                    </div>
                                )}
                                {data.goals.filter(g => !g.archived).map((goal: any) => {
                                    const progress = calculateProgress(goal);
                                    return (
                                        <div key={goal.id} onClick={() => setEditingGoalId(goal.id)} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-nobel-gold transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${goal.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        goal.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-stone-50 text-stone-500'
                                                        }`}>{goal.status}</span>
                                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{goal.timeframe}</span>
                                                </div>
                                                <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight mb-2 group-hover:text-nobel-gold transition-colors line-clamp-2">{goal.title}</h3>
                                                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed h-8">{goal.description || "No description provided."}</p>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-stone-100">
                                                <div className="flex justify-between text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-wider">
                                                    <span>Progress</span>
                                                    <span className="text-stone-900">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-stone-900 group-hover:bg-nobel-gold transition-colors duration-500" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="mt-4 flex items-center gap-2 text-[10px] text-stone-400 font-medium font-mono uppercase tracking-wider">
                                                    <Target className="w-3 h-3 text-nobel-gold" />
                                                    {goal.keyResults?.length || 0} Key Results
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Add New Card */}
                                <div onClick={() => addGoal()} className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center p-6 text-stone-400 hover:border-nobel-gold hover:text-stone-600 hover:bg-white transition-all cursor-pointer min-h-[220px]">
                                    {isCreating ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Plus className="w-8 h-8 mb-2" />}
                                    <span className="font-bold uppercase tracking-wider text-xs">{isCreating ? "Creating..." : "Add Objective"}</span>
                                </div>
                            </div >
                        )}
                    </div >
                </div >
            </main>

            {/* Edit Drawer */}
            {/* Edit Drawer */}
            {editingGoalId && (
                <div className="fixed inset-y-0 right-0 w-[50%] min-w-[600px] bg-white shadow-2xl border-l border-stone-200 z-[100] flex flex-col h-full transform transition-transform duration-300">
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-stone-100 bg-[#F9F8F4] flex justify-between items-center">
                            <button onClick={() => setEditingGoalId(null)} className="p-2 hover:bg-white rounded-full text-stone-400 hover:text-stone-900 transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Detail View Toggle */}
                        {activeGoal && (
                            <div className="px-8 pt-4 pb-0 flex gap-4 border-b border-stone-100">
                                <button
                                    onClick={() => setDetailViewMode('list')}
                                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${detailViewMode === 'list' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                                >
                                    List View
                                </button>
                                <button
                                    onClick={() => setDetailViewMode('board')}
                                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${detailViewMode === 'board' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                                >
                                    Board View
                                </button>
                            </div>
                        )}

                        {activeGoal ? (
                            <>
                                <div className="p-8 flex-grow overflow-y-auto space-y-8 bg-stone-50/30">
                                    {detailViewMode === 'list' ? (
                                        <div className="max-w-2xl mx-auto space-y-8">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Objective</label>
                                                <input
                                                    value={localGoalTitle}
                                                    onChange={(e) => setLocalGoalTitle(e.target.value)}
                                                    onBlur={() => {
                                                        if (localGoalTitle !== activeGoal.title) {
                                                            updateGoal(activeGoal.id, { title: localGoalTitle });
                                                        }
                                                    }}
                                                    className="w-full text-lg font-bold p-3 bg-white border border-stone-200 rounded-lg outline-none focus:border-nobel-gold transition-colors"
                                                    placeholder="Enter objective title..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Description</label>
                                                <textarea
                                                    value={localGoalDescription}
                                                    onChange={(e) => setLocalGoalDescription(e.target.value)}
                                                    onBlur={() => {
                                                        if (localGoalDescription !== activeGoal.description) {
                                                            updateGoal(activeGoal.id, { description: localGoalDescription });
                                                        }
                                                    }}
                                                    className="w-full p-3 bg-white border border-stone-200 rounded-lg outline-none focus:border-nobel-gold transition-colors min-h-[100px] resize-y text-sm leading-relaxed"
                                                    placeholder="Describe the context and 'Why' behind this goal..."
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Status</label>
                                                    <select
                                                        value={activeGoal.status}
                                                        onChange={(e) => updateGoal(activeGoal.id, { status: e.target.value as any })}
                                                        className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-nobel-gold"
                                                    >
                                                        <option value="Upcoming">Upcoming</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Timeframe</label>
                                                    <select
                                                        value={activeGoal.timeframe}
                                                        onChange={(e) => updateGoal(activeGoal.id, { timeframe: e.target.value as any })}
                                                        className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-nobel-gold"
                                                    >
                                                        <option value="Weekly">Weekly</option>
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-stone-100">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="font-bold text-stone-900">Key Results</h3>
                                                    <button onClick={() => addKeyResult(activeGoal.id)} className="text-xs font-bold uppercase tracking-wider text-nobel-gold hover:bg-stone-50 px-2 py-1 rounded transition-colors">+ Add KR</button>
                                                </div>
                                                <div className="space-y-4">
                                                    {(activeGoal.keyResults || []).map((kr: any) => {
                                                        const localKR = localKRData[kr.id] || {};
                                                        return (
                                                            <div key={kr.id} className="bg-stone-50 p-4 rounded-lg border border-stone-100 space-y-3 relative group">
                                                                <input
                                                                    value={localKR.description ?? kr.description}
                                                                    onChange={(e) => setLocalKRData(prev => ({
                                                                        ...prev,
                                                                        [kr.id]: { ...prev[kr.id], description: e.target.value }
                                                                    }))}
                                                                    onBlur={() => {
                                                                        if (localKR.description !== kr.description) {
                                                                            updateKeyResult(activeGoal.id, kr.id, { description: localKR.description });
                                                                        }
                                                                    }}
                                                                    className="w-full bg-transparent border-b border-stone-200 pb-1 text-sm font-medium focus:border-stone-400 outline-none"
                                                                    placeholder="Metric Description"
                                                                />

                                                                {/* Update Method Selection */}
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className="relative">
                                                                        <select
                                                                            value={kr.updateType || 'manual'}
                                                                            onChange={(e) => {
                                                                                const newType = e.target.value;
                                                                                updateKeyResult(activeGoal.id, kr.id, {
                                                                                    updateType: newType,
                                                                                    metricSource: newType === 'manual' ? undefined : 'revenue'
                                                                                });
                                                                            }}
                                                                            className="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200 outline-none cursor-pointer hover:bg-white"
                                                                        >
                                                                            <option value="manual">Manual Entry</option>
                                                                            <option value="automatic">Auto-Sync</option>
                                                                        </select>
                                                                        {kr.updateType === 'automatic' && (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        await syncKR({ id: kr.id });
                                                                                    } catch (e) {
                                                                                        console.error('Sync failed', e);
                                                                                    }
                                                                                }}
                                                                                className="ml-2 text-xs text-nobel-gold hover:underline"
                                                                            >
                                                                                Sync
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {kr.updateType === 'automatic' && (
                                                                        <select
                                                                            value={kr.metricSource || 'revenue'}
                                                                            onChange={(e) => updateKeyResult(activeGoal.id, kr.id, { metricSource: e.target.value })}
                                                                            className="text-[10px] uppercase font-bold text-nobel-gold bg-stone-100 px-2 py-1 rounded border border-stone-200 outline-none cursor-pointer hover:bg-white flex-grow"
                                                                        >
                                                                            <option value="revenue">Revenue (Stripe)</option>
                                                                            <option value="users">Active Users</option>
                                                                            <option value="burn_rate">Burn Rate</option>
                                                                            <option value="runway">Runway (Months)</option>
                                                                        </select>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-3 text-sm mt-3">
                                                                    <div className="flex flex-col relative">
                                                                        <span className="text-[10px] text-stone-400 uppercase flex items-center gap-1">
                                                                            Current
                                                                            {kr.updateType === 'automatic' && <RefreshCw className="w-3 h-3 text-nobel-gold animate-pulse" />}
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            value={localKR.current ?? kr.current}
                                                                            onChange={(e) => setLocalKRData(prev => ({
                                                                                ...prev,
                                                                                [kr.id]: { ...prev[kr.id], current: e.target.value }
                                                                            }))}
                                                                            onBlur={() => {
                                                                                const val = localKR.current === undefined ? kr.current : parseFloat(localKR.current);
                                                                                if (!isNaN(val) && val !== kr.current) {
                                                                                    updateKeyResult(activeGoal.id, kr.id, { current: val });
                                                                                }
                                                                            }}
                                                                            disabled={kr.updateType === 'automatic'}
                                                                            className={`w-20 p-1 border rounded bg-white ${kr.updateType === 'automatic' ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : ''}`}
                                                                        />
                                                                    </div>
                                                                    <span className="text-stone-300 mt-4">/</span>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] text-stone-400 uppercase">Target</span>
                                                                        <input
                                                                            type="number"
                                                                            value={localKR.target ?? kr.target}
                                                                            onChange={(e) => setLocalKRData(prev => ({
                                                                                ...prev,
                                                                                [kr.id]: { ...prev[kr.id], target: e.target.value }
                                                                            }))}
                                                                            onBlur={() => {
                                                                                const val = localKR.target === undefined ? kr.target : parseFloat(localKR.target);
                                                                                if (!isNaN(val) && val !== kr.target) {
                                                                                    updateKeyResult(activeGoal.id, kr.id, { target: val });
                                                                                }
                                                                            }}
                                                                            className="w-16 p-1 border rounded bg-white"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col flex-grow">
                                                                        <span className="text-[10px] text-stone-400 uppercase">Unit</span>
                                                                        <input
                                                                            value={localKR.unit ?? kr.unit}
                                                                            onChange={(e) => setLocalKRData(prev => ({
                                                                                ...prev,
                                                                                [kr.id]: { ...prev[kr.id], unit: e.target.value }
                                                                            }))}
                                                                            onBlur={() => {
                                                                                if (localKR.unit !== kr.unit) {
                                                                                    updateKeyResult(activeGoal.id, kr.id, { unit: localKR.unit });
                                                                                }
                                                                            }}
                                                                            className="w-full p-1 border rounded bg-white"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => deleteKeyResult(activeGoal.id, kr.id)}
                                                                    className="absolute top-2 right-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-row gap-4">
                                            {['Not Started', 'In Progress', 'Done'].map(status => (
                                                <div
                                                    key={status}
                                                    className="flex-1 bg-stone-100/50 rounded-xl p-3 border border-stone-200"
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleKRDrop(e, status, activeGoal.id)}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{status}</span>
                                                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 text-stone-400">
                                                            {(activeGoal?.keyResults || []).filter((k: any) => (k.status || 'Not Started') === status).length}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {(activeGoal?.keyResults || []).filter((k: any) => (k.status || 'Not Started') === status).map((kr: any) => (
                                                            <div
                                                                key={kr.id}
                                                                draggable
                                                                onDragStart={(e) => e.dataTransfer.setData("krId", kr.id)}
                                                                className="bg-white p-3 rounded border border-stone-200 shadow-sm cursor-grab hover:border-nobel-gold group"
                                                            >
                                                                <p className="text-sm font-medium text-stone-900 mb-1">{kr.description}</p>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] text-stone-400 font-mono">
                                                                        {kr.current} / {kr.target} {kr.unit}
                                                                    </span>
                                                                    <div className="w-16 h-1 bg-stone-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-nobel-gold"
                                                                            style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-stone-100 bg-[#F9F8F4]">
                                    <button onClick={() => deleteGoal(activeGoal.id)} className="w-full py-3 bg-white border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200 font-bold text-xs uppercase tracking-widest rounded-lg transition-all">Delete Goal</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-stone-400 flex-col gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-nobel-gold" />
                                <p className="text-sm font-medium">Loading objective...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* AI Proposal Modal */}
            {showAiProposal && aiProposal && (
                <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[150] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-stone-100 bg-[#F9F8F4] flex justify-between items-center">
                            <h3 className="font-serif text-xl text-stone-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-nobel-gold" />
                                Strategic Proposal
                            </h3>
                            <button onClick={() => setShowAiProposal(false)} className="p-1 hover:bg-stone-200 rounded-full">
                                <X className="w-5 h-5 text-stone-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">AI Rationale</h4>
                                <p className="text-stone-700 leading-relaxed text-sm">
                                    {aiProposal.rationale}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Proposed Objectives</h4>
                                {aiProposal.goals.map((goal, idx) => (
                                    <div key={idx} className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-stone-900 font-bold">{goal.title}</span>
                                            <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-500">{goal.type}</span>
                                        </div>
                                        <div className="space-y-1 pl-4 border-l-2 border-stone-100">
                                            {goal.keyResults.map((kr, kIdx) => (
                                                <div key={kIdx} className="text-sm text-stone-600 flex justify-between">
                                                    <span>• {kr.description}</span>
                                                    <span className="font-mono text-xs">{kr.target} {kr.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAiProposal(false)}
                                className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAiProposal}
                                className="px-6 py-2 bg-nobel-gold text-stone-900 font-bold rounded-lg hover:bg-[#D4AF37] transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Approve & Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Context Review Modal */}
            {showContextReview && (
                <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl text-stone-900">Review Context</h3>
                                    <p className="text-xs text-stone-500">The AI will use this data to generate your goals.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowContextReview(false)} className="text-stone-400 hover:text-stone-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                                    <h4 className="font-bold text-sm mb-2 text-stone-700 flex items-center gap-2">
                                        <PieChart className="w-4 h-4" /> Market Data
                                    </h4>
                                    <div className="text-sm text-stone-600 space-y-1">
                                        <div className="flex justify-between"><span>TAM:</span> <span>{data.market.tam > 0 ? `$${data.market.tam.toLocaleString()}` : 'Undefined'}</span></div>
                                        <div className="flex justify-between"><span>SAM:</span> <span>{data.market.sam > 0 ? `$${data.market.sam.toLocaleString()}` : 'Undefined'}</span></div>
                                        <div className="flex justify-between"><span>SOM:</span> <span>{data.market.som > 0 ? `$${data.market.som.toLocaleString()}` : 'Undefined'}</span></div>
                                    </div>
                                </div>

                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                                    <h4 className="font-bold text-sm mb-2 text-stone-700 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Business Model
                                    </h4>
                                    <div className="text-sm text-stone-600 space-y-1">
                                        <div className="flex justify-between"><span>Type:</span> <span>{data.revenueModel.businessModelType || 'Undefined'}</span></div>
                                        <div className="flex justify-between"><span>Streams:</span> <span>{data.revenueModel.revenueStreams.length} defined</span></div>
                                        <div className="flex justify-between"><span>Growth:</span> <span>{data.revenueModel.monthlyGrowthRate}%</span></div>
                                    </div>
                                </div>

                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 col-span-2">
                                    <h4 className="font-bold text-sm mb-2 text-stone-700 flex items-center gap-2">
                                        <LayoutList className="w-4 h-4" /> Canvas Completeness
                                    </h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600">
                                        {Object.entries(data.canvas).slice(0, 6).map(([key, val]) => (
                                            <div key={key} className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0">
                                                <span className="truncate max-w-[150px]">{key}</span>
                                                <span className={val ? "text-green-600 font-medium" : "text-amber-500"}>
                                                    {val ? <Check className="w-3 h-3" /> : "Empty"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                                <p className="flex items-center gap-2 font-medium mb-1"><Info className="w-4 h-4" /> Prompt Strategy</p>
                                <p className="opacity-80">The AI will look for gaps in the data above (e.g. missing TAM, undefined features) and prioritize goals to validate these assumptions.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowContextReview(false)}
                                className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmContextAndGenerate}
                                className="px-6 py-2 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Confirm & Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {goalToDelete && (
                <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="font-serif text-xl text-stone-900 mb-2">Delete Goal?</h3>
                            <p className="text-stone-500 text-sm leading-relaxed mb-6">
                                Are you sure you want to delete this goal? This action cannot be undone and will also remove all associated Key Results.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setGoalToDelete(null)}
                                    className="px-6 py-2 bg-stone-100 text-stone-600 font-bold rounded-lg hover:bg-stone-200 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteGoal}
                                    className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow text-sm"
                                >
                                    Delete Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalSetting;
