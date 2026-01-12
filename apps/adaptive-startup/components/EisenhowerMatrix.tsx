
import React, { useState, useRef } from 'react';
import { StartupData, AISettings, Feature, EisenhowerQuadrant } from '../types';
import { Plus, GripVertical, Check, AlertCircle, Clock, Trash2, ArrowRight, ChevronDown, LayoutGrid, List as ListIcon, CheckCircle2, Brain, Sparkles, Loader2, Settings2, X, AlertTriangle, Briefcase, Target, Filter, ArrowUp, ArrowLeft, ArrowRight as ArrowRightIcon, BookOpen, Quote, Pencil } from 'lucide-react';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { Logo } from './Logo';
import { GoogleGenAI, Type } from "@google/genai";
import CustomSelect from './CustomSelect';
import AttributionBadge from './AttributionBadge';

interface EisenhowerMatrixProps {
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

const QUADRANTS: {
    id: EisenhowerQuadrant,
    label: string,
    sub: string,
    color: string,
    bg: string,
    text: string,
    icon: any
}[] = [
        { id: 'Do', label: 'Do First', sub: 'Urgent & Important', color: 'border-l-emerald-500', bg: 'bg-emerald-50/30', text: 'text-emerald-900', icon: Target },
        { id: 'Schedule', label: 'Schedule', sub: 'Important, Not Urgent', color: 'border-l-blue-500', bg: 'bg-blue-50/30', text: 'text-blue-900', icon: Clock },
        { id: 'Delegate', label: 'Delegate', sub: 'Urgent, Not Important', color: 'border-l-amber-500', bg: 'bg-amber-50/30', text: 'text-amber-900', icon: Briefcase },
        { id: 'Eliminate', label: 'Eliminate', sub: 'Not Urgent & Not Important', color: 'border-l-stone-400', bg: 'bg-stone-50/50', text: 'text-stone-500', icon: Trash2 }
    ];

import { useMutation, useQuery } from 'convex/react';
import { api } from "../convex/_generated/api";
import { useCreateFeature } from '../hooks/useCreate';
import { useUpdateFeature } from '../hooks/useUpdate';
import { useDeleteFeature } from '../hooks/useDelete';

const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
    data,
    allProjects,
    onUpdateProject,
    onSwitchProject,
    onNewProject,
    onNavigate,
    currentView,
    settings,
    allowedPages
}) => {
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [draggedFeatureId, setDraggedFeatureId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'completed'>('matrix');

    // Add Task Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [targetQuadrant, setTargetQuadrant] = useState<EisenhowerQuadrant | 'Uncategorized'>('Uncategorized');
    // Local optimistic features state
    const [localFeatures, setLocalFeatures] = useState<Feature[]>(data.features);

    // Connected OKR State
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [selectedKeyResultId, setSelectedKeyResultId] = useState<string>('');
    const [filterGoalId, setFilterGoalId] = useState<string | 'all'>('all');

    const activeGoals = data.goals?.filter(g => g.status !== 'Completed' && !g.archived) || [];
    const keyResultsForSelectedGoal = selectedGoalId ? activeGoals.find(g => g.id === selectedGoalId)?.keyResults || [] : [];

    React.useEffect(() => {
        setLocalFeatures(data.features);
    }, [data.features]);
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
    const [taskTags, setTaskTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [filterTag, setFilterTag] = useState<string | 'all'>('all');

    // Strategy Context State
    const [showContext, setShowContext] = useState(false);
    const [showPhilosophy, setShowPhilosophy] = useState(false);
    const [humanSkills, setHumanSkills] = useState('');
    const [resources, setResources] = useState('');
    const [strategicFocus, setStrategicFocus] = useState('');
    const [currentGoal, setCurrentGoal] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Mutations
    const addFeature = useCreateFeature();
    const updateFeature = useUpdateFeature();
    const deleteFeature = useDeleteFeature();



    // Fetch users
    const users = useQuery(api.users.listByOrg, { orgId: data.orgId || "personal" });

    // Filter Logic
    const allTags = Array.from(new Set(localFeatures.flatMap(f => f.tags || []))).sort();

    const filteredFeatures = localFeatures.filter(f => {
        if (filterGoalId !== 'all' && f.connectedGoalId !== filterGoalId) return false;
        if (filterTag === 'all') return true;
        return f.tags?.includes(filterTag);
    });

    const uncategorized = filteredFeatures.filter(f => (!f.eisenhowerQuadrant || f.eisenhowerQuadrant === 'Uncategorized') && f.status !== 'Done');
    const completed = filteredFeatures.filter(f => f.status === 'Done');

    // -- AI Logic --
    const runAIPrioritization = async () => {
        if (uncategorized.length === 0) {
            alert("No tasks in backlog to prioritize.");
            return;
        }
        setIsAnalyzing(true);

        try {
            const apiKey = settings.apiKey || process.env.API_KEY;
            if (!apiKey) throw new Error("API Key required");
            const ai = new GoogleGenAI({ apiKey });

            const tasksJson = JSON.stringify(uncategorized.map(f => ({ id: f.id, title: f.title, description: f.description })));

            const prompt = `
                You are a Strategic Project Manager using the Eisenhower Matrix.
                
                CONTEXT:
                Team Skills: ${humanSkills || "General full-stack development"}
                Resources/Constraints: ${resources || "Standard startup constraints"}
                
                TASKS TO SORT:
                ${tasksJson}
                
                INSTRUCTIONS:
                Categorize each task into one of these quadrants: 'Do', 'Schedule', 'Delegate', 'Eliminate'.
                - 'Do': High value, urgent, matches team skills.
                - 'Schedule': High value, not urgent.
                - 'Delegate': Low strategic value, urgent, or mismatch with core team skills.
                - 'Eliminate': Low value, low urgency.
                
                Return a JSON array: [{ "id": "task_id", "quadrant": "Do" }, ...]
            `;

            const response = await ai.models.generateContent({
                model: settings.modelName || 'gemini-2.0-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                quadrant: { type: Type.STRING, enum: ['Do', 'Schedule', 'Delegate', 'Eliminate'] }
                            }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text || "[]");

            if (Array.isArray(result)) {
                // Bulk update would be better, but loop for now
                result.forEach((r: any) => {
                    const originalFeature = uncategorized.find(f => f.id === r.id);
                    const currentTags = originalFeature?.tags || [];
                    const newTags = currentTags.includes('AI Assisted') ? currentTags : [...currentTags, 'AI Assisted'];

                    updateFeature({
                        id: r.id as any,
                        updates: {
                            eisenhowerQuadrant: r.quadrant,
                            priority: r.quadrant === 'Do' ? 'High' : r.quadrant === 'Schedule' ? 'Medium' : 'Low',
                            source: 'AI',
                            tags: newTags
                        }
                    });
                });

                onUpdateProject(p => ({
                    ...p,
                    features: p.features.map(f => {
                        const suggestion = result.find((r: any) => r.id === f.id);
                        if (suggestion) {
                            return {
                                ...f,
                                eisenhowerQuadrant: suggestion.quadrant,
                                priority: suggestion.quadrant === 'Do' ? 'High' : suggestion.quadrant === 'Schedule' ? 'Medium' : 'Low',
                                source: 'AI',
                                tags: [...(f.tags || []), 'AI Assisted']
                            };
                        }
                        return f;
                    })
                }));
            }

        } catch (e) {
            alert("AI Prioritization failed. Check API settings.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // -- DnD Logic --
    const [dragOverQuadrant, setDragOverQuadrant] = useState<EisenhowerQuadrant | 'Uncategorized' | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        // Use setTimeout to ensure the drag operation starts before the state update triggers a re-render.
        // This prevents the "two click" issue where the drag is cancelled immediately by the re-render.
        setTimeout(() => setDraggedFeatureId(id), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        // Optional: Custom drag image
    };

    const handleDragEnd = () => {
        setDraggedFeatureId(null);
    };

    const handleDragOver = (e: React.DragEvent, quadrantId: EisenhowerQuadrant | 'Uncategorized') => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverQuadrant !== quadrantId) {
            setDragOverQuadrant(quadrantId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverQuadrant(null);
    };

    const handleDrop = (e: React.DragEvent, quadrant: EisenhowerQuadrant | 'Uncategorized') => {
        e.preventDefault();
        setDragOverQuadrant(null);
        if (draggedFeatureId) {
            updateFeatureQuadrant(draggedFeatureId, quadrant);
            setDraggedFeatureId(null);
        }
    };

    const updateFeatureQuadrant = (id: string, quadrant: EisenhowerQuadrant | 'Uncategorized') => {
        let newPriority: 'High' | 'Medium' | 'Low' = 'Medium';
        if (quadrant === 'Do') newPriority = 'High';
        else if (quadrant === 'Schedule') newPriority = 'Medium';
        else if (quadrant === 'Delegate') newPriority = 'Low';
        else if (quadrant === 'Eliminate') newPriority = 'Low';

        onUpdateProject(p => ({
            ...p,
            features: p.features.map(f => {
                if (f.id !== id) return f;
                // Manual move override
                const newTags = (f.tags || []).filter(t => t !== 'AI Assisted' && t !== 'Human Edited');
                newTags.push('Human Edited');
                return { ...f, eisenhowerQuadrant: quadrant, priority: newPriority, source: 'Human', tags: newTags };
            })
        }));

        // Retrieve current tags to update properly for backend sync
        const feature = localFeatures.find(f => f.id === id);
        const currentTags = feature?.tags || [];
        const newTags = currentTags.filter(t => t !== 'AI Assisted' && t !== 'Human Edited');
        newTags.push('Human Edited');

        updateFeature({
            id: id as any,
            updates: {
                eisenhowerQuadrant: quadrant,
                priority: newPriority,
                source: 'Human',
                tags: newTags
            }
        });
    };

    // -- CRUD Actions --
    const openAddModal = (quadrant: EisenhowerQuadrant | 'Uncategorized') => {
        setTargetQuadrant(quadrant);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setAssignedUserIds([]);
        setTaskTags([]);
        setTagInput('');
        setSelectedGoalId('');
        setSelectedKeyResultId('');
        setEditingFeatureId(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (f: Feature) => {
        setTargetQuadrant(f.eisenhowerQuadrant || 'Uncategorized');
        setNewTaskTitle(f.title);
        setNewTaskDesc(f.description || '');
        setAssignedUserIds(f.assignedTo || []);
        setTaskTags(f.tags || []);
        setTagInput('');
        setSelectedGoalId(f.connectedGoalId || '');
        setSelectedKeyResultId(f.connectedKeyResultId || '');
        setEditingFeatureId(f.id);
        setIsAddModalOpen(true);
    };

    const handleSaveTask = () => {
        if (!newTaskTitle.trim()) return;

        if (editingFeatureId) {
            // Update existing
            const updates = {
                title: newTaskTitle,
                description: newTaskDesc,
                eisenhowerQuadrant: targetQuadrant,
                assignedTo: assignedUserIds,
                tags: taskTags,
                priority: (targetQuadrant === 'Do' ? 'High' : targetQuadrant === 'Schedule' ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
                connectedGoalId: selectedGoalId || undefined,
                connectedKeyResultId: selectedKeyResultId || undefined
            };

            onUpdateProject(p => ({
                ...p,
                features: p.features.map(f => f.id === editingFeatureId ? { ...f, ...updates, priority: updates.priority as any } : f)
            }));

            setLocalFeatures(prev => prev.map(f => f.id === editingFeatureId ? { ...f, ...updates, priority: updates.priority as any } : f));

            updateFeature({
                id: editingFeatureId as any,
                updates: { ...updates, priority: updates.priority as any }
            });
        } else {
            // Create new
            // Optimistic
            const tempId = Date.now().toString();
            const newFeature: Feature = {
                id: tempId,
                title: newTaskTitle,
                description: newTaskDesc,
                status: 'Backlog',
                priority: targetQuadrant === 'Do' ? 'High' : targetQuadrant === 'Schedule' ? 'Medium' : 'Low',
                eisenhowerQuadrant: targetQuadrant,
                assignedTo: assignedUserIds,
                tags: taskTags,
                connectedGoalId: selectedGoalId || undefined,
                connectedKeyResultId: selectedKeyResultId || undefined
            };

            onUpdateProject(p => ({
                ...p,
                features: [...p.features, newFeature]
            }));

            setLocalFeatures(prev => [...prev, newFeature]);

            // Persist
            addFeature({
                projectId: data.id,
                title: newTaskTitle,
                description: newTaskDesc,
                status: 'Backlog',
                priority: newFeature.priority,
                eisenhowerQuadrant: targetQuadrant,
                assignedTo: assignedUserIds,
                tags: taskTags,
                connectedGoalId: selectedGoalId || undefined,
                connectedKeyResultId: selectedKeyResultId || undefined
            });
        }

        setIsAddModalOpen(false);
        setEditingFeatureId(null);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            onUpdateProject(p => ({
                ...p,
                features: p.features.filter(f => f.id !== deleteConfirmId)
            }));

            setLocalFeatures(prev => prev.filter(f => f.id !== deleteConfirmId));

            deleteFeature({ id: deleteConfirmId as any });
            setDeleteConfirmId(null);
        }
    };

    const toggleComplete = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Done' ? 'Backlog' : 'Done';
        onUpdateProject(p => ({
            ...p,
            features: p.features.map(f => f.id === id ? { ...f, status: newStatus } : f)
        }));
        updateFeature({
            id: id as any,
            updates: { status: newStatus }
        });
    };

    // -- Render Helpers --
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const getRandomColor = (id: string) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
        return colors[id.charCodeAt(0) % colors.length];
    };

    const TaskCard: React.FC<{ f: Feature; mini?: boolean }> = ({ f, mini = false }) => {
        const assignedUsers = f.assignedTo?.map(uid => users?.find(u => u._id === uid)).filter(Boolean) || [];

        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, f.id)}
                onDragEnd={handleDragEnd}
                className={`
                bg-white rounded-xl border border-stone-200 shadow-sm cursor-grab active:cursor-grabbing group hover:shadow-md transition-all relative flex flex-col justify-between select-none
                ${mini ? 'p-3 hover:-translate-y-1 hover:border-nobel-gold/50' : 'p-4'}
                ${draggedFeatureId === f.id ? 'opacity-50' : 'opacity-100'}
            `}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3 flex-grow">
                        <div className="mt-1 cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        {/* Checkbox */}
                        <button
                            onClick={() => toggleComplete(f.id, f.status)}
                            className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${f.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 hover:border-nobel-gold'}`}
                        >
                            {f.status === 'Done' && <Check className="w-3 h-3" />}
                        </button>
                        <div>
                            <span className={`text-sm font-bold block leading-tight text-stone-900 ${f.status === 'Done' ? 'text-stone-400 line-through' : ''}`}>
                                {f.title}
                            </span>
                            {!mini && f.description && (
                                <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{f.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 -mr-2 -mt-1">
                        <button
                            onClick={() => openEditModal(f)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!mini && f.eisenhowerQuadrant !== 'Uncategorized' && (
                            <button
                                onClick={() => updateFeatureQuadrant(f.id, 'Uncategorized')}
                                title="Move to Backlog"
                                className="p-1.5 bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 rounded-full transition-all mr-1"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Tags */}
                {f.tags && f.tags.filter(t => t !== 'AI Assisted' && t !== 'Human Edited').length > 0 && (
                    <div className="flex flex-wrap gap-1 px-4 mt-1 mb-2">
                        {f.tags.filter(t => t !== 'AI Assisted' && t !== 'Human Edited').map(tag => (
                            <span key={tag} className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Badges, Assignees & Attribution */}
                <div className="flex justify-between items-center mt-2 ml-4 mr-4 pb-2">
                    <div className="flex gap-2 items-center">
                        {f.priority === 'High' && <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">High</span>}
                        {f.priority === 'Medium' && <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Med</span>}
                        {f.status === 'In Progress' && <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-2 h-2" /> WIP</span>}

                        {/* Connected Goal Badge */}
                        {f.connectedGoalId && (
                            <span className="text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1" title="Linked to OKR">
                                <Target className="w-2 h-2" /> OKR
                            </span>
                        )}

                        {/* Attribution Badge Next to Priority */}
                        {(f.tags?.includes('AI Assisted') || f.source === 'AI') && (
                            <AttributionBadge type="AI Assisted" />
                        )}
                        {(f.tags?.includes('Human Edited') || f.source === 'Human') && (
                            <AttributionBadge type="Human Edited" />
                        )}
                    </div>

                    {assignedUsers.length > 0 && (
                        <div className="flex -space-x-1">
                            {assignedUsers.map((u: any) => (
                                <div
                                    key={u._id}
                                    className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white ${getRandomColor(u._id)}`}
                                    title={u.name}
                                >
                                    {u.pictureUrl ? <img src={u.pictureUrl} alt={u.name} className="w-full h-full rounded-full object-cover" /> : getInitials(u.name || "?")}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );


    };

    const KeyResultCard: React.FC<{ kr: any; goalTitle: string }> = ({ kr, goalTitle }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        return (
            <div className="bg-stone-800/50 rounded-xl border border-stone-700/50 p-3 hover:bg-stone-800 transition-all group">
                <div className="flex items-start gap-2">
                    <div className="p-1 bg-nobel-gold/10 rounded shrink-0">
                        <Target className="w-3 h-3 text-nobel-gold" />
                    </div>
                    <div className="min-w-0 flex-grow">
                        <span className="text-[9px] text-nobel-gold uppercase font-black tracking-widest block truncate opacity-80 mb-0.5">
                            {goalTitle}
                        </span>
                        <p className={`text-xs text-stone-200 leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {kr.description}
                        </p>
                        {kr.description && kr.description.length > 60 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[10px] text-nobel-gold/50 hover:text-nobel-gold mt-1 font-bold uppercase tracking-tighter"
                            >
                                {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-nobel-cream canvas-pattern text-stone-900 font-sans overflow-hidden" style={{ backgroundSize: '24px 24px' }}>
            {/* Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between border-b border-stone-200">
                <div className="flex items-center gap-4">
                    <Logo imageClassName="h-8 w-auto" />
                    <div className="h-6 w-px bg-stone-200" />
                    <ProjectSelector
                        projects={allProjects}
                        currentProjectId={data.id}
                        onSelectProject={onSwitchProject}
                        onCreateNew={onNewProject}
                    />
                    <div className="h-6 w-px bg-stone-200" />
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
                    {allTags.length > 0 && (
                        <div className="mr-1">
                            <CustomSelect
                                value={filterTag}
                                onChange={setFilterTag}
                                options={[
                                    { label: 'All Categories', value: 'all' },
                                    ...allTags.map(tag => ({ label: tag, value: tag }))
                                ]}
                                className="w-40"
                                placeholder="Filter by..."
                            />
                        </div>
                    )}
                    <div className="bg-white border border-stone-200 rounded-lg p-1 flex">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'matrix' ? 'bg-stone-900 text-white shadow' : 'text-stone-500 hover:bg-stone-50'}`}
                        >
                            <LayoutGrid className="w-3 h-3" /> Matrix
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-stone-900 text-white shadow' : 'text-stone-500 hover:bg-stone-50'}`}
                        >
                            <ListIcon className="w-3 h-3" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('completed')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'completed' ? 'bg-stone-900 text-white shadow' : 'text-stone-500 hover:bg-stone-50'}`}
                        >
                            <CheckCircle2 className="w-3 h-3" /> Done
                        </button>
                    </div>

                    {/* OKR Filter */}
                    {activeGoals.length > 0 && (
                        <div>
                            <select
                                value={filterGoalId}
                                onChange={(e) => setFilterGoalId(e.target.value)}
                                className="bg-white border border-stone-200 text-stone-600 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-stone-400 max-w-[150px]"
                            >
                                <option value="all">All Objectives</option>
                                {activeGoals.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => setShowPhilosophy(true)}
                        className={`p-2 rounded-lg border transition-all ${showPhilosophy ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600'}`}
                        title="Methodology & Philosophy"
                    >
                        <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowContext(!showContext)}
                        className={`p-2 rounded-lg border transition-all ${showContext ? 'bg-nobel-gold text-white border-nobel-gold' : 'bg-white border-stone-200 text-stone-400 hover:text-stone-600'}`}
                        title="Strategy Context"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-grow flex h-[calc(100vh-64px)] overflow-hidden relative">

                {/* LEFT SIDEBAR: BACKLOG & CONTEXT */}
                <div
                    className={`w-80 bg-stone-900 border-r border-stone-800 flex flex-col z-20 shadow-xl shrink-0 transition-colors ${dragOverQuadrant === 'Uncategorized' ? 'bg-stone-800 ring-2 ring-inset ring-nobel-gold/50' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'Uncategorized')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'Uncategorized')}
                >
                    {/* Strategy Context Drawer */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out border-b border-stone-800 ${showContext ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 bg-stone-900/50 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-nobel-gold flex items-center gap-2">
                                <Brain className="w-3 h-3" /> Strategy Engine
                            </h3>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Team Skills</label>
                                <input
                                    value={humanSkills}
                                    onChange={e => setHumanSkills(e.target.value)}
                                    className="w-full p-2 text-xs border border-stone-700 rounded bg-stone-800 text-stone-200 placeholder-stone-600 focus:border-nobel-gold focus:outline-none"
                                    placeholder="e.g. React, Sales, Design"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Constraints</label>
                                <input
                                    value={resources}
                                    onChange={e => setResources(e.target.value)}
                                    className="w-full p-2 text-xs border border-stone-700 rounded bg-stone-800 text-stone-200 placeholder-stone-600 focus:border-nobel-gold focus:outline-none"
                                    placeholder="e.g. $5k Budget, 2 weeks"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900">
                        <div>
                            <h2 className="font-serif text-lg text-white leading-none">Backlog</h2>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-1">Uncategorized Ideas</p>
                        </div>
                        <button
                            onClick={runAIPrioritization}
                            disabled={isAnalyzing || uncategorized.length === 0}
                            className="bg-stone-800 text-stone-200 border border-stone-700 p-2 rounded-lg hover:bg-nobel-gold hover:text-stone-900 hover:border-nobel-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Auto-Prioritize with AI"
                        >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-6 bg-stone-900 custom-scrollbar">
                        {/* Success Metrics Section */}
                        {activeGoals.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <div className="h-px flex-grow bg-stone-800" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-nobel-gold/60">Success Metrics</h3>
                                    <div className="h-px flex-grow bg-stone-800" />
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {activeGoals.flatMap(g => (g.keyResults || []).map(kr => (
                                        <KeyResultCard key={kr.id} kr={kr} goalTitle={g.title} />
                                    )))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-px flex-grow bg-stone-800" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">Task Backlog</h3>
                                <div className="h-px flex-grow bg-stone-800" />
                            </div>
                            {uncategorized.length === 0 ? (
                                <div className="text-center py-10 text-stone-600 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-stone-800/50 rounded-xl">
                                    Backlog empty
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {uncategorized.map(f => <TaskCard key={f.id} f={f} mini />)}
                                </div>
                            )}
                            <button
                                onClick={() => openAddModal('Uncategorized')}
                                className="w-full py-3 border border-dashed border-stone-800 rounded-lg text-stone-500 text-[10px] font-black uppercase tracking-[0.2em] hover:border-nobel-gold hover:text-nobel-gold transition-all flex items-center justify-center gap-2 hover:bg-stone-800/50"
                            >
                                <Plus className="w-3 h-3" /> Quick Add
                            </button>
                        </div>
                    </div>

                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-grow overflow-y-auto bg-transparent relative flex flex-col">

                    {/* HERO SECTION */}
                    <div className="relative w-full h-48 shrink-0 mb-8 overflow-hidden group">
                        <div className="absolute inset-0">
                            <img
                                src="/images/manworking.png"
                                alt="Strategy Background"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-stone-900/60 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-center px-8 max-w-6xl mx-auto">
                            <h1 className="font-serif text-3xl font-bold text-white mb-2 shadow-sm">Priority Matrix</h1>
                            <p className="text-stone-200 max-w-xl leading-relaxed text-sm shadow-sm backdrop-blur-sm">
                                Organize your tasks by urgency and importance. Use the matrix to identify what needs your immediate attention and what can be scheduled or delegated.
                            </p>
                        </div>
                    </div>

                    <div className="px-8 pb-8 flex-grow">

                        {viewMode === 'matrix' && (
                            <div className="max-w-6xl mx-auto h-full flex flex-col relative">
                                {/* Top Axis Label */}
                                <div className="flex justify-between px-12 mb-3 text-xs font-bold uppercase tracking-widest text-stone-400 select-none">
                                    <div className="flex items-center gap-2 text-rose-500/70"><AlertTriangle className="w-3 h-3" /> Urgent</div>
                                    <div className="flex items-center gap-2 text-stone-400">Not Urgent <ArrowRight className="w-3 h-3" /></div>
                                </div>

                                <div className="flex-grow flex relative">
                                    {/* Left Axis Label */}
                                    <div className="w-8 flex flex-col justify-between py-12 items-center text-xs font-bold uppercase tracking-widest text-stone-400 select-none mr-3">
                                        <div className="writing-mode-vertical rotate-180 flex items-center gap-2 text-emerald-600/70"><Target className="w-3 h-3" /> Important</div>
                                        <div className="writing-mode-vertical rotate-180 flex items-center gap-2 text-stone-400">Not Important <ArrowLeft className="w-3 h-3" /></div>
                                    </div>

                                    {/* The Grid */}
                                    <div className="flex-grow grid grid-cols-2 grid-rows-2 gap-6 h-full max-h-[calc(100vh-180px)]">
                                        {QUADRANTS.map(q => {
                                            const items = filteredFeatures.filter(f => f.eisenhowerQuadrant === q.id && f.status !== 'Done');
                                            return (
                                                <div
                                                    key={q.id}
                                                    onDragOver={(e) => handleDragOver(e, q.id)}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={(e) => handleDrop(e, q.id)}
                                                    className={`
                                                    relative flex flex-col h-full rounded-xl border transition-all group overflow-hidden bg-white shadow-sm hover:shadow-md
                                                    ${dragOverQuadrant === q.id ? 'border-nobel-gold border-dashed ring-4 ring-nobel-gold/10 bg-nobel-gold/5' : 'border-stone-200'}
                                                `}
                                                >
                                                    {/* Header */}
                                                    <div className={`px-5 py-4 border-b border-stone-100 flex items-center justify-between ${q.bg}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-lg bg-white shadow-sm ${q.text.replace('text-', 'text-opacity-80 ')}`}>
                                                                <q.icon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <h3 className={`font-serif text-lg font-bold ${q.text}`}>{q.label}</h3>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 opacity-70">{q.sub}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-stone-400 bg-white/50 px-2 py-1 rounded-full border border-stone-100">
                                                            {items.length}
                                                        </span>
                                                    </div>

                                                    {/* Task Container */}
                                                    <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-stone-50/30">
                                                        {items.length === 0 ? (
                                                            <div className="h-full flex items-center justify-center opacity-40">
                                                                <button
                                                                    onClick={() => openAddModal(q.id)}
                                                                    className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2 border-b border-transparent hover:border-stone-400 transition-all pb-0.5"
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add Task
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            items.map(f => <TaskCard key={f.id} f={f} />)
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'list' && (
                            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                {QUADRANTS.map(q => {
                                    const items = filteredFeatures.filter(f => f.eisenhowerQuadrant === q.id && f.status !== 'Done');
                                    return (
                                        <div
                                            key={q.id}
                                            className={`bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col transition-all
                                            ${dragOverQuadrant === q.id ? 'ring-2 ring-nobel-gold border-nobel-gold' : ''}
                                        `}
                                            onDragOver={(e) => handleDragOver(e, q.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, q.id)}
                                        >
                                            <div className={`px-5 py-4 border-b border-stone-100 flex items-center justify-between border-l-4 ${q.color} bg-stone-50/50`}>
                                                <div className="flex items-center gap-3">
                                                    <q.icon className={`w-4 h-4 ${q.text}`} />
                                                    <h3 className="font-serif text-lg font-bold text-stone-900">{q.label}</h3>
                                                </div>
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{q.sub}</span>
                                            </div>

                                            <div className="divide-y divide-stone-50 flex-grow max-h-[400px] overflow-y-auto">
                                                {items.length === 0 && (
                                                    <div className="p-8 text-center text-stone-400 text-sm italic">
                                                        No tasks in this quadrant.
                                                    </div>
                                                )}
                                                {items.map(f => (
                                                    <div
                                                        key={f.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, f.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`p-4 hover:bg-stone-50 transition-colors flex justify-between items-start group cursor-grab active:cursor-grabbing
                                                        ${draggedFeatureId === f.id ? 'opacity-50' : ''}
                                                    `}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <button
                                                                onClick={() => toggleComplete(f.id, f.status)}
                                                                className="mt-0.5 w-4 h-4 rounded-full border border-stone-300 hover:border-nobel-gold flex-shrink-0"
                                                            ></button>
                                                            <div>
                                                                <div className="font-bold text-stone-800 text-sm flex items-center gap-2">
                                                                    {f.title}
                                                                    {/* Attribution Badge in List View */}
                                                                    {(f.tags?.includes('AI Assisted') || f.source === 'AI') && <AttributionBadge type="AI Assisted" size="xs" />}
                                                                    {(f.tags?.includes('Human Edited') || f.source === 'Human') && <AttributionBadge type="Human Edited" size="xs" />}
                                                                </div>
                                                                {f.description && <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{f.description}</div>}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleDelete(f.id)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-3 border-t border-stone-100 bg-stone-50/30">
                                                <button
                                                    onClick={() => openAddModal(q.id)}
                                                    className="w-full py-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-nobel-gold flex items-center justify-center gap-2 hover:bg-white rounded transition-all"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Item
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {viewMode === 'completed' && (
                            <div className="max-w-3xl mx-auto">
                                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
                                        <h3 className="font-serif text-lg font-bold text-stone-900">Completed Tasks</h3>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {completed.length} Done
                                        </span>
                                    </div>
                                    <div className="divide-y divide-stone-100">
                                        {completed.length === 0 ? (
                                            <div className="p-12 text-center text-stone-400 italic flex flex-col items-center">
                                                <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                                                Nothing completed yet. Get to work!
                                            </div>
                                        ) : (
                                            completed.map(f => (
                                                <div key={f.id} className="p-4 flex justify-between items-center group hover:bg-stone-50 transition-colors">
                                                    <div className="flex items-center gap-3 opacity-50">
                                                        <button
                                                            onClick={() => toggleComplete(f.id, f.status)}
                                                            className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <span className="font-bold text-stone-800 text-sm line-through">{f.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-1 rounded">{f.eisenhowerQuadrant || 'Uncategorized'}</span>
                                                        <button onClick={() => handleDelete(f.id)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>


                </div>



                {/* DELETE CONFIRMATION MODAL */}
                {
                    deleteConfirmId && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-serif text-xl text-stone-900 mb-2">Delete this task?</h3>
                                <p className="text-stone-500 text-sm mb-6">This action cannot be undone.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="flex-1 py-2.5 border border-stone-200 rounded-lg text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-2.5 bg-red-600 rounded-lg text-sm font-bold text-white hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }



                <style>{`
                .writing-mode-vertical {
                    writing-mode: vertical-rl;
                }
            `}</style>
                {/* PHILOSOPHY SHEET */}
                <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${showPhilosophy ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${showPhilosophy ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => setShowPhilosophy(false)}
                    />

                    {/* Sheet */}
                    <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out pointer-events-auto flex flex-col ${showPhilosophy ? 'translate-x-0' : 'translate-x-full'}`}>
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#F9F8F4]">
                            <h2 className="font-serif text-2xl font-bold text-stone-900 flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-stone-900" />
                                The Method
                            </h2>
                            <button
                                onClick={() => setShowPhilosophy(false)}
                                className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500 hover:text-stone-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-8 space-y-8">

                            <section>
                                <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
                                    <Quote className="w-4 h-4 text-nobel-gold" />
                                    The Philosophy
                                </h3>
                                <p className="text-stone-600 leading-relaxed text-sm">
                                    "What is important is seldom urgent, and what is urgent is seldom important."
                                    <br /><br />
                                    This decision matrix helps you distinguish between what's truly clear and high-impact versus what's just loud and distracting. The goal is to spend more time in the <strong>Schedule</strong> quadrant (Strategy) and less in the <strong>Do</strong> quadrant (Firefighting).
                                </p>
                            </section>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-stone-900">The 4 Quadrants</h3>

                                <div className="grid grid-cols-1 gap-4">
                                    {/* Do First */}
                                    <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-serif text-stone-900 font-bold text-base">1. Do First</h4>
                                        </div>
                                        <p className="text-stone-600 text-xs leading-relaxed pl-11">
                                            <span className="font-bold text-emerald-700 block mb-1">Urgent & Important</span>
                                            Crises, deadlines, and problems that require immediate attention. Living here leads to burnout.
                                        </p>
                                    </div>

                                    {/* Schedule */}
                                    <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-serif text-stone-900 font-bold text-base">2. Schedule</h4>
                                        </div>
                                        <p className="text-stone-600 text-xs leading-relaxed pl-11">
                                            <span className="font-bold text-blue-700 block mb-1">Not Urgent, but Important</span>
                                            Strategic planning, relationship building, and personal growth. This is where success is built.
                                        </p>
                                    </div>

                                    {/* Delegate */}
                                    <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-serif text-stone-900 font-bold text-base">3. Delegate</h4>
                                        </div>
                                        <p className="text-stone-600 text-xs leading-relaxed pl-11">
                                            <span className="font-bold text-amber-700 block mb-1">Urgent, Not Important</span>
                                            Interruptions, most meetings, and other people's priorities. Delegate or automate these.
                                        </p>
                                    </div>

                                    {/* Eliminate */}
                                    <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-stone-100 text-stone-500 group-hover:bg-stone-200 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-serif text-stone-900 font-bold text-base">4. Eliminate</h4>
                                        </div>
                                        <p className="text-stone-600 text-xs leading-relaxed pl-11">
                                            <span className="font-bold text-stone-500 block mb-1">Not Urgent & Not Important</span>
                                            Time wasters, busy work, and excessive entertainment. Cut these ruthlessly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <section className="bg-nobel-gold/10 p-5 rounded-xl border border-nobel-gold/20">
                                <h3 className="font-bold text-nobel-gold mb-2 text-sm uppercase tracking-wide">Key Takeaway</h3>
                                <p className="text-stone-700 text-sm leading-relaxed">
                                    Effective founders don't just work hard; they work on the right things. Use this tool to protect your time for high-leverage strategic work.
                                </p>
                            </section>

                        </div>
                    </div>

                    {/* Add Task Modal */}
                    {isAddModalOpen && (
                        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                                    <h3 className="font-serif text-xl font-bold text-stone-900">
                                        {editingFeatureId ? 'Edit Task' : 'New Task'}
                                    </h3>
                                    <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 overflow-y-auto">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Task Title</label>
                                        <input
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="What needs to be done?"
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 font-medium"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Description (Optional)</label>
                                        <textarea
                                            value={newTaskDesc}
                                            onChange={(e) => setNewTaskDesc(e.target.value)}
                                            placeholder="Add details..."
                                            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-sm h-24 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Priority Quadrant</label>
                                            <select
                                                value={targetQuadrant}
                                                onChange={(e) => setTargetQuadrant(e.target.value as any)}
                                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-sm"
                                            >
                                                <option value="Uncategorized">Backlog</option>
                                                <option value="Do">Do First (Urgent & Important)</option>
                                                <option value="Schedule">Schedule (Important)</option>
                                                <option value="Delegate">Delegate (Urgent)</option>
                                                <option value="Eliminate">Eliminate (Neither)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-1">Tags</label>
                                            <input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && tagInput.trim()) {
                                                        e.preventDefault();
                                                        if (!taskTags.includes(tagInput.trim())) {
                                                            setTaskTags([...taskTags, tagInput.trim()]);
                                                        }
                                                        setTagInput('');
                                                    }
                                                }}
                                                placeholder="Enter..."
                                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* OKR Connection Section */}
                                    <div className="pt-2 border-t border-stone-100">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-2 flex items-center gap-2">
                                            <Target className="w-3 h-3" /> Connect to Objective
                                        </label>
                                        <div className="space-y-3">
                                            <select
                                                value={selectedGoalId}
                                                onChange={(e) => {
                                                    setSelectedGoalId(e.target.value);
                                                    setSelectedKeyResultId(''); // Reset KR when goal changes
                                                }}
                                                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-sm"
                                            >
                                                <option value="">Select an Objective...</option>
                                                {activeGoals.map(g => (
                                                    <option key={g.id} value={g.id}>{g.title}</option>
                                                ))}
                                            </select>

                                            {selectedGoalId && (
                                                <select
                                                    value={selectedKeyResultId}
                                                    onChange={(e) => setSelectedKeyResultId(e.target.value)}
                                                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-sm"
                                                    disabled={keyResultsForSelectedGoal.length === 0}
                                                >
                                                    <option value="">Select a Key Result...</option>
                                                    {keyResultsForSelectedGoal.map(kr => (
                                                        <option key={kr.id} value={kr.id}>{kr.description}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {taskTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {taskTags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded-md flex items-center gap-1">
                                                    #{tag}
                                                    <button onClick={() => setTaskTags(taskTags.filter(t => t !== tag))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                </div>

                                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-stone-500 hover:text-stone-700 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveTask}
                                        disabled={!newTaskTitle.trim()}
                                        className="px-6 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {editingFeatureId ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default EisenhowerMatrix;
