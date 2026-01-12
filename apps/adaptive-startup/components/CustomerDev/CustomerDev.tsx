import React, { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from "../../convex/_generated/api";
import { useCreateCustomerInterview, useCreateFeature } from '../../hooks/useCreate';
import { StartupData, CustomerInterview, AISettings, CustomerStatus, RolePermissions } from '../../types';
import { analyzeCustomerFeedback } from '../../services/geminiService';
import { Upload, Plus, Search, Trash2, ChevronDown, Check, LayoutGrid, X, User, Brain, Loader2, Sparkles, MessageSquare, ChevronLeft, ChevronRight, Video, FileText, Play, Eye, Home } from 'lucide-react';
import TabNavigation from '../TabNavigation';
import ProjectSelector from '../ProjectSelector';
import CustomSelect from '../CustomSelect';
import { toast } from "sonner";
import { Logo } from '../Logo';

interface CustomerDevProps {
    data: StartupData;
    allProjects: StartupData[];
    onUpdateProject: (updater: (project: StartupData) => StartupData) => void;
    onSwitchProject: (id: string) => void;
    onNewProject: () => void;
    onNavigate: (view: any) => void;
    currentView: any;
    settings: AISettings;
    allowedPages?: string[];
    permissions?: RolePermissions;
}

// Simple pill for sentiment
const SentimentBadge = ({ sentiment }: { sentiment?: string }) => {
    if (!sentiment) return null;
    const colors = {
        'Positive': 'bg-green-100 text-green-700 border-green-200',
        'Neutral': 'bg-stone-100 text-stone-700 border-stone-200',
        'Negative': 'bg-red-100 text-red-700 border-red-200'
    };
    const colorClass = colors[sentiment as keyof typeof colors] || colors.Neutral;
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {sentiment}
        </span>
    );
};

const defaultHeaders = ['Name', 'Role', 'Organization', 'Email', 'Notes', 'Pain Points', 'Survey Feedback', 'Willingness to Pay ($)'];

