
import React, { useState, useEffect, useRef } from 'react';
import { StartupData, MarketVersion, AISettings, RolePermissions } from '../types';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCreateDocument } from "../hooks/useCreate";
import { Plus, Check, ChevronDown, Save, History, Trash2, Brain, Loader2, FileText, Target, PieChart, Info, Upload, X, Edit3, Eye, ChevronLeft, ChevronRight, BarChart3, TrendingUp, AlertCircle, MousePointerClick, Mic, Paperclip, Maximize2, Minimize2, Copy, FolderPlus, LayoutGrid, Home } from 'lucide-react';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { Logo } from './Logo';
import AttributionBadge from './AttributionBadge';
import { toast } from 'sonner';
import { marked } from 'marked';
import { SaveToFilesDialog } from './nobel_chat/SaveToFilesDialog';
import { Id } from '../convex/_generated/dataModel';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, List as ListIcon } from 'lucide-react';
import TurndownService from 'turndown';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

const turndownService = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
turndownService.remove(['style', 'script']);

// Mini TipTap Editor
interface MiniStoryEditorProps {
    content: string;
    onChange: (html: string) => void;
}

const MiniStoryEditor: React.FC<MiniStoryEditorProps> = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const markdown = turndownService.turndown(html);
            onChange(markdown);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-nobel max-w-none focus:outline-none min-h-[50vh] px-8 py-6 text-stone-800 font-sans leading-loose',
            },
        },
    });

    const isFirstRun = useRef(true);
    useEffect(() => {
        const parseContent = async () => {
            if (content && editor && (!editor.isFocused || isFirstRun.current)) {
                const html = await marked.parse(content);
                editor.commands.setContent(html);
                isFirstRun.current = false;
            }
        };
        parseContent();
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="border border-stone-200 rounded-xl overflow-hidden bg-white mb-8">
            <div className="flex items-center gap-1 px-3 py-2 bg-stone-50 border-b border-stone-200">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p - 2 rounded hover: bg - white transition - colors ${editor.isActive('bold') ? 'bg-white shadow-sm text-nobel-gold' : 'text-stone-500'} `} title="Bold"><Bold className="w-4 h-4" /></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p - 2 rounded hover: bg - white transition - colors ${editor.isActive('italic') ? 'bg-white shadow-sm text-nobel-gold' : 'text-stone-500'} `} title="Italic"><Italic className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-stone-200 mx-1" />
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p - 2 rounded hover: bg - white transition - colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white shadow-sm text-nobel-gold' : 'text-stone-500'} `} title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p - 2 rounded hover: bg - white transition - colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-nobel-gold' : 'text-stone-500'} `} title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-stone-200 mx-1" />
                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p - 2 rounded hover: bg - white transition - colors ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-nobel-gold' : 'text-stone-500'} `} title="Bullet List"><ListIcon className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-stone-200 mx-1" />
                <button
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="p-2 rounded hover:bg-white transition-colors text-stone-500"
                    title="Insert Table"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
};

interface MarketResearchProps {
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




import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;
    return (
        <div className="border border-stone-200 rounded-xl overflow-hidden bg-white mb-8">
            <article className="prose prose-nobel max-w-none text-stone-800 font-sans leading-loose px-8 py-6">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => <h1 className="text-3xl font-bold text-stone-900 mb-6 mt-8 leading-tight font-serif">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-bold text-stone-800 mb-4 mt-8 leading-tight font-serif">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-bold text-stone-800 mb-3 mt-6 leading-tight font-serif">{children}</h3>,
                        p: ({ children }) => <p className="mb-4 leading-loose text-stone-600">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-6 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-6 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="pl-1 leading-loose text-stone-600">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-stone-900">{children}</strong>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-nobel-gold pl-4 italic my-4 text-stone-500 bg-stone-50 py-2 pr-2 rounded-r">{children}</blockquote>,
                        a: ({ href, children }) => (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-nobel-gold/40 hover:decoration-nobel-gold transition-all"
                            >
                                {children}
                            </a>
                        ),
                        img: ({ alt, src }) => {
                            if (alt === 'AI Assisted') return <AttributionBadge type="AI Assisted" />;
                            if (alt === 'Human Edited') return <AttributionBadge type="Human Edited" />;
                            return <img alt={alt} src={src} className="rounded-lg shadow-md my-4 max-w-full" />;
                        }
                    }}
                >
                    {content}
                </Markdown>
            </article>
        </div>
    );
};

