import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from "../convex/_generated/api";
import { StartupData, Slide, AISettings, DeckTheme, CanvasItem, ToolType, Point } from '../types';
import { generatePitchDeck } from '../services/geminiService';
import { Loader2, ChevronLeft, ChevronRight, Check, Upload, Save, History, ChevronDown, ChevronUp, Plus, Trash2, X, Play, Monitor, Minimize2, Maximize2, Sparkles, Presentation, Bold, Italic, List, Table, Eye, Edit, Heading1, Heading2, Quote, Link as LinkIcon, Minus, Palette, Type, Image as ImageIcon, MousePointer2, StickyNote, Square, AlignLeft, AlignCenter, AlignRight, LayoutGrid, Search, RotateCw, Sliders, Pencil } from 'lucide-react';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { Logo } from './Logo';
import { UnifiedMediaPicker } from './UnifiedMediaPicker';
import SlideCanvasItem from './SlideCanvasItem';
import DeckHome from './DeckHome';

interface DeckBuilderProps {
    data: StartupData;
    allProjects: StartupData[];
    onBackToCanvas: () => void;
    onSaveDeckVersion: (name: string, slides: Slide[], theme?: DeckTheme, versionId?: string) => Promise<string | any>;
    onDeleteVersion: (versionId: string) => void;
    onSwitchProject: (id: string) => void;
    onNewProject: () => void;
    onNavigate: (view: any) => void;
    currentView: any;
    settings: AISettings;
    allowedPages?: string[];
}

const DEFAULT_THEME: DeckTheme = {
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#C5A059',
    fontFamily: 'serif'
};