const CustomerDev: React.FC<CustomerDevProps> = ({
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
    // Permission Verification
    const canEdit = permissions ? (permissions.global?.edit ?? false) : true;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState<'feedback' | 'video'>('feedback');

    // Sheet State
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedVideoInterview, setSelectedVideoInterview] = useState<any | null>(null);

    // Add Video Interview State
    const [showAddVideoModal, setShowAddVideoModal] = useState(false);
    const [newVideoName, setNewVideoName] = useState('');
    const [newVideoEmail, setNewVideoEmail] = useState('');
    const [newVideoLinkedId, setNewVideoLinkedId] = useState('');
    const [waiverFile, setWaiverFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const replaceVideoRef = useRef<HTMLInputElement>(null);
    const replaceWaiverRef = useRef<HTMLInputElement>(null);

    const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'waiver') => {
        const file = e.target.files?.[0];
        if (!file || !selectedInterviewId) return;

        const linkedWrapper = linkedVideosMap.get(selectedInterviewId);
        if (!linkedWrapper) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            await updateVideoInterview({
                id: linkedWrapper._id,
                [type === 'video' ? 'videoFileId' : 'waiverFileId']: storageId
            });
            toast.success(`${type === 'video' ? 'Video' : 'Waiver'} updated successfully`);
        } catch (error) {
            console.error("Replace failed:", error);
            toast.error("Failed to update file");
        } finally {
            setIsUploading(false);
            if (replaceVideoRef.current) replaceVideoRef.current.value = '';
            if (replaceWaiverRef.current) replaceWaiverRef.current.value = '';
        }
    };

    // Add Entry Modal State
    const [showAddEntryModal, setShowAddEntryModal] = useState(false);
    const [newEntryData, setNewEntryData] = useState<Record<string, string>>({});

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Default headers if no data
    // Header Logic
    const allKeys = new Set<string>();
    data.customerInterviews.forEach(i => Object.keys(i).forEach(k => allKeys.add(k)));
    const ignoredKeys = ['id', 'sentiment', 'aiAnalysis', 'customerStatus', 'Video', 'Waiver', 'willingnessToPay'];
    const dynamicHeaders = Array.from(allKeys).filter(k => !ignoredKeys.includes(k) && k !== 'Status');
    const headers = ['Status', ...dynamicHeaders.length > 0 ? dynamicHeaders : defaultHeaders.filter(h => h !== 'Status'), 'Video', 'Waiver'];

    // Derived state for selected interview
    const selectedInterview = data.customerInterviews.find(i => i.id === selectedInterviewId);

    // Mutations & Queries
    const bulkAdd = useMutation(api.customers.bulkAddInterviews);
    const addInterview = useCreateCustomerInterview();
    const updateInterview = useMutation(api.customers.updateInterview);
    const deleteInterview = useMutation(api.customers.deleteInterview);
    const bulkDelete = useMutation(api.customers.bulkDeleteInterviews);

    const videoInterviews = useQuery(api.customers.getVideoInterviews, { projectId: data.id }) || [];
    const generateUploadUrl = useMutation(api.customers.generateUploadUrl);
    const saveVideoInterview = useMutation(api.customers.saveVideoInterview);
    const deleteVideoInterview = useMutation(api.customers.deleteVideoInterview);
    const updateProject = useMutation(api.projects.update);
    const updateVideoInterview = useMutation(api.customers.updateVideoInterview);
    const addFeatureMutation = useCreateFeature();

    // File System Data
    const allFiles = useQuery(api.files.getAllFileSystem, { projectId: data.id });
    const videoFiles = allFiles?.files.filter(f => f.type.startsWith('video/')) || [];
    const documentFiles = allFiles?.files.filter(f => !f.type.startsWith('video/') && !f.type.startsWith('image/')) || [];

    // Helper to parse/format Willingness to Pay
    const willingnessValue = newEntryData['Willingness to Pay ($)'] || '';
    const isPaying = willingnessValue && willingnessValue !== 'No' && !willingnessValue.startsWith('No ');
    const interestStatus = willingnessValue.startsWith('$') ? 'Yes' : (willingnessValue === 'Maybe' ? 'Maybe' : 'No');
    const priceValue = willingnessValue.startsWith('$') ? willingnessValue.replace('$', '') : '';

    // Derived state for linked videos
    const linkedVideosMap = React.useMemo(() => {
        const map = new Map();
        if (videoInterviews) {
            videoInterviews.forEach((v: any) => {
                if (v.linkedInterviewId) {
                    map.set(v.linkedInterviewId, v);
                }
            });
        }
        return map;
    }, [videoInterviews]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;

                // Robust CSV Parser
                const rows: string[][] = [];
                let currentRow: string[] = [];
                let currentCell = '';
                let insideQuote = false;

                // Normalize line endings
                const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                for (let i = 0; i < normalizedText.length; i++) {
                    const char = normalizedText[i];
                    const nextChar = normalizedText[i + 1];

                    if (insideQuote) {
                        if (char === '"' && nextChar === '"') {
                            currentCell += '"';
                            i++;
                        } else if (char === '"') {
                            insideQuote = false;
                        } else {
                            currentCell += char;
                        }
                    } else {
                        if (char === '"') {
                            insideQuote = true;
                        } else if (char === ',') {
                            currentRow.push(currentCell.trim());
                            currentCell = '';
                        } else if (char === '\n') {
                            currentRow.push(currentCell.trim());
                            if (currentRow.some(c => c !== '')) rows.push(currentRow);
                            currentRow = [];
                            currentCell = '';
                        } else {
                            currentCell += char;
                        }
                    }
                }
                if (currentCell || currentRow.length > 0) {
                    currentRow.push(currentCell.trim());
                    if (currentRow.some(c => c !== '')) rows.push(currentRow);
                }

                if (rows.length === 0) {
                    toast.error("CSV file is empty");
                    return;
                }

                const csvHeaders = rows[0].map(h => h.trim());
                const newInterviews: any[] = [];

                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i];
                    // Skip empty rows
                    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

                    const interview: any = {};

                    csvHeaders.forEach((header, index) => {
                        interview[header] = values[index] || '';
                    });
                    newInterviews.push(interview);
                }

                if (newInterviews.length === 0) {
                    toast.error("No valid data found in CSV");
                    return;
                }

                // Persist to Backend
                await bulkAdd({
                    projectId: data.id,
                    interviews: newInterviews.map(i => {
                        const { Status, ...custom } = i;
                        return {
                            customerStatus: Status || 'Not Yet Closed',
                            customData: JSON.stringify(custom)
                        };
                    })
                });

                toast.success(`Successfully imported ${newInterviews.length} interviews`);
            } catch (error) {
                console.error("CSV Import Error:", error);
                toast.error("Failed to import CSV. Please check the file format.");
            } finally {
                // Reset file input so the same file can be selected again
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
            toast.error("Failed to read file");
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();

        const newInterview: CustomerInterview = {
            id: Date.now().toString(),
            customerStatus: 'Not Yet Closed',
            ...newEntryData
        };

        // Ensure all headers exist
        headers.forEach(h => {
            if (h !== 'Status' && !newInterview[h]) newInterview[h] = '';
        });

        const { id, customerStatus, ...custom } = newInterview;

        // Extract Schema Fields from Custom Data
        const willingnessKey = 'Willingness to Pay ($)';
        const willingnessToPay = custom[willingnessKey] as string | undefined;
        if (willingnessToPay) {
            delete custom[willingnessKey];
        }

        // Optimistic update
        onUpdateProject(p => ({
            ...p,
            customerInterviews: [newInterview, ...p.customerInterviews]
        }));

        await addInterview({
            projectId: data.id,
            customerStatus: customerStatus || 'Not Yet Closed',
            customData: JSON.stringify(custom),
            willingnessToPay: willingnessToPay
        });

        setShowAddEntryModal(false);
        setNewEntryData({});
        toast.success("Interview added", { icon: <Check className="w-4 h-4 text-black" /> });
    };

    const handleUpdateCell = (id: string, field: string, value: string) => {
        onUpdateProject(p => ({
            ...p,
            customerInterviews: p.customerInterviews.map(i =>
                i.id === id ? { ...i, [field]: value } : i
            )
        }));

        const interview = data.customerInterviews.find(i => i.id === id);
        if (interview) {
            const { id: _id, customerStatus, sentiment, aiAnalysis, ...rest } = interview;

            // Apply update
            const updatedObject: any = { ...rest, [field]: value };

            // Extract Schema Fields
            const willingnessKey = 'Willingness to Pay ($)';
            const willingnessToPay = updatedObject[willingnessKey];

            // Clean payload
            delete updatedObject[willingnessKey];
            delete updatedObject['willingnessToPay'];

            updateInterview({
                id: id as any,
                customData: JSON.stringify(updatedObject),
                willingnessToPay: willingnessToPay
            });
        }
    };

    const handleUpdateStatus = (id: string, status: CustomerStatus) => {
        onUpdateProject(p => ({
            ...p,
            customerInterviews: p.customerInterviews.map(i =>
                i.id === id ? { ...i, customerStatus: status } : i
            )
        }));
        updateInterview({
            id: id as any,
            customerStatus: status
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this record?')) {
            onUpdateProject(p => ({
                ...p,
                customerInterviews: p.customerInterviews.filter(i => i.id !== id)
            }));
            if (selectedInterviewId === id) setSelectedInterviewId(null);
            deleteInterview({ id: id as any });
            toast.success("Interview deleted", { icon: <Trash2 className="w-4 h-4 text-black" /> });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Delete ${selectedIds.size} selected interviews?`)) {
            const idsToDelete = Array.from(selectedIds);
            onUpdateProject(p => ({
                ...p,
                customerInterviews: p.customerInterviews.filter(i => !selectedIds.has(i.id))
            }));
            setSelectedIds(new Set());
            if (selectedInterviewId && selectedIds.has(selectedInterviewId)) setSelectedInterviewId(null);
            await bulkDelete({ ids: idsToDelete as any });
            toast.success("Interviews deleted", { icon: <Trash2 className="w-4 h-4 text-black" /> });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedInterviews.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedInterviews.map(i => i.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleAddColumn = () => {
        const name = prompt("Enter new column name:");
        if (name && !headers.includes(name)) {
            onUpdateProject(p => ({
                ...p,
                customerInterviews: p.customerInterviews.map(i => ({ ...i, [name]: '' }))
            }));
        }
    };

    const handleRunAnalysis = async () => {
        if (!selectedInterview) return;
        setIsAnalyzing(true);
        const result = await analyzeCustomerFeedback(selectedInterview, settings);
        onUpdateProject(p => ({
            ...p,
            customerInterviews: p.customerInterviews.map(i =>
                i.id === selectedInterview.id
                    ? { ...i, sentiment: result.sentiment, aiAnalysis: result.aiAnalysis }
                    : i
            )
        }));

        // Persist to backend
        await updateInterview({
            id: selectedInterview.id as any,
            sentiment: result.sentiment,
            aiAnalysis: result.aiAnalysis
        });

        setIsAnalyzing(false);
    };

    const handleCreateRoadmapTask = async () => {
        if (!selectedInterview || !selectedInterview.aiAnalysis) return;

        try {
            await addFeatureMutation({
                projectId: data.id,
                title: `Insight from ${selectedInterview.Name || 'Interview'}`,
                description: selectedInterview.aiAnalysis,
                status: 'Backlog',
                priority: selectedInterview.sentiment === 'Negative' ? 'High' : 'Medium',
                tags: ['Customer Insight'],
            });
            toast.success("Task added to Roadmap", {
                description: "Go to Product Hub > Roadmap to view/edit."
            });
        } catch (error) {
            console.error("Failed to create task:", error);
            toast.error("Failed to create task");
        }
    };

    // --- Video Interview Handlers ---
    const handleAddVideoInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVideoName || !newVideoEmail) return;
        setIsUploading(true);

        try {
            let waiverId = undefined;
            let videoId = undefined;

            if (waiverFile) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": waiverFile.type },
                    body: waiverFile,
                });
                const { storageId } = await result.json();
                waiverId = storageId;
            }

            if (videoFile) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": videoFile.type },
                    body: videoFile,
                });
                const { storageId } = await result.json();
                videoId = storageId;
            }

            await saveVideoInterview({
                projectId: data.id,
                name: newVideoName,
                email: newVideoEmail,
                waiverFileId: waiverId,
                videoFileId: videoId,
                linkedInterviewId: newVideoLinkedId || undefined
            });

            setShowAddVideoModal(false);
            setNewVideoName('');
            setNewVideoEmail('');
            setNewVideoLinkedId('');
            setWaiverFile(null);
            setVideoFile(null);
            toast.success("Video interview added", { icon: <Video className="w-4 h-4 text-black" /> });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload files. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteVideoInterview = (id: string) => {
        toast("Delete this interview?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    await deleteVideoInterview({ id: id as any });
                    if (selectedVideoInterview?._id === id) setSelectedVideoInterview(null);
                    toast.success("Video interview deleted", { icon: <Trash2 className="w-4 h-4 text-black" /> });
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };


    // Filter Logic
    const filteredInterviews = data.customerInterviews.filter(i =>
        Object.values(i).some(val => typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredInterviews.length / itemsPerPage);
    const paginatedInterviews = filteredInterviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-nobel-cream canvas-pattern text-stone-900 font-sans" style={{ backgroundSize: '24px 24px' }}>
            {/* Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between border-b border-stone-200">
                <div className="flex items-center gap-4">
                    <Logo imageClassName="h-8 w-auto" />
                    <div className="h-6 w-px bg-stone-200" />
                    {/* ProjectSelector temporarily disabled
                    <ProjectSelector
                        projects={allProjects}
                        currentProjectId={data.id}
                        onSelectProject={onSwitchProject}
                        onCreateNew={onNewProject}
                    />
                    <div className="h-6 w-px bg-stone-200" />
                    */}
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
                    {/* Hub Button */}
                    <button
                        onClick={() => onNavigate('MARKET')}
                        className="px-4 py-2 bg-nobel-gold text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#A38035] transition-colors flex items-center gap-2"
                    >
                        <Home className="w-4 h-4" /> HUB
                    </button>

                    {canEdit && (
                        <button
                            onClick={() => {
                                setNewEntryData({});
                                setShowAddEntryModal(true);
                            }}
                            className="bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors flex items-center gap-2 shadow-md"
                        >
                            <Plus className="w-4 h-4" /> Add Interview
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-grow flex flex-col relative">
                {/* Active Header */}
                <div className="relative h-64 w-full bg-stone-900 overflow-hidden shrink-0">
                    <img
                        src="/images/hero-carousel-3.png"
                        alt="Customer Discovery"
                        className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent"></div>
                    <div className="relative z-10 px-12 h-full flex flex-col justify-center max-w-7xl mx-auto w-full">
                        <span className="text-nobel-gold font-medium tracking-wider uppercase text-xs mb-2 block">Customer Development</span>
                        <h2
                            className={`text-4xl md:text-5xl font-serif text-white mb-2 outline-none focus:ring-2 focus:ring-nobel-gold/20 rounded px-1 -ml-1 cursor-text transition-colors ${canEdit ? 'hover:bg-white/10' : ''}`}
                            contentEditable={canEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newTitle = e.currentTarget.textContent || "Customer Discovery";
                                onUpdateProject(p => ({ ...p, customerDiscoveryTitle: newTitle }));
                                updateProject({ id: data.id as any, updates: { customerDiscoveryTitle: newTitle } });
                            }}
                        >
                            {data.customerDiscoveryTitle || "Customer Discovery"}
                        </h2>
                        <p className="text-gray-300 text-lg">"Get out of the building." Log interviews, validate hypotheses, and calculate ARPU through target surveys.</p>
                    </div>
                </div>

                <div className={`flex-grow p-8 transition-all duration-300 ${selectedInterviewId || selectedVideoInterview ? 'mr-96' : ''}`}>
                    <div className="max-w-[1600px] mx-auto flex flex-col">

                        {/* Unified Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-stone-200 pb-6">
                            {/* Left: Tabs */}
                            <div className="flex bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
                                <button
                                    onClick={() => setActiveTab('feedback')}
                                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'feedback' ? 'bg-stone-900 text-white shadow' : 'text-stone-500 hover:bg-stone-50'}`}
                                >
                                    <MessageSquare className="w-3 h-3" /> Interviews
                                </button>
                                <button
                                    onClick={() => setActiveTab('video')}
                                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'video' ? 'bg-stone-900 text-white shadow' : 'text-stone-500 hover:bg-stone-50'}`}
                                >
                                    <Video className="w-3 h-3" /> Video Interviews
                                </button>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3">
                                {activeTab === 'feedback' ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or organization..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-xs focus:outline-none focus:border-nobel-gold w-64 transition-all shadow-sm"
                                            />
                                        </div>
                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-2 bg-white border border-stone-200 hover:border-nobel-gold hover:text-nobel-gold px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                                                >
                                                    <Upload className="w-4 h-4" /> Import CSV
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                    accept=".csv"
                                                    className="hidden"
                                                />
                                            </>
                                        )}
                                    </>
                                ) : (
                                    canEdit && (
                                        <button
                                            onClick={() => setShowAddVideoModal(true)}
                                            className="bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" /> Add Interview
                                        </button>
                                    )
                                )}
                                {selectedIds.size > 0 && activeTab === 'feedback' && canEdit && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="ml-2 bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-red-200 transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeTab === 'feedback' ? (
                            paginatedInterviews.length === 0 ? (
                                <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-16 p-8 min-h-[600px]">
                                    {/* Text Content */}
                                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 max-w-lg w-full flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                            <User className="w-8 h-8 text-stone-900" />
                                        </div>
                                        <h3 className="font-serif text-3xl text-stone-900 mb-4">Start Your Customer Discovery</h3>
                                        <p className="text-stone-500 leading-relaxed mb-8 text-lg">
                                            <span className="font-bold text-stone-900 block mb-2">Why this matters:</span>
                                            Building in a vacuum is risky. Talk to potential customers to validate your problem, understand their pain points, and de-risk your venture.
                                        </p>
                                        {canEdit && (
                                            <button
                                                onClick={() => {
                                                    setNewEntryData({});
                                                    setShowAddEntryModal(true);
                                                }}
                                                className="bg-stone-900 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors shadow-lg"
                                            >
                                                Log First Interview
                                            </button>
                                        )}
                                    </div>
                                    {/* Image */}
                                    <img
                                        src="/images/hero-carousel-4.png"
                                        alt="Customer Feedback Analytics"
                                        className="h-[500px] w-auto rounded-2xl border-8 border-white shadow-xl object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex-grow flex flex-col">
                                    <div className="overflow-x-auto flex-grow">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-[#F5F4F0] sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 border-b border-stone-200 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={paginatedInterviews.length > 0 && selectedIds.size === paginatedInterviews.length}
                                                            onChange={toggleSelectAll}
                                                            className="rounded border-stone-300 text-nobel-gold focus:ring-nobel-gold"
                                                            disabled={!canEdit}
                                                        />
                                                    </th>
                                                    {headers.map(header => (
                                                        <th key={header} className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500 whitespace-nowrap">
                                                            {header}
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-4 border-b border-stone-200 w-10">
                                                        {canEdit && (
                                                            <button onClick={handleAddColumn} className="p-1 hover:bg-stone-200 rounded">
                                                                <Plus className="w-3 h-3 text-stone-400" />
                                                            </button>
                                                        )}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {paginatedInterviews.map((interview) => (
                                                    <tr
                                                        key={interview.id}
                                                        onClick={() => setSelectedInterviewId(interview.id)}
                                                        className={`hover:bg-[#F9F8F4] transition-colors cursor-pointer group ${selectedInterviewId === interview.id ? 'bg-[#F5F4F0]' : ''}`}
                                                    >
                                                        <td className="px-6 py-4 align-top w-10" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(interview.id)}
                                                                onChange={() => toggleSelect(interview.id)}
                                                                className="rounded border-stone-300 text-nobel-gold focus:ring-nobel-gold"
                                                                disabled={!canEdit}
                                                            />
                                                        </td>
                                                        {headers.map(header => (
                                                            <td key={header} className="px-6 py-4 align-top">
                                                                {header === 'Status' ? (
                                                                    <CustomSelect
                                                                        value={interview.customerStatus}
                                                                        onChange={(val) => handleUpdateStatus(interview.id, val)}
                                                                        options={[
                                                                            { label: 'Networking', value: 'Networking', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                                                                            { label: 'Outreach Sent', value: 'Outreach Sent', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                                                            { label: 'Scheduled', value: 'Scheduled', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                                                            { label: 'Interviewed', value: 'Interviewed', color: 'bg-teal-100 text-teal-700 border-teal-200' },
                                                                            { label: 'Follow-up Needed', value: 'Follow-up Needed', color: 'bg-pink-100 text-pink-700 border-pink-200' },
                                                                            { label: 'Potential Fit', value: 'Potential Fit', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                                                            { label: 'Subscriber', value: 'Subscriber', color: 'bg-green-100 text-green-700 border-green-200' },
                                                                            { label: 'Abandoned', value: 'Abandoned', color: 'bg-red-100 text-red-700 border-red-200' },
                                                                            { label: 'Not Yet Closed', value: 'Not Yet Closed', color: 'bg-stone-100 text-stone-600 border-stone-200' }
                                                                        ]}
                                                                        className={`w-32 ${!canEdit ? 'opacity-70 pointer-events-none' : ''}`}
                                                                    />
                                                                ) : header === 'Video' ? (
                                                                    <div className="flex justify-center">
                                                                        {linkedVideosMap.get(interview.id)?.videoUrl ? (
                                                                            <Video className="w-5 h-5 text-stone-900" />
                                                                        ) : <span className="text-stone-300">-</span>}
                                                                    </div>
                                                                ) : header === 'Waiver' ? (
                                                                    <div className="flex justify-center">
                                                                        {linkedVideosMap.get(interview.id)?.waiverUrl ? (
                                                                            <FileText className="w-5 h-5 text-nobel-gold" />
                                                                        ) : <span className="text-stone-300">-</span>}
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        contentEditable={canEdit}
                                                                        suppressContentEditableWarning
                                                                        onBlur={(e) => canEdit && handleUpdateCell(interview.id, header, e.currentTarget.textContent || '')}
                                                                        className={`outline-none focus:bg-white focus:ring-2 focus:ring-nobel-gold/20 rounded p-1 min-h-[1.5em] line-clamp-3 overflow-hidden ${!canEdit ? 'cursor-default' : ''}`}
                                                                    >
                                                                        {interview[header]}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="px-6 py-4 text-center">
                                                            {canEdit && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(interview.id); }}
                                                                    className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination */}
                                    <div className="border-t border-stone-200 p-4 flex justify-between items-center bg-white">
                                        <div className="text-xs text-stone-500 font-medium">
                                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInterviews.length)} of {filteredInterviews.length} entries
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 transition-colors shadow-sm"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 transition-colors shadow-sm"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : videoInterviews.length === 0 ? (
                            <div className="flex-grow flex flex-col md:flex-row items-center justify-center gap-16 p-8 min-h-[600px]">
                                {/* Left: Text Content */}
                                <div className="bg-white rounded-2xl p-12 shadow-sm border border-stone-100 max-w-lg w-full flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                        <Video className="w-8 h-8 text-stone-900" />
                                    </div>
                                    <h3 className="font-serif text-3xl text-stone-900 mb-4">Capture Deep Insights</h3>
                                    <p className="text-stone-500 leading-relaxed mb-8 text-lg">
                                        <span className="font-bold text-stone-900 block mb-2">Why Video?</span>
                                        Communication is 90% non-verbal. Recording customer interviews captures tone, hesitation, and excitement that text notes miss.
                                    </p>
                                    {canEdit && (
                                        <button
                                            onClick={() => setShowAddVideoModal(true)}
                                            className="bg-stone-900 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors shadow-lg flex items-center gap-3"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Video Interview
                                        </button>
                                    )}
                                </div>

                                {/* Right: Image */}
                                <img
                                    src="/images/hero-carousel-1.png"
                                    alt="Video Interview Session"
                                    className="h-[500px] w-auto rounded-2xl border-8 border-white shadow-xl object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex-grow">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-[#F5F4F0]">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500">Name</th>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500">Email</th>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500">Linked Interview</th>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500 text-center">Waiver</th>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500 text-center">Video</th>
                                            <th className="px-6 py-4 border-b border-stone-200 font-bold uppercase text-[10px] tracking-widest text-stone-500 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {videoInterviews.map((interview: any) => (
                                            <tr
                                                key={interview._id}
                                                className={`hover:bg-[#F9F8F4] transition-colors cursor-pointer group ${selectedVideoInterview?._id === interview._id ? 'bg-[#F5F4F0]' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-bold text-stone-900" onClick={() => setSelectedVideoInterview(interview)}>{interview.name}</td>
                                                <td className="px-6 py-4 text-stone-600" onClick={() => setSelectedVideoInterview(interview)}>{interview.email}</td>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    {canEdit ? (
                                                        <CustomSelect
                                                            value={interview.linkedInterviewId || ''}
                                                            onChange={(val) => updateVideoInterview({ id: interview._id, linkedInterviewId: val })}
                                                            options={[
                                                                { label: 'Unlinked', value: '', color: 'bg-stone-50 text-stone-500 border-stone-200' },
                                                                ...data.customerInterviews.map(ci => ({
                                                                    label: ci.Name || 'Unnamed',
                                                                    value: ci.id,
                                                                    color: 'bg-white text-stone-900 border-stone-200'
                                                                }))
                                                            ]}
                                                            className="w-40"
                                                        />
                                                    ) : (
                                                        <span className="text-stone-600 text-sm">
                                                            {data.customerInterviews.find(ci => ci.id === interview.linkedInterviewId)?.Name || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center" onClick={() => setSelectedVideoInterview(interview)}>
                                                    {interview.waiverUrl ? (
                                                        <div className="flex justify-center">
                                                            <FileText className="w-5 h-5 text-nobel-gold" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-stone-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center" onClick={() => setSelectedVideoInterview(interview)}>
                                                    {interview.videoUrl ? (
                                                        <div className="flex justify-center">
                                                            <Video className="w-5 h-5 text-stone-900" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-stone-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {canEdit && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                handleDeleteVideoInterview(interview._id);
                                                            }}
                                                            className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                        >
                                                            <Trash2 className="w-4 h-4 pointer-events-none" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Detail Sheet */}
                {
                    selectedInterviewId && activeTab === 'feedback' && (
                        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-stone-200 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-40 overflow-y-auto">
                            <div className="p-6 border-b border-stone-100 flex justify-between items-start bg-[#F9F8F4]">
                                <div>
                                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">{selectedInterview?.Name || 'Interview Details'}</h3>
                                    <p className="text-xs text-stone-500 uppercase tracking-widest">{selectedInterview?.Role}</p>
                                </div>
                                <button onClick={() => setSelectedInterviewId(null)} className="text-stone-400 hover:text-stone-900">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Fields */}
                                {headers.filter(h => h !== 'Status' && h !== 'Name' && h !== 'Role').map(header => (
                                    <div key={header}>
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400 mb-1">
                                            {header}
                                        </label>
                                        <div className="text-sm text-stone-800 leading-relaxed bg-white p-3 rounded border border-stone-100">
                                            {selectedInterview?.[header] || '-'}
                                        </div>
                                    </div>
                                ))}
                                {selectedInterview && linkedVideosMap.get(selectedInterview.id) && (
                                    <div className="pt-6 border-t border-stone-100 space-y-6">
                                        {/* Hidden Inputs for Replacement */}
                                        <input type="file" ref={replaceVideoRef} className="hidden" accept="video/*" onChange={(e) => handleReplaceUpload(e, 'video')} />
                                        <input type="file" ref={replaceWaiverRef} className="hidden" accept=".pdf,image/*" onChange={(e) => handleReplaceUpload(e, 'waiver')} />

                                        {/* Linked Video Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-stone-900" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Video Recording</span>
                                                </div>
                                                <button
                                                    disabled={isUploading}
                                                    onClick={() => replaceVideoRef.current?.click()}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-nobel-gold hover:underline disabled:opacity-50"
                                                >
                                                    {linkedVideosMap.get(selectedInterview.id)?.videoUrl ? 'Replace Video' : 'Upload Video'}
                                                </button>
                                            </div>
                                            {linkedVideosMap.get(selectedInterview.id)?.videoUrl ? (
                                                <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video flex items-center justify-center relative group">
                                                    <video
                                                        src={linkedVideosMap.get(selectedInterview.id).videoUrl}
                                                        controls
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-stone-50 rounded-xl aspect-video flex items-center justify-center border border-stone-200 border-dashed text-stone-400 text-sm">
                                                    No video uploaded
                                                </div>
                                            )}
                                        </div>

                                        {/* Linked Waiver Section */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-stone-900" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Signed Waiver</span>
                                                </div>
                                                <button
                                                    disabled={isUploading}
                                                    onClick={() => replaceWaiverRef.current?.click()}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-nobel-gold hover:underline disabled:opacity-50"
                                                >
                                                    {linkedVideosMap.get(selectedInterview.id)?.waiverUrl ? 'Replace Waiver' : 'Upload Waiver'}
                                                </button>
                                            </div>
                                            {linkedVideosMap.get(selectedInterview.id)?.waiverUrl ? (
                                                <>
                                                    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden h-64 shadow-inner">
                                                        <iframe
                                                            src={linkedVideosMap.get(selectedInterview.id).waiverUrl}
                                                            className="w-full h-full"
                                                            title="Waiver Preview"
                                                        />
                                                    </div>
                                                    <a
                                                        href={linkedVideosMap.get(selectedInterview.id).waiverUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-2 text-xs font-bold text-nobel-gold hover:underline flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3 h-3" /> Open in new tab
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="bg-stone-50 rounded-xl h-24 flex items-center justify-center border border-stone-200 border-dashed text-stone-400 text-sm">
                                                    No waiver uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedInterview && !linkedVideosMap.get(selectedInterview.id) && (
                                    <div className="pt-6 border-t border-stone-100">
                                        <button
                                            onClick={() => {
                                                setNewVideoLinkedId(selectedInterview.id);
                                                setNewVideoName(selectedInterview.Name || '');
                                                setShowAddVideoModal(true);
                                            }}
                                            className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-nobel-gold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Video className="w-4 h-4" /> Add Video Interview
                                        </button>
                                    </div>
                                )}

                                {/* AI Insights Section */}
                                <div className="pt-6 border-t border-stone-100 pb-20">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-4 h-4 text-nobel-gold" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-stone-900">Research Insights</span>
                                        </div>
                                        {selectedInterview && (
                                            <SentimentBadge sentiment={selectedInterview.sentiment} />
                                        )}
                                    </div>

                                    {!selectedInterview?.aiAnalysis ? (
                                        <div className="bg-stone-50 rounded-xl p-6 border border-stone-100 text-center">
                                            <p className="text-xs text-stone-500 mb-4 italic">No analysis performed on this interview yet.</p>
                                            <button
                                                onClick={handleRunAnalysis}
                                                disabled={isAnalyzing}
                                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                {isAnalyzing ? 'Analyzing...' : 'Generate AI Insights'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-nobel-gold/5 rounded-xl p-4 border border-nobel-gold/10">
                                                <p className="text-sm text-stone-800 leading-relaxed italic">
                                                    "{selectedInterview.aiAnalysis}"
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={handleCreateRoadmapTask}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors shadow-sm"
                                                >
                                                    <LayoutGrid className="w-4 h-4" />
                                                    Convert to Roadmap Task
                                                </button>
                                                <button
                                                    onClick={handleRunAnalysis}
                                                    disabled={isAnalyzing}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-400 hover:text-stone-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Regenerate Analysis
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Video Interview Detail Sheet */}
                {
                    selectedVideoInterview && activeTab === 'video' && (
                        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-stone-200 transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-40 overflow-y-auto flex flex-col">
                            <div className="p-6 border-b border-stone-100 flex justify-between items-start bg-[#F9F8F4]">
                                <div>
                                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">{selectedVideoInterview.name}</h3>
                                    <p className="text-xs text-stone-500 uppercase tracking-widest">{selectedVideoInterview.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleDeleteVideoInterview(selectedVideoInterview._id)}
                                            className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                            title="Delete Interview"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedVideoInterview(null)} className="text-stone-400 hover:text-stone-900 p-1">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 space-y-8">
                                {/* Video Player */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Video className="w-4 h-4 text-stone-900" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Interview Recording</span>
                                    </div>
                                    {selectedVideoInterview.videoUrl ? (
                                        <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video flex items-center justify-center relative group">
                                            <video
                                                src={selectedVideoInterview.videoUrl}
                                                controls
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-stone-100 rounded-xl aspect-video flex items-center justify-center text-stone-400 text-sm italic border border-stone-200 border-dashed">
                                            No video uploaded
                                        </div>
                                    )}
                                </div>

                                {/* Waiver Preview */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-stone-900" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Signed Waiver</span>
                                    </div>
                                    {selectedVideoInterview.waiverUrl ? (
                                        <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden h-96 shadow-inner">
                                            <iframe
                                                src={selectedVideoInterview.waiverUrl}
                                                className="w-full h-full"
                                                title="Waiver Preview"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-stone-100 rounded-xl h-32 flex items-center justify-center text-stone-400 text-sm italic border border-stone-200 border-dashed">
                                            No waiver uploaded
                                        </div>
                                    )}
                                    {selectedVideoInterview.waiverUrl && (
                                        <a
                                            href={selectedVideoInterview.waiverUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 text-xs font-bold text-nobel-gold hover:underline flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" /> Open in new tab
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Video Interview Modal */}
                {
                    showAddVideoModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-stone-100 scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-serif font-bold text-stone-900">Add Video Interview</h3>
                                    <button onClick={() => { setShowAddVideoModal(false); setNewVideoLinkedId(''); }} className="text-stone-400 hover:text-stone-900">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddVideoInterview} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newVideoName}
                                            onChange={(e) => setNewVideoName(e.target.value)}
                                            className="w-full p-2 border border-stone-200 rounded focus:border-nobel-gold outline-none"
                                            placeholder="Interviewee Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={newVideoEmail}
                                            onChange={(e) => setNewVideoEmail(e.target.value)}
                                            className="w-full p-2 border border-stone-200 rounded focus:border-nobel-gold outline-none"
                                            placeholder="interviewee@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Link to Interviewee (Optional)</label>
                                        <select
                                            value={newVideoLinkedId}
                                            onChange={(e) => setNewVideoLinkedId(e.target.value)}
                                            className="w-full p-2 border border-stone-200 rounded focus:border-nobel-gold outline-none text-sm bg-white"
                                        >
                                            <option value="">Select Interviewee...</option>
                                            {data.customerInterviews.map(ci => (
                                                <option key={ci.id} value={ci.id}>{ci.Name || 'Unnamed'} ({ci.Role || 'No Role'})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Signed Waiver (PDF)</label>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={(e) => setWaiverFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Video Recording</label>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowAddVideoModal(false); setNewVideoLinkedId(''); }}
                                            className="px-4 py-2 text-stone-500 hover:text-stone-900 font-bold text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-stone-900 hover:bg-nobel-gold text-white rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                                        >
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {isUploading ? 'Uploading...' : 'Save Interview'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
                {/* Add Entry Modal */}
                {
                    showAddEntryModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 border border-stone-100 scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-serif font-bold text-stone-900">Add New Entry</h3>
                                    <button onClick={() => setShowAddEntryModal(false)} className="text-stone-400 hover:text-stone-900">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleAddEntry} className="grid grid-cols-2 gap-6">
                                    {headers.filter(h => h !== 'Status').map(header => {
                                        const isTextArea = header === 'Notes' || header === 'Pain Points' || header === 'Survey Feedback';

                                        // Special Logic for Specific Headers
                                        if (header === 'Video') {
                                            return (
                                                <div key={header} className="col-span-1">
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Linked Video</label>
                                                    <CustomSelect
                                                        value={newEntryData[header] || ''}
                                                        onChange={(val) => setNewEntryData(prev => ({ ...prev, [header]: val }))}
                                                        options={[
                                                            { label: 'None', value: '' },
                                                            ...videoFiles.map(f => ({ label: f.name, value: f.name }))
                                                        ]}
                                                        placeholder="Select Video..."
                                                    />
                                                </div>
                                            );
                                        }

                                        if (header === 'Waiver') {
                                            return (
                                                <div key={header} className="col-span-1">
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Signed Waiver</label>
                                                    <CustomSelect
                                                        value={newEntryData[header] || ''}
                                                        onChange={(val) => setNewEntryData(prev => ({ ...prev, [header]: val }))}
                                                        options={[
                                                            { label: 'None', value: '' },
                                                            ...documentFiles.map(f => ({ label: f.name, value: f.name }))
                                                        ]}
                                                        placeholder="Select Waiver..."
                                                    />
                                                </div>
                                            );
                                        }

                                        if (header === 'Willingness to Pay ($)') {
                                            return (
                                                <div key={header} className="col-span-1 grid grid-cols-2 gap-2">
                                                    <div className={interestStatus === 'No' ? 'col-span-2' : 'col-span-1'}>
                                                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Willing to Pay?</label>
                                                        <CustomSelect
                                                            value={interestStatus}
                                                            onChange={(val) => {
                                                                const newStatus = val;
                                                                let newValue = newStatus;
                                                                if (newStatus === 'Yes' && priceValue) newValue = `$${priceValue}`;
                                                                setNewEntryData(prev => ({ ...prev, [header]: newValue }));
                                                            }}
                                                            options={[
                                                                { label: 'Yes', value: 'Yes', color: 'bg-green-100 text-green-700' },
                                                                { label: 'Maybe', value: 'Maybe', color: 'bg-yellow-100 text-yellow-700' },
                                                                { label: 'No', value: 'No', color: 'bg-red-100 text-red-700' }
                                                            ]}
                                                        />
                                                    </div>
                                                    {interestStatus !== 'No' && (
                                                        <div className="col-span-1 animate-in slide-in-from-left-2 duration-200">
                                                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Target Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={priceValue}
                                                                    onChange={(e) => {
                                                                        const price = e.target.value;
                                                                        setNewEntryData(prev => ({ ...prev, [header]: `$${price}` }));
                                                                    }}
                                                                    className="w-full pl-7 pr-4 py-2.5 border border-stone-200 bg-stone-50 rounded-lg text-sm focus:outline-none focus:border-nobel-gold focus:ring-1 focus:ring-nobel-gold/20 transition-all font-bold text-stone-900"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={header} className={isTextArea ? "col-span-2" : "col-span-1"}>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">{header}</label>
                                                {isTextArea ? (
                                                    <textarea
                                                        value={newEntryData[header] || ''}
                                                        onChange={(e) => setNewEntryData(prev => ({ ...prev, [header]: e.target.value }))}
                                                        className="w-full px-4 py-3 border border-stone-200 bg-stone-50 rounded-lg text-sm focus:outline-none focus:border-nobel-gold focus:ring-1 focus:ring-nobel-gold/20 min-h-[100px] resize-none transition-all"
                                                        placeholder={`Enter ${header}...`}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newEntryData[header] || ''}
                                                        onChange={(e) => setNewEntryData(prev => ({ ...prev, [header]: e.target.value }))}
                                                        className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 rounded-lg text-sm focus:outline-none focus:border-nobel-gold focus:ring-1 focus:ring-nobel-gold/20 transition-all"
                                                        placeholder={`Enter ${header}...`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="col-span-2 pt-4 flex justify-end gap-3 border-t border-stone-100 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddEntryModal(false)}
                                            className="px-4 py-2 text-stone-500 hover:text-stone-900 font-bold text-xs uppercase tracking-widest transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-stone-900 hover:bg-nobel-gold text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm transition-all"
                                        >
                                            Save Entry
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default CustomerDev;