const MarketValueInput = ({ value, onChange, theme = 'light' }: { value: number, onChange: (val: number) => void, theme?: 'light' | 'dark' | 'gold' }) => {
    const getBestUnit = (val: number) => {
        if (val >= 1000000000000) return 1000000000000;
        if (val >= 1000000000) return 1000000000;
        if (val >= 1000000) return 1000000;
        return 1;
    };

    const [multiplier, setMultiplier] = useState(() => value > 0 ? getBestUnit(value) : 1000000000);

    // Sync internal multiplier state if value changes significantly from outside (e.g. initial load or AI update)
    useEffect(() => {
        if (value > 0) {
            const best = getBestUnit(value);
            // If the current multiplier is widely off (e.g. value is 100 but multiplier is 1B -> 0.0000001)
            // Or if value is massive but multiplier is 1
            // Improved logic: If value is 1 unit (e.g. 0.39B), switch down.
            if (value / multiplier < 1 || value / multiplier > 10000) {
                setMultiplier(best);
            }
        }
    }, [value]);

    const displayValue = value === 0 ? '' : parseFloat((value / multiplier).toFixed(2));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) onChange(0);
        else onChange(val * multiplier);
    };

    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMultiplier(parseFloat(e.target.value));
    };

    let bgClass = 'bg-white text-stone-900 border-stone-200';
    let inputClass = 'text-stone-900 placeholder-stone-300';
    let selectClass = 'text-stone-900';

    if (theme === 'dark') {
        bgClass = 'bg-nobel-gold text-white border-nobel-gold';
        inputClass = 'text-white placeholder-white/50';
        selectClass = 'text-stone-900';
    } else if (theme === 'gold') {
        bgClass = 'bg-white text-nobel-gold border-nobel-gold ring-1 ring-nobel-gold/20';
        inputClass = 'text-nobel-gold placeholder-nobel-gold/30';
        selectClass = 'text-nobel-gold';
    }

    return (
        <div className={`flex items - center rounded - xl border ${bgClass} overflow - hidden transition - all focus - within: ring - 2 focus - within: ring - opacity - 50 h - 14 shadow - sm`}>
            <div className="pl-4 pr-1 font-serif font-bold opacity-70 text-lg">$</div>
            <input
                type="number"
                value={displayValue}
                onChange={handleChange}
                className={`flex - grow outline - none font - serif font - bold text - 2xl p - 2 bg - transparent ${inputClass} min - w - 0`}
                placeholder="0"
            />
            <div className="relative border-l border-current opacity-70 h-full flex items-center">
                <select
                    value={multiplier}
                    onChange={handleUnitChange}
                    className={`appearance - none pl - 4 pr - 8 py - 2 bg - transparent text - [10px] font - bold uppercase tracking - widest outline - none cursor - pointer h - full ${selectClass} `}
                >
                    <option className="text-stone-900" value={1}>USD</option>
                    <option className="text-stone-900" value={1000}>Thou (K)</option>
                    <option className="text-stone-900" value={1000000}>Mill (M)</option>
                    <option className="text-stone-900" value={1000000000}>Bill (B)</option>
                    <option className="text-stone-900" value={1000000000000}>Trill (T)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
            </div>
        </div>
    );
};

import DotPatternBackground from './DotPatternBackground';
import { motion, AnimatePresence } from 'framer-motion';

// ... (existing imports and code)