const createDefaultSlides = (projectName: string): Slide[] => [
    {
        id: '1',
        title: 'Title Slide',
        content: '',
        items: [
            { id: '1-1', type: 'text', x: 100, y: 150, width: 800, height: 100, content: projectName || 'PROJECT NAME', rotation: 0, zIndex: 1, style: { fontSize: 80, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', textAlign: 'center', fontWeight: 'bold' } },
            { id: '1-2', type: 'text', x: 100, y: 300, width: 800, height: 60, content: 'Revolutionizing our industry with a bold new vision.', rotation: 0, zIndex: 2, style: { fontSize: 32, color: '#666', fontFamily: 'serif', backgroundColor: 'transparent', textAlign: 'center' } }
        ],
        notes: 'Introduce your company and the big idea.'
    },
    {
        id: '2',
        title: 'The Problem',
        content: '',
        items: [
            { id: '2-1', type: 'text', x: 100, y: 80, width: 800, height: 100, content: 'The Problem Worth Solving', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } },
            { id: '2-2', type: 'note', x: 100, y: 220, width: 400, height: 250, content: 'Pain Point #1: Current solutions are fragmented and inefficient.\n\nPain Point #2: 80% of founders struggle with this specific friction.', rotation: 0, zIndex: 2, style: { fontSize: 24, color: '#1a1a1a', fontFamily: 'sans', backgroundColor: '#C5A05940' } }
        ],
        notes: 'Define the pain clearly and quantify it if possible.'
    },
    {
        id: '3',
        title: 'The Solution',
        content: '',
        items: [
            { id: '3-1', type: 'text', x: 100, y: 80, width: 800, height: 100, content: 'Our Unique Solution', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } },
            { id: '3-2', type: 'text', x: 100, y: 220, width: 800, height: 120, content: 'We offer an All-in-One OS for founders that automates business planning, market research, and deck building.', rotation: 0, zIndex: 2, style: { fontSize: 36, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent' } }
        ],
        notes: 'How your product makes the problem disappear.'
    },
    {
        id: '4',
        title: 'Market Opportunity',
        content: '',
        items: [
            { id: '4-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Market Potential', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } },
            { id: '4-2', type: 'shape', x: 100, y: 200, width: 300, height: 300, content: '', rotation: 0, zIndex: 2, style: { backgroundColor: '#1a1a1a', shapeType: 'circle', color: '#000', fontSize: 16, fontFamily: 'sans' } },
            { id: '4-3', type: 'text', x: 125, y: 310, width: 250, height: 80, content: '$15B TAM', rotation: 0, zIndex: 3, style: { fontSize: 28, color: '#fff', textAlign: 'center', backgroundColor: 'transparent', fontFamily: 'sans', fontWeight: 'bold' } }
        ],
        notes: 'Identify TAM, SAM, and SOM.'
    },
    {
        id: '5',
        title: 'Product Demo',
        content: '',
        items: [
            { id: '5-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Magic at Your Fingertips', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } }
        ],
        notes: 'Add screenshots or a GIF of your core features.'
    },
    {
        id: '6',
        title: 'Business Model',
        content: '',
        items: [
            { id: '6-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Revenue Mechanics', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } },
            { id: '6-2', type: 'text', x: 100, y: 220, width: 800, height: 80, content: '1. SaaS Subscription: Monthly recurring revenue.\n2. Service Fees: Project-based monetization.', rotation: 0, zIndex: 2, style: { fontSize: 28, color: '#444', fontFamily: 'sans', backgroundColor: 'transparent' } }
        ],
        notes: 'Explain your pricing and monetization strategy.'
    },
    {
        id: '7',
        title: 'Competition',
        content: '',
        items: [
            { id: '7-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Why We Win', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } },
            { id: '7-2', type: 'line', x: 100, y: 300, width: 800, height: 2, content: '', rotation: 0, zIndex: 2, style: { color: '#000', backgroundColor: 'transparent', fontSize: 16, fontFamily: 'sans' } },
            { id: '7-3', type: 'line', x: 500, y: 150, width: 2, height: 350, content: '', rotation: 0, zIndex: 3, style: { color: '#000', backgroundColor: 'transparent', fontSize: 16, fontFamily: 'sans' } },
            { id: '7-4', type: 'text', x: 520, y: 160, width: 200, height: 40, content: 'US (Advanced AI)', rotation: 0, zIndex: 4, style: { fontSize: 18, color: '#C5A059', fontWeight: 'bold', fontFamily: 'sans', backgroundColor: 'transparent' } }
        ],
        notes: 'Map your unique value propositions against incumbents.'
    },
    { id: '8', title: 'The Team', content: '', items: [{ id: '8-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'The People Behind the Vision', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } }], notes: 'Why are you the right people?' },
    { id: '9', title: 'Traction', content: '', items: [{ id: '9-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Milestones & Momentum', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } }], notes: 'Users, revenue, or major partners.' },
    { id: '10', title: 'The Ask', content: '', items: [{ id: '10-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'Fueling Our Growth', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } }, { id: '10-2', type: 'text', x: 100, y: 220, width: 800, height: 80, content: 'We are raising $2M to scale our engineering and marketing efforts.', rotation: 0, zIndex: 2, style: { fontSize: 32, color: '#444', fontFamily: 'sans', backgroundColor: 'transparent' } }], notes: 'Be explicit about what you need.' },
    { id: '11', title: 'Impact', content: '', items: [{ id: '11-1', type: 'text', x: 100, y: 80, width: 800, height: 80, content: 'The Global Vision', rotation: 0, zIndex: 1, style: { fontSize: 48, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', fontWeight: 'bold' } }], notes: 'What does the world look like when you succeed?' },
    { id: '12', title: 'Thank You', content: '', items: [{ id: '12-1', type: 'text', x: 100, y: 150, width: 800, height: 100, content: 'JOIN US', rotation: 0, zIndex: 1, style: { fontSize: 80, color: '#1a1a1a', fontFamily: 'serif', backgroundColor: 'transparent', textAlign: 'center', fontWeight: 'bold' } }, { id: '12-2', type: 'text', x: 100, y: 300, width: 800, height: 60, content: 'contact@foudnerstack.ai', rotation: 0, zIndex: 2, style: { fontSize: 24, color: '#666', fontFamily: 'serif', backgroundColor: 'transparent', textAlign: 'center' } }], notes: 'Include call to action.' },
];

const FONTS = [
    { value: 'sans', label: 'Inter', category: 'Sans Serif', fontFamily: '"Inter", sans-serif' },
    { value: 'montserrat', label: 'Montserrat', category: 'Sans Serif', fontFamily: '"Montserrat", sans-serif' },
    { value: 'poppins', label: 'Poppins', category: 'Sans Serif', fontFamily: '"Poppins", sans-serif' },
    { value: 'raleway', label: 'Raleway', category: 'Sans Serif', fontFamily: '"Raleway", sans-serif' },
    { value: 'opensans', label: 'Open Sans', category: 'Sans Serif', fontFamily: '"Open Sans", sans-serif' },
    { value: 'roboto', label: 'Roboto', category: 'Sans Serif', fontFamily: '"Roboto", sans-serif' },
    { value: 'ubuntu', label: 'Ubuntu', category: 'Sans Serif', fontFamily: '"Ubuntu", sans-serif' },
    { value: 'oswald', label: 'Oswald', category: 'Sans Serif', fontFamily: '"Oswald", sans-serif' },
    { value: 'serif', label: 'Playfair Display', category: 'Serif', fontFamily: '"Playfair Display", serif' },
    { value: 'merriweather', label: 'Merriweather', category: 'Serif', fontFamily: '"Merriweather", serif' },
    { value: 'lora', label: 'Lora', category: 'Serif', fontFamily: '"Lora", serif' },
    { value: 'arvo', label: 'Arvo', category: 'Serif', fontFamily: '"Arvo", serif' },
    { value: 'slab', label: 'Roboto Slab', category: 'Serif', fontFamily: '"Roboto Slab", serif' },
    { value: 'mono', label: 'JetBrains Mono', category: 'Monospace', fontFamily: '"JetBrains Mono", monospace' },
    { value: 'cursive', label: 'Dancing Script', category: 'Handwriting', fontFamily: '"Dancing Script", cursive' },
    { value: 'pacifico', label: 'Pacifico', category: 'Handwriting', fontFamily: '"Pacifico", cursive' },
    { value: 'permanentmarker', label: 'Permanent Marker', category: 'Handwriting', fontFamily: '"Permanent Marker", cursive' },
];

const PRESET_COLORS = [
    { value: '#1a1a1a', label: 'Dark' },
    { value: '#ffffff', label: 'White' },
    { value: '#C5A059', label: 'Gold' },
    { value: '#EF4444', label: 'Red' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#ffecd2', label: 'Peach' },
    { value: '#fcb69f', label: 'Salmon' },
    { value: '#a1c4fd', label: 'Sky' },
];

const DeckBuilder: React.FC<DeckBuilderProps> = ({
    data,
    allProjects,
    onNavigate,
    onSaveDeckVersion,
    onDeleteVersion,
    onSwitchProject,
    onNewProject,
    currentView,
    settings,
    allowedPages
}) => {
    const bgColorInputRef = useRef<HTMLInputElement>(null);
    const textColorInputRef = useRef<HTMLInputElement>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'style' | 'elements'>('elements');
    const [bulkStyleMode, setBulkStyleMode] = useState(false);
    const [isHome, setIsHome] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
    const [saveAsNewVersion, setSaveAsNewVersion] = useState(false);
    const [deckName, setDeckName] = useState(data?.name || 'Untitled Deck');
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const versions = useQuery(api.decks.listVersions, { projectId: data.id as any }) || [];

    const [theme, setTheme] = useState<DeckTheme>(DEFAULT_THEME);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const interactionRef = useRef<{
        type: 'move' | 'resize' | null;
        startPos: Point;
        itemStartPos: Point;
        itemStartSize: { width: number; height: number };
        resizeHandle: string | null;
    }>({
        type: null,
        startPos: { x: 0, y: 0 },
        itemStartPos: { x: 0, y: 0 },
        itemStartSize: { width: 0, height: 0 },
        resizeHandle: null,
    });

    const slidesRef = useRef(slides);
    const themeRef = useRef(theme);
    const currentVersionIdRef = useRef(currentVersionId);
    const isHomeRef = useRef(isHome);
    const deckNameRef = useRef(deckName);

    useEffect(() => { slidesRef.current = slides; }, [slides]);
    useEffect(() => { themeRef.current = theme; }, [theme]);
    useEffect(() => { currentVersionIdRef.current = currentVersionId; }, [currentVersionId]);
    useEffect(() => { isHomeRef.current = isHome; }, [isHome]);
    useEffect(() => { deckNameRef.current = deckName; }, [deckName]);

    // Mount logic: Load latest version from Convex if available
    useEffect(() => {
        if (!data.id) return;

        // Skip if we already have slides loaded for this project (prevents loop)
        if (slides.length > 0) return;

        if (data.deckVersions && data.deckVersions.length > 0) {
            const initialVersion = data.deckVersions[0];
            const parsedSlides = initialVersion.slides.map(s => ({
                ...s,
                items: typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || [])
            }));
            setSlides(parsedSlides);
            if (initialVersion.theme) setTheme(initialVersion.theme);
            setCurrentVersionId(initialVersion.id);
            if (initialVersion.name) setDeckName(initialVersion.name);
        } else if (versions && versions.length > 0) {
            const v = versions[0];
            const parsedSlides = JSON.parse(v.slidesData).map((s: any) => ({
                ...s,
                items: typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || [])
            }));
            setSlides(parsedSlides);
            if (v.theme) setTheme(JSON.parse(v.theme));
            setCurrentVersionId(v._id);
            if (v.name) setDeckName(v.name);
        } else if (versions !== undefined) {
            // Only set defaults if versions is loaded and empty
            setSlides(createDefaultSlides(data.name));
            setCurrentVersionId(null);
        }
    }, [data.id, versions?.length]);

    const activeSlide: Slide = slides[activeSlideIndex] || { id: 'temp', title: 'Slide', content: '', items: [], notes: '' };
    const itemsArray = Array.isArray(activeSlide.items) ? activeSlide.items : [];
    const selectedItem = itemsArray.find(i => i.id === selectedItemId) || null;

    const updateSlide = (updates: Partial<Slide>) => {
        const newSlides = [...slides];
        newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], ...updates };
        setSlides(newSlides);
    };

    const updateItem = (id: string, updates: Partial<CanvasItem>) => {
        const newItems = activeSlide.items?.map(item => item.id === id ? { ...item, ...updates } : item) || [];
        updateSlide({ items: newItems });
    };

    const updateItemStyle = (id: string, style: Partial<CanvasItem['style']>) => {
        if (bulkStyleMode) {
            const newItems = itemsArray.map(item => ({
                ...item,
                style: { ...item.style, ...style }
            }));
            updateSlide({ items: newItems });
        } else {
            const item = itemsArray.find(i => i.id === id);
            if (item) {
                updateItem(id, { style: { ...item.style, ...style } });
            }
        }
    };

    const updateItemTransform = (id: string, updates: Partial<CanvasItem>) => {
        if (bulkStyleMode) {
            const newItems = itemsArray.map(item => ({
                ...item,
                ...updates
            }));
            updateSlide({ items: newItems });
        } else {
            updateItem(id, updates);
        }
    };

    const bringToFront = (id: string) => {
        const maxZ = Math.max(...itemsArray.map(i => i.zIndex || 0), 0);
        updateItem(id, { zIndex: maxZ + 1 });
    };

    const sendToBack = (id: string) => {
        const minZ = Math.min(...itemsArray.map(i => i.zIndex || 0), 0);
        updateItem(id, { zIndex: minZ - 1 });
    };

    const getCoordinates = (e: React.PointerEvent | PointerEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const addItem = (type: CanvasItem['type'], extra?: any) => {
        const newItem: CanvasItem = {
            id: Date.now().toString(),
            type,
            x: 100,
            y: 100,
            width: type === 'line' ? 200 : type === 'note' ? 200 : type === 'shape' ? 150 : 300,
            height: type === 'line' ? 4 : type === 'note' ? 200 : type === 'shape' ? 150 : 100,
            content: type === 'text' ? 'New Text' : type === 'note' ? 'New Note' : '',
            rotation: 0,
            zIndex: (activeSlide.items?.length || 0) + 1,
            style: {
                fontSize: type === 'text' ? 24 : 16,
                color: theme.textColor,
                fontFamily: theme.fontFamily,
                backgroundColor: type === 'note' ? '#C5A05940' : 'transparent',
                textAlign: 'center',
                ...extra
            }
        };
        updateSlide({ items: [...(activeSlide.items || []), newItem] });
        setSelectedItemId(newItem.id);
        setActiveTool('select');
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (activeTool !== 'select') {
            if (activeTool === 'text') addItem('text');
            if (activeTool === 'note') addItem('note');
            if (activeTool as string === 'square') addItem('shape', { shapeType: 'square', backgroundColor: theme.accentColor + '40', fontFamily: 'sans' });
            if (activeTool as string === 'circle') addItem('shape', { shapeType: 'circle', backgroundColor: theme.accentColor + '40', fontFamily: 'sans' });
            if (activeTool === 'line') addItem('line', { color: theme.textColor, fontFamily: 'sans', backgroundColor: 'transparent' });
            return;
        }
        if (e.target === canvasRef.current) {
            setSelectedItemId(null);
        }
    };

    const handleItemPointerDown = (e: React.PointerEvent, type: 'move' | 'resize', handle: string | null, itemId: string) => {
        e.stopPropagation();
        setSelectedItemId(itemId);
        const item = activeSlide.items?.find(i => i.id === itemId);
        if (!item) return;

        interactionRef.current = {
            type,
            startPos: { x: e.clientX, y: e.clientY },
            itemStartPos: { x: item.x, y: item.y },
            itemStartSize: { width: item.width, height: item.height },
            resizeHandle: handle
        };

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const { type, startPos, itemStartPos, itemStartSize, resizeHandle } = interactionRef.current;
            if (!type) return;

            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;

            if (type === 'move') {
                updateItem(itemId, { x: itemStartPos.x + dx, y: itemStartPos.y + dy });
            } else if (type === 'resize' && resizeHandle) {
                let updates: any = {};
                if (resizeHandle.includes('e')) updates.width = Math.max(20, itemStartSize.width + dx);
                if (resizeHandle.includes('s')) updates.height = Math.max(20, itemStartSize.height + dy);
                if (resizeHandle.includes('w')) {
                    updates.width = Math.max(20, itemStartSize.width - dx);
                    updates.x = itemStartPos.x + dx;
                }
                if (resizeHandle.includes('n')) {
                    updates.height = Math.max(20, itemStartSize.height - dy);
                    updates.y = itemStartPos.y + dy;
                }

                // Enforce Aspect Ratio for circles
                if (item?.type === 'shape' && item?.style?.shapeType === 'circle') {
                    if (updates.width && updates.height) {
                        const size = Math.max(updates.width, updates.height);
                        updates.width = size;
                        updates.height = size;
                    } else if (updates.width) {
                        updates.height = updates.width;
                    } else if (updates.height) {
                        updates.width = updates.height;
                    }
                }
                updateItem(itemId, updates);
            }
        };

        const handlePointerUp = () => {
            interactionRef.current.type = null;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleMediaSelect = (url: string) => {
        const newItem: CanvasItem = {
            id: Date.now().toString(),
            type: 'image',
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            content: url,
            rotation: 0,
            zIndex: (activeSlide.items?.length || 0) + 1,
            style: {
                backgroundColor: 'transparent',
                color: '#000',
                fontSize: 16,
                fontFamily: 'sans'
            }
        };
        updateSlide({ items: [...(activeSlide.items || []), newItem] });
        setShowMediaPicker(false);
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            if (!isHomeRef.current && slidesRef.current.length > 0) {
                const resultId = await onSaveDeckVersion(deckNameRef.current || "Auto-save", slidesRef.current, themeRef.current, currentVersionIdRef.current || undefined);
                if (resultId && typeof resultId === 'string' && !currentVersionIdRef.current) {
                    setCurrentVersionId(resultId);
                }
            }
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [onSaveDeckVersion]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPresenting) {
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
                } else if (e.key === 'ArrowLeft') {
                    setActiveSlideIndex(prev => Math.max(0, prev - 1));
                } else if (e.key === 'Escape') {
                    setIsPresenting(false);
                }
            } else if (selectedItemId && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    const newItems = itemsArray.filter(i => i.id !== selectedItemId);
                    updateSlide({ items: newItems });
                    setSelectedItemId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPresenting, slides.length, selectedItemId, itemsArray, updateSlide]);

    if (isHome) {
        return (
            <div className="min-h-screen flex flex-col text-stone-900 bg-[#F9F8F4] font-sans">
                <header className="px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between sticky top-0 z-40 shrink-0">
                    <div className="flex items-center gap-4">
                        <Logo imageClassName="h-8 w-auto" />
                        <div className="h-6 w-px bg-stone-200" />
                        <ProjectSelector projects={allProjects} currentProjectId={data.id} onSelectProject={onSwitchProject} onCreateNew={onNewProject} />
                        <div className="h-6 w-px bg-stone-200" />
                        <TabNavigation currentView={currentView} onNavigate={onNavigate} allowedPages={allowedPages} projectFeatures={{ canvasEnabled: data.canvasEnabled, marketResearchEnabled: data.marketResearchEnabled }} />
                    </div>
                </header>
                <DeckHome
                    versions={versions}
                    projectName={data.name}
                    onNewDeck={() => {
                        setSlides(createDefaultSlides(data.name));
                        setTheme(DEFAULT_THEME);
                        setCurrentVersionId(null);
                        setDeckName(data.name);
                        setSaveAsNewVersion(true);
                        setIsHome(false);
                    }}
                    onSelectVersion={(v) => {
                        const parsedSlides = JSON.parse(v.slidesData).map((s: any) => ({
                            ...s,
                            items: typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || [])
                        }));
                        setSlides(parsedSlides);
                        if (v.theme) setTheme(JSON.parse(v.theme));
                        setCurrentVersionId(v._id);
                        setDeckName(v.name);
                        setSaveAsNewVersion(false);
                        setIsHome(false);
                    }}
                    onDeleteVersion={onDeleteVersion}
                />
            </div>
        );
    }

    if (isPresenting) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-0 select-none overflow-hidden">
                <div
                    className="relative shadow-2xl overflow-hidden bg-white shrink-0"
                    style={{
                        backgroundColor: theme.backgroundColor,
                        width: '1920px',
                        height: '1080px',
                        transform: `scale(${Math.min(windowSize.width / 1920, windowSize.height / 1080) * 0.9})`,
                        transformOrigin: 'center center'
                    }}
                >
                    {(activeSlide.items || []).map((item) => (
                        <SlideCanvasItem
                            key={item.id}
                            item={item}
                            isSelected={false}
                            onMouseDown={() => { }}
                            updateItemContent={() => { }}
                            scale={1}
                            accentColor={theme.accentColor}
                        />
                    ))}
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 bg-stone-900/80 backdrop-blur-md rounded-full border border-white/10 text-white shadow-2xl transition-opacity opacity-0 hover:opacity-100 group">
                    <button
                        onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeSlideIndex === 0}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-20"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="text-xs font-bold tracking-widest min-w-[80px] text-center">
                        SLIDE {activeSlideIndex + 1} / {slides.length}
                    </div>
                    <button
                        onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                        disabled={activeSlideIndex === slides.length - 1}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-20"
                    >
                        <ChevronRight size={24} />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <button
                        onClick={() => setIsPresenting(false)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                    <div
                        className="h-full bg-nobel-gold transition-all duration-300"
                        style={{ width: `${((activeSlideIndex + 1) / slides.length) * 100}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-slate-900 bg-[#F1F5F9] font-sans overflow-hidden">
            {/* Editor Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between sticky top-0 z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsHome(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 mr-2"><ChevronLeft size={20} /></button>
                    <div className="flex flex-col relative group/title">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                className="text-lg font-serif font-bold leading-tight bg-transparent border-none outline-none focus:ring-0 p-0 w-64 hover:bg-slate-50/50 rounded transition-colors"
                                placeholder="Deck Name"
                            />
                            <Pencil size={12} className="text-slate-300 group-hover/title:text-slate-600 transition-colors" />
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-[0.1em] font-black mt-0.5">{data.name} • Version Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Save as new</span>
                        <button
                            onClick={() => setSaveAsNewVersion(!saveAsNewVersion)}
                            className={`w-9 h-5 rounded-full relative transition-all duration-300 ${saveAsNewVersion ? 'bg-slate-900' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${saveAsNewVersion ? 'left-5' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                const targetId = saveAsNewVersion ? undefined : (currentVersionId || undefined);
                                const resultId = await onSaveDeckVersion(
                                    deckName || activeSlide.title || "Manual Save",
                                    slides,
                                    theme,
                                    targetId
                                );
                                if (resultId && typeof resultId === 'string') {
                                    setCurrentVersionId(resultId);
                                }
                                if (saveAsNewVersion) setSaveAsNewVersion(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all text-sm font-bold shadow-lg"
                        >
                            <Save size={16} /> {saveAsNewVersion ? 'SAVE AS NEW' : 'UPDATE VERSION'}
                        </button>
                        <button onClick={() => setIsPresenting(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-full hover:bg-stone-50 transition-all text-sm font-bold shadow-sm">
                            <Play size={16} /> PRESENT
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-80 border-r border-stone-200 bg-[#F8FAFC] flex flex-col shrink-0 z-20 shadow-xl overflow-hidden">
                    <div className="flex border-b border-slate-200 bg-white/50 backdrop-blur-md">
                        <button onClick={() => setSidebarTab('elements')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${sidebarTab === 'elements' ? 'text-slate-900 bg-slate-100/50 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}>Elements</button>
                        <button onClick={() => setSidebarTab('style')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${sidebarTab === 'style' ? 'text-slate-900 bg-slate-100/50 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}>Style</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        {sidebarTab === 'elements' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => addItem('text')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <Type className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Text</span>
                                </button>
                                <button onClick={() => addItem('note')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <StickyNote className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Note</span>
                                </button>
                                <button onClick={() => setShowMediaPicker(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Media</span>
                                </button>
                                <div className="col-span-2 h-px bg-slate-200/50 my-2" />
                                <button onClick={() => addItem('shape', { shapeType: 'circle', backgroundColor: theme.accentColor + '40', borderWidth: 2, borderColor: theme.accentColor })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-white transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Circle</span>
                                </button>
                                <button onClick={() => addItem('shape', { shapeType: 'rect', backgroundColor: theme.accentColor + '40', borderWidth: 2, borderColor: theme.accentColor })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <Square className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Square</span>
                                </button>
                                <button onClick={() => addItem('shape', { shapeType: 'triangle', backgroundColor: theme.accentColor + '40', borderWidth: 2, borderColor: theme.accentColor })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-slate-300 group-hover:border-b-white transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Triangle</span>
                                </button>
                                <button onClick={() => addItem('line', { color: theme.accentColor, borderStyle: 'solid' })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <Minus className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Line</span>
                                </button>
                                <button onClick={() => addItem('line', { color: theme.accentColor, borderStyle: 'dotted' })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <div className="w-5 h-0 border-b-2 border-dotted border-slate-400 group-hover:border-white mt-1 transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Dotted</span>
                                </button>
                                <button onClick={() => addItem('line', { color: theme.accentColor, borderStyle: 'dashed' })} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-800 hover:shadow-lg transition-all group shadow-sm active:scale-95">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                                        <div className="w-5 h-0 border-b-2 border-dashed border-slate-400 group-hover:border-white mt-1 transition-colors" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Dashed</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Typography</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setTheme({ ...theme, fontFamily: 'serif' })} className={`p-3 rounded-xl border-2 text-sm font-serif transition-all ${theme.fontFamily === 'serif' ? 'border-slate-800 bg-slate-800 text-white shadow-lg' : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>Serif</button>
                                        <button onClick={() => setTheme({ ...theme, fontFamily: 'sans' })} className={`p-3 rounded-xl border-2 text-sm font-sans transition-all ${theme.fontFamily === 'sans' ? 'border-slate-800 bg-slate-800 text-white shadow-lg' : 'border-slate-200 text-slate-400 hover:border-slate-300 bg-white'}`}>Sans</button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colors</p>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Accent</span>
                                            <span className="text-[9px] text-slate-400 font-bold">Primary Brand Color</span>
                                        </div>
                                        <input type="color" value={theme.accentColor} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-slate-100 cursor-pointer overflow-hidden p-0" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <div className="flex-1 bg-stone-100 relative overflow-hidden flex flex-col">
                    {/* Canvas Editor Area */}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-12">
                        {/* Floating Selection Toolbar */}
                        {selectedItem && (
                            <div className="mb-6 flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 z-50">
                                {/* Bulk Update Toggle */}
                                <button
                                    onClick={() => setBulkStyleMode(!bulkStyleMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[9px] font-black uppercase tracking-widest border ${bulkStyleMode ? 'bg-nobel-gold border-nobel-gold text-white shadow-inner' : 'bg-stone-50 border-stone-200 text-stone-400'}`}
                                >
                                    <LayoutGrid size={12} /> {bulkStyleMode ? 'GLOBAL EDIT' : 'SINGLE EDIT'}
                                </button>

                                <div className="w-px h-4 bg-stone-100 mx-1" />

                                {/* Contextual Font Tools */}
                                {(selectedItem.type === 'text' || selectedItem.type === 'note') && (
                                    <>
                                        <div className="relative group/font">
                                            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-50 rounded-full transition-colors border border-transparent hover:border-stone-100">
                                                <Type size={14} className="text-stone-400" />
                                                <span className="text-xs font-medium w-24 text-left truncate" style={{ fontFamily: selectedItem.style.fontFamily }}>
                                                    {FONTS.find(f => f.value === selectedItem.style.fontFamily)?.label || 'Inter'}
                                                </span>
                                                <ChevronDown size={14} className="text-stone-400" />
                                            </button>
                                            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/font:opacity-100 group-hover/font:visible transition-all z-50 max-h-80 overflow-y-auto p-2 scrollbar-none">
                                                {FONTS.map(font => (
                                                    <button
                                                        key={font.value}
                                                        onClick={() => updateItemStyle(selectedItem.id, { fontFamily: font.value })}
                                                        className="w-full text-left px-3 py-2 hover:bg-stone-50 rounded-xl transition-colors text-xs font-medium"
                                                        style={{ fontFamily: font.fontFamily }}
                                                    >
                                                        {font.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-px h-4 bg-stone-100 mx-1" />
                                        <button
                                            onClick={() => updateItemStyle(selectedItem.id, { fontWeight: selectedItem.style.fontWeight === 'bold' ? 'normal' : 'bold' })}
                                            className={`p-2 rounded-full transition-colors ${selectedItem.style.fontWeight === 'bold' ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-600'}`}
                                        >
                                            <Bold size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateItemStyle(selectedItem.id, { fontStyle: selectedItem.style.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                            className={`p-2 rounded-full transition-colors ${selectedItem.style.fontStyle === 'italic' ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-600'}`}
                                        >
                                            <Italic size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-stone-100 mx-1" />
                                        <button
                                            onClick={() => updateItemStyle(selectedItem.id, { textAlign: 'left' })}
                                            className={`p-2 rounded-full transition-colors ${selectedItem.style.textAlign === 'left' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-600'}`}
                                        >
                                            <AlignLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateItemStyle(selectedItem.id, { textAlign: 'center' })}
                                            className={`p-2 rounded-full transition-colors ${(!selectedItem.style.textAlign || selectedItem.style.textAlign === 'center') ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-600'}`}
                                        >
                                            <AlignCenter size={16} />
                                        </button>
                                        <button
                                            onClick={() => updateItemStyle(selectedItem.id, { textAlign: 'right' })}
                                            className={`p-2 rounded-full transition-colors ${selectedItem.style.textAlign === 'right' ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100 text-stone-600'}`}
                                        >
                                            <AlignRight size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-stone-100 mx-1" />
                                    </>
                                )}

                                {/* Contextual Colors */}
                                <div className="flex items-center gap-1.5 px-1">
                                    {/* Text Color for Text/Notes */}
                                    {(selectedItem.type === 'text' || selectedItem.type === 'note') && (
                                        <div className="flex items-center gap-1">
                                            <Type size={14} className="text-stone-300 mr-1" />
                                            {PRESET_COLORS.slice(0, 4).map(color => (
                                                <button
                                                    key={color.value}
                                                    onClick={() => updateItemStyle(selectedItem.id, { color: color.value })}
                                                    className={`w-5 h-5 rounded-full border border-white shadow-sm hover:scale-110 transition-transform ${selectedItem.style.color === color.value ? 'ring-1 ring-stone-900 ring-offset-1' : ''}`}
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            ))}
                                            <button
                                                onClick={() => textColorInputRef.current?.click()}
                                                className="w-5 h-5 rounded-full border border-dashed border-stone-300 flex items-center justify-center hover:bg-stone-50 transition-colors"
                                            >
                                                <Plus size={10} className="text-stone-400" />
                                                <input ref={textColorInputRef} type="color" className="sr-only" onChange={(e) => updateItemStyle(selectedItem.id, { color: e.target.value })} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Background Color for Shapes/Notes */}
                                    {(selectedItem.type === 'shape' || selectedItem.type === 'note' || selectedItem.type === 'line') && (
                                        <>
                                            {selectedItem.type === 'note' && <div className="w-px h-4 bg-stone-100 mx-1" />}
                                            <div className="flex items-center gap-1">
                                                <Palette size={14} className="text-stone-300 mr-1" />
                                                {PRESET_COLORS.slice(0, 4).map(color => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => updateItemStyle(selectedItem.id, { [selectedItem.type === 'line' ? 'color' : 'backgroundColor']: color.value })}
                                                        className={`w-5 h-5 rounded-md border border-white shadow-sm hover:scale-110 transition-transform ${(selectedItem.style.backgroundColor === color.value || (selectedItem.type === 'line' && selectedItem.style.color === color.value)) ? 'ring-1 ring-stone-900 ring-offset-1' : ''}`}
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                ))}
                                                <button
                                                    onClick={() => bgColorInputRef.current?.click()}
                                                    className="w-5 h-5 rounded-md border border-dashed border-stone-300 flex items-center justify-center hover:bg-stone-50 transition-colors"
                                                >
                                                    <Plus size={10} className="text-stone-400" />
                                                    <input ref={bgColorInputRef} type="color" className="sr-only" onChange={(e) => updateItemStyle(selectedItem.id, { [selectedItem.type === 'line' ? 'color' : 'backgroundColor']: e.target.value })} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="w-px h-4 bg-stone-100 mx-1" />

                                {/* Layering Controls */}
                                <div className="flex items-center gap-1">
                                    <button onClick={() => bringToFront(selectedItem.id)} className="p-2 hover:bg-stone-100 text-stone-600 rounded-full transition-colors" title="Bring to Front"><ChevronUp size={16} /></button>
                                    <button onClick={() => sendToBack(selectedItem.id)} className="p-2 hover:bg-stone-100 text-stone-600 rounded-full transition-colors" title="Send to Back"><ChevronDown size={16} /></button>
                                </div>

                                <div className="w-px h-4 bg-stone-100 mx-1" />

                                {/* Transform Controls */}
                                <div className="relative group/transform">
                                    <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-stone-50 rounded-full transition-colors border border-transparent hover:border-stone-100">
                                        <Sliders size={14} className="text-stone-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Transform</span>
                                        <ChevronDown size={14} className="text-stone-400" />
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/transform:opacity-100 group-hover/transform:visible transition-all z-50 p-4 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rotation</span><span className="text-xs font-medium text-stone-900">{selectedItem.rotation}°</span></div>
                                            <input type="range" min="-180" max="180" value={selectedItem.rotation} onChange={(e) => updateItemTransform(selectedItem.id, { rotation: parseInt(e.target.value) })} className="w-full accent-nobel-gold h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer" />
                                        </div>
                                        {selectedItem.type !== 'line' && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Rounding</span><span className="text-xs font-medium text-stone-900">{selectedItem.style.borderRadius || 0}px</span></div>
                                                <input type="range" min="0" max="100" value={selectedItem.style.borderRadius || 0} onChange={(e) => updateItemStyle(selectedItem.id, { borderRadius: parseInt(e.target.value) })} className="w-full accent-nobel-gold h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-px h-4 bg-stone-100 mx-1" />

                                <button
                                    onClick={() => {
                                        const newItems = activeSlide.items?.filter(i => i.id !== selectedItemId) || [];
                                        updateSlide({ items: newItems });
                                        setSelectedItemId(null);
                                    }}
                                    className="p-2 hover:bg-red-50 text-red-400 rounded-full transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        <div
                            ref={canvasRef}
                            className="w-full max-w-5xl aspect-video shadow-2xl relative overflow-hidden bg-white"
                            style={{ backgroundColor: theme.backgroundColor }}
                            onPointerDown={handlePointerDown}
                        >
                            {(activeSlide.items || []).map((item) => (
                                <SlideCanvasItem
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedItemId === item.id}
                                    onMouseDown={(e, type, handle) => handleItemPointerDown(e, type, handle, item.id)}
                                    updateItemContent={(id, content) => updateItem(id, { content })}
                                    scale={1}
                                    accentColor={theme.accentColor}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bottom Slide Navbar */}
                    <div className="h-40 border-t border-stone-200 bg-white/50 backdrop-blur-md flex items-center gap-4 px-6 overflow-x-auto scrollbar-hide shrink-0 z-30">
                        {slides.map((s, idx) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSlideIndex(idx)}
                                className={`group flex flex-col gap-2 shrink-0 transition-all ${activeSlideIndex === idx ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`w-40 aspect-video rounded-xl border-2 bg-white relative overflow-hidden transition-all ${activeSlideIndex === idx ? 'border-nobel-gold ring-4 ring-nobel-gold/10 shadow-lg' : 'border-stone-200 shadow-sm'}`}>
                                    {/* Mini Preview of Slide Content */}
                                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: theme.backgroundColor }}>
                                        <div className="relative w-full h-full transform scale-[0.156] origin-top-left" style={{ width: '1024px', height: '576px' }}>
                                            {(s.items || []).map((item: CanvasItem) => (
                                                <SlideCanvasItem
                                                    key={item.id}
                                                    item={item}
                                                    isSelected={false}
                                                    onMouseDown={() => { }}
                                                    updateItemContent={() => { }}
                                                    scale={1}
                                                    accentColor={theme.accentColor}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute top-2 left-2 bg-stone-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md">{idx + 1}</div>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate w-40 text-stone-500 group-hover:text-stone-900 transition-colors">{s.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {showMediaPicker && (
                <UnifiedMediaPicker
                    onSelect={handleMediaSelect}
                    onClose={() => setShowMediaPicker(false)}
                    projectId={data.id}
                    initialSearchTerm={activeSlide.title}
                />
            )}
        </div>
    );
};

export default DeckBuilder;