const MarketResearch: React.FC<MarketResearchProps> = ({ data, allProjects, onUpdateProject, onSwitchProject, onNewProject, onNavigate, currentView, settings, allowedPages, permissions }) => {
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(true);
    const [attachedFiles, setAttachedFiles] = useState<{ name: string, data: string, mimeType: string }[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [keywords, setKeywords] = useState<string[]>(data.market.keywords || []);
    const [newKeyword, setNewKeyword] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Sync isGenerating with backend status
    const isAnalyzing = isGenerating || data.market.status === 'analyzing';

    // Permission and Data Checks
    const hasCanvasData = data.canvas && Object.values(data.canvas).some(val => val && typeof val === 'string' && val.trim().length > 20);
    // Fallback: If permissions is undefined (e.g. Founder/Admin legacy), assume true.
    // If permissions IS defined (Member role), use it.
    const canEdit = permissions ? (permissions.global?.edit ?? false) : true;

    // Tooltip message
    let deepResearchTooltip = "";
    if (!hasCanvasData) deepResearchTooltip = "Fill out Canvas first to enable Deep Research.";
    else if (!canEdit) deepResearchTooltip = "You do not have permission to generate research.";
    else if (isGenerating) deepResearchTooltip = "Generating research...";

    const isDisabled = isGenerating || !hasCanvasData || !canEdit;

    const updateMarket = useMutation(api.market.updateMarket);
    const startResearch = useMutation(api.marketResearch.startResearch);
    const createDocument = useCreateDocument();
    const currentUser = useQuery(api.users.getUser);

    // Sync local state with prop data
    useEffect(() => {
        if (data.market.keywords) {
            setKeywords(data.market.keywords);
        }
    }, [data.market.keywords]);

    // Separate hover and selection states
    const [selectedSection, setSelectedSection] = useState<'TAM' | 'SAM' | 'SOM' | null>(null);
    const [hoveredSection, setHoveredSection] = useState<'TAM' | 'SAM' | 'SOM' | null>(null);

    // Active section is hover if present, otherwise selection
    const activeSection = hoveredSection || selectedSection;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { market } = data;

    const handleSaveMarket = async (updates: Partial<typeof market>) => {
        const newMarket = { ...market, ...updates };

        // Optimistic update
        onUpdateProject(p => ({
            ...p,
            market: newMarket
        }));

        // Persist to Convex
        try {
            await updateMarket({
                projectId: data.id, // using localId as projectId for now based on existing pattern
                tam: newMarket.tam,
                sam: newMarket.sam,
                som: newMarket.som,
                reportContent: newMarket.reportContent,
                keywords: newMarket.keywords,
                tags: newMarket.tags,
                creatorProfile: newMarket.creatorProfile,
                source: newMarket.source
            });
        } catch (error) {
            console.error("Failed to save market data:", error);
        }
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            const updatedKeywords = [...keywords, newKeyword.trim()];
            setKeywords(updatedKeywords);
            setNewKeyword("");
            handleSaveMarket({ keywords: updatedKeywords });
        }
    };

    const handleRemoveKeyword = (keyword: string) => {
        const updatedKeywords = keywords.filter(k => k !== keyword);
        setKeywords(updatedKeywords);
        handleSaveMarket({ keywords: updatedKeywords });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        const base64String = reader.result.split(',')[1];
                        setAttachedFiles(prev => [...prev, {
                            name: file.name,
                            data: base64String,
                            mimeType: file.type // application/pdf, text/plain, etc.
                        }]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsGenerating(false);
            toast.info("Market research stopped.");
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        if (isLeftCollapsed) setIsLeftCollapsed(false);

        try {
            // Ensure user knows files are being used
            if (attachedFiles.length > 0) {
                toast.info(`Including ${attachedFiles.length} attached document(s) in analysis context.`);
            }

            // Start Backend Workflow with Global Toast
            toast.promise(
                startResearch({
                    projectId: data.id,
                    startupData: data,
                    keywords: keywords,
                    attachedFiles: attachedFiles,
                    modelName: settings.modelName
                }),
                {
                    loading: 'Initializing Deep Research Agents...',
                    success: 'Market Research Initiated. You will be notified when complete.',
                    error: 'Failed to start Market Research agents.'
                }
            );

            // Optimistic update for UI feedback
            onUpdateProject(p => ({
                ...p,
                market: {
                    ...p.market,
                    status: 'analyzing'
                }
            }));

        } catch (error: any) {
            console.error("Failed to start research:", error);
            // Error handled by toast.promise
            setIsGenerating(false);
        }
        setIsGenerating(false);
    };

    const handleCopyReport = () => {
        if (!market.reportContent) return;

        // Strip markdown backticks if any
        const cleanContent = market.reportContent.replace(/^```markdown\n /, '').replace(/\n```$/, '');

        navigator.clipboard.writeText(cleanContent);
        toast.success("Market research copied to clipboard");
    };

    const handleSaveToDocs = async (folderId: string | null, filename: string) => {
        if (!market.reportContent) return;

        try {
            // Convert markdown to HTML for TipTap compatibility
            const htmlContent = await marked.parse(market.reportContent);

            // Prepare tags for the document
            const docTags = market.tags?.map(tag => ({
                name: tag,
                color: tag === 'AI Assisted' ? '#7c007c' : '#f17a35' // Default colors matching badge
            })) || [];

            await createDocument({
                projectId: data.id,
                folderId: folderId ? folderId as Id<"folders"> : undefined,
                title: filename.endsWith('.md') ? filename : `${filename}.md`,
                content: htmlContent,
                type: 'doc',
                tags: docTags
            });
            toast.success("Saved to documents successfully");
            setIsSaveDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save to documents");
        }
    };

    const definitions = {
        TAM: {
            title: "Total Addressable Market",
            subtitle: "The Big Vision",
            description: "The total market demand for a product or service. This is the big picture number.",
            color: "bg-stone-400",
            textColor: "text-stone-600",
            borderColor: "border-stone-400"
        },
        SAM: {
            title: "Serviceable Available Market",
            subtitle: "Your Target Segment",
            description: "The segment of the TAM targeted by your products and services which is within your geographical reach.",
            color: "bg-nobel-gold",
            textColor: "text-nobel-gold",
            borderColor: "border-nobel-gold"
        },
        SOM: {
            title: "Serviceable Obtainable Market",
            subtitle: "Immediate Goal (1-3 Years)",
            description: "The portion of SAM that you can capture. This is your short-term target.",
            color: "bg-stone-900",
            textColor: "text-stone-900",
            borderColor: "border-stone-900"
        }
    };

    const formatCurrency = (val: number) => {
        if (!val) return '$0';
        if (val >= 1000000000000) return `$${(val / 1000000000000).toFixed(1)}T`;
        if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val}`;
    };

    const getFounderScript = (section: 'TAM' | 'SAM' | 'SOM') => {
        const val = market[section.toLowerCase() as keyof typeof market] as number;
        const formatted = formatCurrency(val);

        switch (section) {
            case 'TAM':
                return `"We are addressing a massive opportunity. Our Total Addressable Market is ${formatted}, representing the global demand for this solution."`;
            case 'SAM':
                return `"Realistically, our Serviceable Available Market is ${formatted}, targeting the specific segment where our solution fits best."`;
            case 'SOM':
                return `"Our immediate focus is to capture ${formatted} in the next 18-24 months. This is our Serviceable Obtainable Market."`;
        }
    };

    const renderBars = () => {
        const { tam, sam, som } = market;
        const maxVal = Math.max(tam, sam, som, 1);

        const getWidth = (val: number) => {
            if (val <= 0) return '0%';
            const pct = (val / maxVal) * 100;
            return `${Math.max(pct, 1)}%`;
        };

        return (
            <div className="flex flex-row items-center justify-center gap-12 h-[450px] w-full px-8">
                <div className="flex-grow flex flex-col justify-center gap-8 w-full max-w-xl">
                    {/* TAM */}
                    <div
                        className="group cursor-pointer"
                        onClick={() => setSelectedSection(selectedSection === 'TAM' ? null : 'TAM')}
                        onMouseEnter={() => setHoveredSection('TAM')}
                        onMouseLeave={() => setHoveredSection(null)}
                    >
                        <div className="flex justify-between items-end mb-2">
                            <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'TAM' ? 'text-stone-900' : 'text-stone-400'}`}>TAM</span>
                            <span className="font-serif font-bold text-stone-900">{formatCurrency(tam)}</span>
                        </div>
                        <div className="w-full h-14 bg-stone-100 rounded-r-full rounded-bl-full overflow-hidden relative">
                            <div
                                className={`h-full bg-stone-400 transition-all duration-1000 ease-out rounded-r-full ${activeSection === 'TAM' ? 'opacity-100' : 'opacity-60'}`}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* SAM */}
                    <div
                        className="group cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedSection(selectedSection === 'SAM' ? null : 'SAM'); }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredSection('SAM'); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredSection(null); }}
                    >
                        <div className="flex justify-between items-end mb-2">
                            <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'SAM' ? 'text-nobel-gold' : 'text-stone-400'}`}>SAM</span>
                            <span className="font-serif font-bold text-nobel-gold">{formatCurrency(sam)}</span>
                        </div>
                        <div className="w-full h-14 bg-stone-100 rounded-r-full rounded-bl-full overflow-hidden relative">
                            <div
                                className={`h-full bg-nobel-gold transition-all duration-1000 ease-out rounded-r-full ${activeSection === 'SAM' ? 'opacity-100' : 'opacity-80'}`}
                                style={{ width: getWidth(sam) }}
                            />
                        </div>
                    </div>

                    {/* SOM */}
                    <div
                        className="group cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setSelectedSection(selectedSection === 'SOM' ? null : 'SOM'); }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredSection('SOM'); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredSection(null); }}
                    >
                        <div className="flex justify-between items-end mb-2">
                            <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'SOM' ? 'text-stone-900' : 'text-stone-400'}`}>SOM</span>
                            <span className="font-serif font-bold text-stone-900">{formatCurrency(som)}</span>
                        </div>
                        <div className="w-full h-14 bg-stone-100 rounded-r-full rounded-bl-full overflow-hidden relative">
                            <div
                                className={`h-full bg-stone-900 transition-all duration-1000 ease-out rounded-r-full ${activeSection === 'SOM' ? 'opacity-100' : 'opacity-90'}`}
                                style={{ width: getWidth(som) }}
                            />
                        </div>
                    </div>
                </div>

                {/* Explainer Card */}
                <div className={`flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${activeSection ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
                    {activeSection && definitions[activeSection] ? (
                        <div className={`bg-white rounded-xl shadow-2xl border-l-4 p-8 w-80 ${definitions[activeSection].borderColor}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <MousePointerClick className="w-4 h-4 text-stone-400" />
                                <span className={`text-xs font-bold uppercase tracking-widest ${definitions[activeSection].textColor}`}>{activeSection}</span>
                            </div>
                            <h3 className="font-serif text-3xl text-stone-900 mb-2">{definitions[activeSection].title}</h3>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-8">{definitions[activeSection].subtitle}</p>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Definition</p>
                                    <p className="text-sm text-stone-600 leading-relaxed font-light">
                                        {definitions[activeSection].description}
                                    </p>
                                </div>

                                <div className="bg-stone-50 p-5 rounded-lg border border-stone-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-nobel-gold/10 rounded-bl-full -mr-8 -mt-8"></div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-nobel-gold mb-2 flex items-center gap-1 relative z-10">
                                        <Mic className="w-3 h-3" /> Pitch Script
                                    </p>
                                    <p className="text-sm text-stone-800 font-serif italic leading-relaxed relative z-10">
                                        {getFounderScript(activeSection)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-80 h-96"></div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex bg-nobel-cream relative overflow-hidden">
            {/* LEFT SIDE: HERO IMAGE (30%) - Hidden when report is open */}
            <AnimatePresence>
                {isLeftCollapsed && (
                    <motion.div
                        initial={{ width: '30%', opacity: 1 }}
                        animate={{ width: '30%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20"
                    >
                        <img
                            src="/OfficeDiscussion.png"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                            alt="Top-Down Sizing Hero"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-900/80" />

                        <div className="absolute top-12 left-12 z-30">
                            <Logo imageClassName="h-10 w-auto brightness-0 invert" />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-12 space-y-6 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pt-32">
                            <div className="space-y-4">
                                <h2 className="text-white text-4xl font-serif font-bold leading-tight">
                                    Market <br />
                                    <span className="text-nobel-gold italic underline underline-offset-8 decoration-white/20">Intelligence.</span>
                                </h2>
                                <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                                <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-medium">
                                    Unlock deep insights into your target market, trends, and opportunities using <strong>top-down analysis</strong>.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RIGHT SIDE: MAIN CONTENT */}
            <motion.div
                animate={{ width: isLeftCollapsed ? '70%' : '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="h-full flex flex-col relative z-10"
            >
                <DotPatternBackground color="#a8a29e" />

                {/* Header */}
                <header className="px-10 py-4 flex items-center justify-between relative z-30 bg-white/80 backdrop-blur-sm border-b border-stone-200">
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
                            mode="light"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('MARKET')}
                            className="px-4 py-2 bg-nobel-gold text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#A38035] transition-colors flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" /> HUB
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.txt,.md" onChange={handleFileUpload} disabled={!canEdit} />
                        {isGenerating ? (
                            <button onClick={handleStop} className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 shadow-md">
                                <X className="w-4 h-4" /> Stop
                            </button>
                        ) : (
                            <div className="relative group/tooltip">
                                <button onClick={handleGenerate} disabled={isDisabled} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md ${isDisabled ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-nobel-gold'}`}>
                                    <Brain className="w-4 h-4" /> Analysis
                                </button>
                                {isDisabled && !isGenerating && (
                                    <div className="absolute top-full mt-2 right-0 bg-stone-900 text-white text-[10px] px-3 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50 pointer-events-none">
                                        {deepResearchTooltip}
                                    </div>
                                )}
                            </div>
                        )}
                        {market.reportContent && isLeftCollapsed && (
                            <button
                                onClick={() => setIsLeftCollapsed(false)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-2 border border-emerald-500 shadow-lg active:scale-95"
                            >
                                <FileText className="w-4 h-4" /> Report
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow flex relative z-10 overflow-hidden">
                    {/* Visualization Panel */}
                    <div className={`${!isLeftCollapsed ? 'w-1/2' : 'w-full'} flex flex-col px-12 py-6 overflow-y-auto transition-all duration-300`}>
                        <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                            {/* Header Area */}
                            <div className={`mt-8 mb-4 shrink-0 flex ${!isLeftCollapsed ? 'flex-col gap-3' : 'flex-row items-start justify-between gap-4'}`}>
                                <h2 className="font-serif text-3xl text-stone-900 flex items-center gap-3">
                                    Top-Down Market Sizing
                                    {(market.tags?.includes('AI Assisted') || market.source === 'AI') && (
                                        <AttributionBadge type="AI Assisted" />
                                    )}
                                    {market.tags?.includes('Human') && (
                                        <AttributionBadge type="Human" />
                                    )}
                                </h2>

                                {/* Help Accordion */}
                                <div className={`${!isLeftCollapsed ? 'w-72' : 'w-60'} bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden transition-all shrink-0`}>
                                    <button
                                        onClick={() => setShowHelp(!showHelp)}
                                        className="w-full px-5 py-3 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:bg-stone-50 hover:text-nobel-gold transition-colors"
                                    >
                                        <span className="flex items-center gap-2"><Info className="w-3 h-3" /> How This Works</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showHelp ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showHelp ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-5 pb-5 pt-4 text-xs text-stone-200 font-sans leading-relaxed bg-stone-900">
                                            <p className="mb-2 uppercase tracking-wider font-bold text-nobel-gold">General Market Intelligence</p>
                                            <p className="mb-3 text-stone-400">Uses AI to analyze macro-economic trends, industry reports, and global search data (Top-Down Approach).</p>
                                            <p className="text-stone-400 mb-4"><strong>Data Used:</strong> Your Business Canvas (Problem/Solution) + Keywords to generate broad TAM/SAM estimates.</p>

                                            <div className={`grid ${!isLeftCollapsed ? 'grid-cols-3' : 'grid-cols-1'} gap-3 text-xs font-mono`}>
                                                <div className="p-3 bg-stone-800 rounded-lg border border-stone-700">
                                                    <strong className="block text-nobel-gold mb-1">TAM</strong>
                                                    <span className="text-stone-400">Total Industry Revenue</span>
                                                </div>
                                                <div className="p-3 bg-stone-800 rounded-lg border border-stone-700">
                                                    <strong className="block text-nobel-gold mb-1">SAM</strong>
                                                    <span className="text-stone-400">Target Segment Revenue</span>
                                                </div>
                                                <div className="p-3 bg-stone-800 rounded-lg border border-stone-700">
                                                    <strong className="block text-nobel-gold mb-1">SOM</strong>
                                                    <span className="text-stone-400">Realistic Capture (1-3 Years)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Area - Centered */}
                            <div className="flex-grow flex items-center justify-center relative z-10">
                                {renderBars()}
                            </div>

                            {/* Market Value Inputs - Fixed at bottom */}
                            {canEdit && (
                                <div className="mt-auto pt-6 pb-16 shrink-0 px-12">
                                    <div className={`grid gap-6 ${!isLeftCollapsed ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                                        <div
                                            className={`bg-white p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${activeSection === 'TAM' ? 'border-stone-400 ring-1 ring-stone-200' : 'border-stone-200'}`}
                                            onClick={() => setSelectedSection(selectedSection === 'TAM' ? null : 'TAM')}
                                            onMouseEnter={() => setHoveredSection('TAM')}
                                            onMouseLeave={() => setHoveredSection(null)}
                                        >
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Total Addressable (TAM)</label>
                                            <MarketValueInput value={market.tam || 0} onChange={(v) => handleSaveMarket({ tam: v })} theme="light" />
                                        </div>
                                        <div
                                            className={`bg-white p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${activeSection === 'SAM' ? 'border-nobel-gold ring-1 ring-nobel-gold' : 'border-nobel-gold/30 ring-1 ring-nobel-gold/10'}`}
                                            onClick={() => setSelectedSection(selectedSection === 'SAM' ? null : 'SAM')}
                                            onMouseEnter={() => setHoveredSection('SAM')}
                                            onMouseLeave={() => setHoveredSection(null)}
                                        >
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-nobel-gold">Serviceable (SAM)</label>
                                            <MarketValueInput value={market.sam || 0} onChange={(v) => handleSaveMarket({ sam: v })} theme="gold" />
                                        </div>
                                        <div
                                            className={`bg-white p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${activeSection === 'SOM' ? 'border-stone-600 ring-1 ring-stone-500' : 'border-stone-200'}`}
                                            onClick={() => setSelectedSection(selectedSection === 'SOM' ? null : 'SOM')}
                                            onMouseEnter={() => setHoveredSection('SOM')}
                                            onMouseLeave={() => setHoveredSection(null)}
                                        >
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Obtainable (SOM)</label>
                                            <MarketValueInput value={market.som || 0} onChange={(v) => handleSaveMarket({ som: v })} theme="dark" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Toggle Button */}
                {isLeftCollapsed && market.reportContent && (
                    <button
                        onClick={() => setIsLeftCollapsed(false)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 text-white rounded-l-full hover:bg-emerald-600 transition-all z-50 shadow-lg group"
                        title="Open Report"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
            </motion.div>

            {/* Report Panel - Fixed overlay taking full height */}
            <AnimatePresence>
                {!isLeftCollapsed && (
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
                                <div className="p-2.5 bg-nobel-gold/10 rounded-full text-nobel-gold">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-serif text-xl text-stone-900">Market Intelligence</h2>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Top-Down Research Report</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {market.reportContent && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${isEditing ? 'bg-nobel-gold text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                        >
                                            {isEditing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                            {isEditing ? 'Done' : 'Edit'}
                                        </button>
                                        <button
                                            onClick={handleCopyReport}
                                            className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                            title="Copy Report"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setIsSaveDialogOpen(true)}
                                            className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                            title="Save to Documents"
                                        >
                                            <FolderPlus className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsLeftCollapsed(true)}
                                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors rounded-full hover:bg-stone-100"
                                    title="Close Report"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Keywords Section */}
                        <div className="px-8 py-3 border-b border-stone-100 bg-stone-50/30">
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="flex items-center bg-white rounded-lg px-2 py-1 border border-stone-200 focus-within:border-nobel-gold focus-within:ring-1 focus-within:ring-nobel-gold/50">
                                    <Target className="w-3 h-3 text-stone-400 mr-2" />
                                    <input
                                        type="text"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                        placeholder="Add keyword..."
                                        className="bg-transparent border-none text-xs focus:outline-none w-32 text-stone-700 placeholder-stone-400"
                                    />
                                    <button onClick={handleAddKeyword} className="ml-2 text-stone-400 hover:text-nobel-gold">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                {keywords.map(k => (
                                    <span key={k} className="inline-flex items-center gap-1 bg-white text-[10px] font-bold uppercase tracking-wider text-stone-600 px-2 py-1 rounded-md border border-stone-200 shadow-sm">
                                        {k}
                                        <button onClick={() => handleRemoveKeyword(k)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Report Content */}
                        <div className="flex-1 overflow-y-auto px-8 py-4">
                            {market.reportContent ? (
                                isEditing ? (
                                    <MiniStoryEditor
                                        content={market.reportContent}
                                        onChange={(newContent) => handleSaveMarket({ reportContent: newContent })}
                                    />
                                ) : (
                                    <div onClick={() => { if (canEdit) setIsEditing(true) }} className="cursor-text animate-in fade-in slide-in-from-right-4 duration-500">
                                        <MarkdownRenderer content={market.reportContent} />
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                                    <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                                    <p>No market research generated yet.</p>
                                    <button onClick={handleGenerate} disabled={isDisabled} className="mt-4 text-nobel-gold font-bold hover:underline disabled:opacity-50">
                                        Run Deep Research to analyze your market
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
                projectId={data.id}
                onSave={handleSaveToDocs}
                title="Save Market Research"
            />
        </div>
    );
};

export default MarketResearch;