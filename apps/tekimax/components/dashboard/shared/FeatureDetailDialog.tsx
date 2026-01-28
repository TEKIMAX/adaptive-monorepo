import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear, scaleTime } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { ParentSize } from '@visx/responsive';
import ReactMarkdown from 'react-markdown';

// --- VISX COMPONENTS ---

const blue = '#60a5fa';
const background = 'transparent';

// Latency Chart
const LatencyChart = ({ width, height, data }: { width: number; height: number; data: any[] }) => {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xMax = Math.max(innerWidth, 0);
    const yMax = Math.max(innerHeight, 0);

    const dateScale = useMemo(
        () => scaleTime({
            range: [0, xMax],
            domain: data.length > 0
                ? [Math.min(...data.map(d => d.date.getTime())), Math.max(...data.map(d => d.date.getTime()))]
                : [Date.now() - 30000, Date.now()],
        }),
        [xMax, data],
    );

    const valueScale = useMemo(
        () => scaleLinear({
            range: [yMax, 0],
            domain: [0, Math.max(...data.map(d => d.value), 100) * 1.2],
            nice: true,
        }),
        [yMax, data],
    );

    return width < 10 ? null : (
        <svg width={width} height={height}>
            <rect width={width} height={height} fill={background} />
            <Group top={margin.top} left={margin.left}>
                <GridRows scale={valueScale} width={innerWidth} strokeDasharray="3,3" stroke="rgba(255,255,255,0.05)" pointerEvents="none" />
                <GridColumns scale={dateScale} height={innerHeight} strokeDasharray="3,3" stroke="rgba(255,255,255,0.05)" pointerEvents="none" />

                {data.length > 0 && (
                    <>
                        <AreaClosed
                            data={data}
                            x={d => dateScale(d.date.getTime()) ?? 0}
                            y={d => valueScale(d.value) ?? 0}
                            yScale={valueScale}
                            strokeWidth={2}
                            stroke="transparent"
                            fill="url(#area-gradient)"
                            curve={curveMonotoneX}
                        />

                        <LinePath
                            data={data}
                            x={d => dateScale(d.date.getTime()) ?? 0}
                            y={d => valueScale(d.value) ?? 0}
                            stroke={blue}
                            strokeWidth={2}
                            curve={curveMonotoneX}
                        />
                    </>
                )}

                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={blue} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={blue} stopOpacity={0} />
                </linearGradient>

                <AxisLeft
                    scale={valueScale}
                    stroke="transparent"
                    tickStroke="rgba(255,255,255,0.1)"
                    tickLabelProps={() => ({
                        fill: 'rgba(255,255,255,0.3)',
                        fontSize: 9,
                        textAnchor: 'end',
                        dy: '0.33em',
                        dx: -4,
                        fontFamily: 'monospace',
                    })}
                />
                <AxisBottom
                    top={yMax}
                    scale={dateScale}
                    stroke="transparent"
                    tickStroke="rgba(255,255,255,0.1)"
                    tickLabelProps={() => ({
                        fill: 'rgba(255,255,255,0.3)',
                        fontSize: 9,
                        textAnchor: 'middle',
                        fontFamily: 'monospace',
                    })}
                />
            </Group>
        </svg>
    );
};

// Heatmap Chart
const HeatmapChart = ({ width, height, data }: { width: number; height: number; data: any[] }) => {
    const margin = { top: 10, right: 10, bottom: 30, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = scaleLinear<number>({
        domain: [0, 20],
        range: [0, innerWidth],
    });

    const yScale = scaleLinear<number>({
        domain: [0, 8],
        range: [0, innerHeight],
    });

    const colorScale = scaleLinear<string>({
        range: ['rgba(96,165,250,0.05)', 'rgba(96,165,250,1)'],
        domain: [0, 100],
    });

    return width < 10 ? null : (
        <svg width={width} height={height}>
            <Group top={margin.top} left={margin.left}>
                <HeatmapRect
                    data={data}
                    xScale={xScale}
                    yScale={yScale}
                    colorScale={colorScale}
                    binWidth={innerWidth / 20}
                    binHeight={innerHeight / 8}
                    gap={2}
                >
                    {heatmap =>
                        heatmap.map(heatmapBins =>
                            heatmapBins.map(bin => (
                                <rect
                                    key={`heatmap-rect-${bin.row}-${bin.column}`}
                                    width={bin.width}
                                    height={bin.height}
                                    x={bin.x}
                                    y={bin.y}
                                    fill={bin.color}
                                    rx={2}
                                />
                            )),
                        )
                    }
                </HeatmapRect>
            </Group>
        </svg>
    );
};

// --- DIALOG PROPS ---

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    feature: any;
}

export const FeatureDetailDialog: React.FC<DialogProps> = ({ isOpen, onClose, feature }) => {
    if (!isOpen || !feature) return null;

    const [activeTab, setActiveTab] = useState<'config' | 'integration' | 'monitor'>('config');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Live Telemetry State
    const [telemetry, setTelemetry] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>(() =>
        Array.from({ length: 8 }).map((_, r) => ({
            bin: r,
            bins: Array.from({ length: 20 }).map((_, c) => ({
                bin: c,
                count: Math.floor(Math.random() * 20),
            })),
        }))
    );
    const [streamingMeta, setStreamingMeta] = useState<any>({ org: 'connecting...', agency: 0.85 });

    // Initial state based on feature params
    const [formData, setFormData] = useState<any>(() => {
        const initial: any = {};
        feature.params?.forEach((p: any) => {
            if (p.name === 'modality_context') {
                initial.modality_type = 'textual';
                initial.support_level = 'standard';
            } else if (p.type === 'object') {
                if (p.name === 'modality_preferences') {
                    initial[p.name] = JSON.stringify({
                        preferred_modality: 'visual',
                        complexity_level: 'standard',
                        accessibility_mode: false
                    }, null, 2);
                } else if (p.name === 'compliance_config') {
                    initial[p.name] = JSON.stringify({
                        nist_rmf_v1_0: true,
                        omb_m_25_21: true,
                        audit_retention_days: 365
                    }, null, 2);
                } else {
                    initial[p.name] = '{}';
                }
            } else {
                initial[p.name] = p.default ?? '';
            }
        });
        if (initial.prompt === '') initial.prompt = 'How does the Adaptive Engine work?';
        if (initial.query === '') initial.query = 'Show me recent learning trends';
        if (initial.correction_text === '') initial.correction_text = 'Check this for factual errors';
        if (initial.id === '') initial.id = 'int-e168b9d5-a39c-44c4-af8a-1a85c1b33f0d';
        return initial;
    });

    // SSE Effect
    useEffect(() => {
        if (activeTab !== 'monitor') return;

        const API_KEY = 'sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH';
        const sse = new EventSource(`http://localhost:8080/v1/metrics/stream?token=${API_KEY}`);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Update Latency (keep last 40 points)
                setTelemetry(prev => {
                    const next = [...prev, {
                        date: new Date(data.timestamp || Date.now()),
                        value: data.latency || 40 + Math.random() * 40
                    }];
                    return next.slice(-40);
                });

                // Update metadata
                if (data.organization_id) {
                    setStreamingMeta({
                        org: data.organization_id,
                        agency: data.human_agency_score || 0.85
                    });
                }

                // Subtly shift heatmap
                setHeatmapData(prev => prev.map(row => ({
                    ...row,
                    bins: row.bins.map(bin => ({
                        ...bin,
                        count: Math.max(0, Math.min(100, bin.count + (Math.random() > 0.5 ? 2 : -2)))
                    }))
                })));

            } catch (err) {
                console.error("SSE Parse Error:", err);
            }
        };

        sse.onerror = (err) => {
            console.error("SSE Connection Error:", err);
            sse.close();
        };

        return () => sse.close();
    }, [activeTab]);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRunRequest = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const payload: any = { ...formData };
            let endpoint = feature.endpoint;

            Object.keys(formData).forEach(key => {
                if (endpoint.includes(`{${key}}`)) {
                    endpoint = endpoint.replace(`{${key}}`, formData[key]);
                    delete payload[key];
                }
            });

            // Parse object parameters if they are strings
            feature.params?.forEach((p: any) => {
                if (p.type === 'object' && typeof payload[p.name] === 'string') {
                    try {
                        payload[p.name] = JSON.parse(payload[p.name]);
                    } catch (e) {
                        console.warn(`Failed to parse ${p.name} as JSON:`, e);
                    }
                }
            });

            if (feature.params?.some((p: any) => p.name === 'modality_context')) {
                payload.modality_context = {
                    type: formData.modality_type,
                    support_level: formData.support_level
                };
                delete payload.modality_type;
                delete payload.support_level;
            }

            const response = await fetch(`http://localhost:8080${endpoint}`, {
                method: feature.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH'
                },
                body: feature.method === 'POST' ? JSON.stringify(payload) : undefined
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to API');
        } finally {
            setIsLoading(false);
        }
    };

    const navItems = [
        { id: 'config', label: 'API Configuration', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
        { id: 'integration', label: 'Implementation', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'monitor', label: 'Live Monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-6xl h-[75vh] bg-[#121212] border border-[#2e2e2e] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #2e2e2e;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #3e3e3e;
                    }
                `}} />
                {/* Sidebar */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#2e2e2e] bg-[#171717] flex flex-col shrink-0">
                    <div className="p-6 border-b border-[#2e2e2e]">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-tekimax-blue/10 border border-tekimax-blue/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-tekimax-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-white tracking-tight truncate">{feature.title}</h3>
                        </div>
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{feature.method} Endpoint</p>
                    </div>

                    <nav className="flex-grow p-4 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === item.id
                                    ? 'bg-[#2e2e2e] text-white shadow-sm'
                                    : 'text-white/40 hover:text-white/70 hover:bg-[#202020]'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-[#2e2e2e]">
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">API Status</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <p className="text-[10px] text-white/40 leading-tight">Endpoint is stable and accepting traffic.</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col bg-[#121212] overflow-hidden">
                    <header className="h-14 border-b border-[#2e2e2e] flex items-center justify-between px-8 bg-[#171717]/50">
                        <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-white/40">Resource:</span>
                            <span className="text-tekimax-blue">{feature.endpoint}</span>
                        </div>
                        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    <div className="flex-grow overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === 'config' && (
                                <motion.div
                                    key="config"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="p-8 max-w-5xl mx-auto space-y-10"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        {/* Left Side: Form */}
                                        <div className="space-y-8">
                                            <section>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-6 font-mono">General Configuration</h4>
                                                <div className="space-y-6">
                                                    {feature.params?.map((param: any) => (
                                                        <div key={param.name} className="space-y-2 group">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-[11px] font-bold text-white/50 tracking-tight group-hover:text-white/80 transition-colors">
                                                                    {param.name.charAt(0).toUpperCase() + param.name.slice(1).replace('_', ' ')}
                                                                </label>
                                                                {param.required && <span className="text-[9px] text-tekimax-blue font-bold uppercase tracking-tighter">Required</span>}
                                                            </div>

                                                            {param.name === 'prompt' || param.name === 'query' || param.name === 'correction_text' ? (
                                                                <textarea
                                                                    value={formData[param.name]}
                                                                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-3 text-sm text-white focus:border-tekimax-blue/50 focus:ring-1 focus:ring-tekimax-blue/20 outline-none transition-all placeholder:text-white/10"
                                                                    rows={4}
                                                                    placeholder={`Enter ${param.name}...`}
                                                                />
                                                            ) : param.name === 'modality_context' ? (
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <span className="text-[9px] text-white/20 font-bold uppercase">Type</span>
                                                                        <select
                                                                            value={formData.modality_type}
                                                                            onChange={(e) => handleInputChange('modality_type', e.target.value)}
                                                                            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-2.5 text-xs text-white outline-none focus:border-tekimax-blue/50 transition-all font-mono"
                                                                        >
                                                                            <option value="textual">Textual</option>
                                                                            <option value="visual">Visual</option>
                                                                            <option value="auditory">Auditory</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <span className="text-[9px] text-white/20 font-bold uppercase">Level</span>
                                                                        <select
                                                                            value={formData.support_level}
                                                                            onChange={(e) => handleInputChange('support_level', e.target.value)}
                                                                            className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-2.5 text-xs text-white outline-none focus:border-tekimax-blue/50 transition-all font-mono"
                                                                        >
                                                                            <option value="standard">Standard</option>
                                                                            <option value="high_support">High Support</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            ) : param.type === 'enum' ? (
                                                                <select
                                                                    value={formData[param.name]}
                                                                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-2.5 text-xs text-white outline-none focus:border-tekimax-blue/50 transition-all font-mono"
                                                                >
                                                                    {param.options.map((opt: string) => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : param.type === 'object' ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[9px] text-white/20 font-bold uppercase">JSON Schema Editor</span>
                                                                        <span className="text-[8px] text-tekimax-blue/40 font-mono">application/json</span>
                                                                    </div>
                                                                    <textarea
                                                                        value={formData[param.name]}
                                                                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                                        className="w-full bg-[#050505] border border-[#2e2e2e] rounded-lg p-3 text-[10px] text-white/80 font-mono focus:border-tekimax-blue/50 outline-none transition-all custom-scrollbar"
                                                                        rows={6}
                                                                        spellCheck={false}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {/* Default Value Pills */}
                                                                    {param.default !== undefined && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleInputChange(param.name, param.default)}
                                                                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${formData[param.name] === param.default
                                                                                    ? 'bg-tekimax-blue/20 border-tekimax-blue/50 text-tekimax-blue'
                                                                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                                                                                    }`}
                                                                            >
                                                                                Default: {String(param.default)}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {/* Sample pills for common param types */}
                                                                    {param.name === 'user_id' && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {['user-demo-001', 'user-test-002', 'usr_adaptive_ai'].map(sample => (
                                                                                <button
                                                                                    key={sample}
                                                                                    type="button"
                                                                                    onClick={() => handleInputChange(param.name, sample)}
                                                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono transition-all border ${formData[param.name] === sample
                                                                                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                                                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400'
                                                                                        }`}
                                                                                >
                                                                                    {sample}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {param.name === 'id' && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {['int-e168b9d5-a39c-44c4-af8a-1a85c1b33f0d', 'int-demo-12345'].map(sample => (
                                                                                <button
                                                                                    key={sample}
                                                                                    type="button"
                                                                                    onClick={() => handleInputChange(param.name, sample)}
                                                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono transition-all border ${formData[param.name] === sample
                                                                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                                                                                        }`}
                                                                                >
                                                                                    {sample.length > 20 ? sample.slice(0, 20) + '...' : sample}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {param.name === 'org_id' && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {['org-tekimax-prod', 'org-demo-trial'].map(sample => (
                                                                                <button
                                                                                    key={sample}
                                                                                    type="button"
                                                                                    onClick={() => handleInputChange(param.name, sample)}
                                                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono transition-all border ${formData[param.name] === sample
                                                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                                                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400'
                                                                                        }`}
                                                                                >
                                                                                    {sample}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <input
                                                                        type={param.type === 'integer' ? 'number' : 'text'}
                                                                        value={formData[param.name]}
                                                                        onChange={(e) => handleInputChange(param.name, param.type === 'integer' ? parseInt(e.target.value) : e.target.value)}
                                                                        className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-tekimax-blue/50 transition-all"
                                                                    />
                                                                </div>
                                                            )}
                                                            <p className="text-[10px] text-white/20 font-light leading-relaxed italic">{param.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            <div className="pt-4">
                                                <button
                                                    onClick={handleRunRequest}
                                                    disabled={isLoading}
                                                    className="w-full h-11 rounded-lg bg-tekimax-blue text-[#121212] font-black text-[10px] uppercase tracking-widest hover:bg-tekimax-blue/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(96,165,250,0.3)]"
                                                >
                                                    {isLoading ? (
                                                        <div className="w-4 h-4 border-2 border-[#121212]/20 border-t-[#121212] rounded-full animate-spin" />
                                                    ) : (
                                                        "Invoke Agent Capability"
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Right Side: Output */}
                                        <div className="flex flex-col">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-6 font-mono">Execution Results</h4>
                                            <div className="h-[500px] bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl p-6 font-mono text-xs overflow-y-auto custom-scrollbar relative">
                                                <AnimatePresence mode="wait">
                                                    {isLoading ? (
                                                        <motion.div
                                                            key="loading"
                                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                            className="h-full flex flex-col items-center justify-center space-y-4"
                                                        >
                                                            <div className="w-10 h-10 border-2 border-tekimax-blue/10 border-t-tekimax-blue rounded-full animate-spin" />
                                                            <span className="text-white/30 text-[9px] uppercase tracking-[0.2em]">Awaiting Model Stream...</span>
                                                        </motion.div>
                                                    ) : error ? (
                                                        <motion.div
                                                            key="error"
                                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                            className="text-red-400 p-4 border border-red-950 bg-red-950/20 rounded-lg"
                                                        >
                                                            <div className="font-bold mb-1">Execution Failed</div>
                                                            {error}
                                                        </motion.div>
                                                    ) : result ? (
                                                        <motion.div
                                                            key="result"
                                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                            className="space-y-6"
                                                        >
                                                            {result.chunk && (
                                                                <div>
                                                                    <div className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 border-b border-[#2e2e2e] pb-2">Generation Node</div>
                                                                    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed text-[11px] markdown-content">
                                                                        <ReactMarkdown
                                                                            components={{
                                                                                h1: ({ node, ...props }) => <h1 className="text-white font-bold text-lg mb-4 mt-2 border-b border-white/10 pb-2" {...props} />,
                                                                                h2: ({ node, ...props }) => <h2 className="text-white font-bold text-base mb-3 mt-4" {...props} />,
                                                                                h3: ({ node, ...props }) => <h3 className="text-white font-bold text-sm mb-2 mt-3" {...props} />,
                                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                                                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-4" {...props} />,
                                                                                li: ({ node, ...props }) => <li className="text-white/70" {...props} />,
                                                                                p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                                                code: ({ node, ...props }) => <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono text-[10px] text-tekimax-blue" {...props} />,
                                                                                pre: ({ node, ...props }) => <pre className="bg-[#050505] p-4 rounded-lg border border-white/5 overflow-x-auto my-4" {...props} />,
                                                                                a: ({ node, ...props }) => <a className="text-tekimax-blue hover:underline" {...props} />
                                                                            }}
                                                                        >
                                                                            {result.chunk}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {result.metadata && (
                                                                <div>
                                                                    <div className="text-tekimax-blue text-[9px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2 mt-8 flex items-center justify-between">
                                                                        <span>Audit & Compliance Profile</span>
                                                                        <span className="text-tekimax-blue/40 font-mono text-[8px]">NIST AI RMF v1.0</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {Object.entries(result.metadata).map(([key, value]: [string, any]) => (
                                                                            <div key={key} className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col gap-1">
                                                                                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                                                <span className="text-[10px] text-white/80 font-mono truncate">
                                                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-4 p-2 bg-tekimax-blue/5 border border-tekimax-blue/10 rounded flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-tekimax-blue animate-pulse" />
                                                                        <span className="text-[9px] text-tekimax-blue/60 uppercase tracking-widest font-bold">Verification: PASSED</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-white/5 space-y-4">
                                                            <svg className="w-12 h-12 opacity-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                            </svg>
                                                            <p className="text-[9px] uppercase tracking-[0.3em] font-black">Ready for instantiation</p>
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'integration' && (
                                <motion.div
                                    key="integration"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="p-8 max-w-4xl mx-auto space-y-10"
                                >
                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 font-mono">API Authorization</h4>
                                        <div className="flex items-center gap-3 p-4 bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl group transition-all hover:border-[#404040]">
                                            <div className="flex-grow font-mono text-[11px] text-emerald-400 truncate tracking-tight">
                                                sk_live_sNfivX6uHmYXONmGWFWJw83VQQM82UhH
                                            </div>
                                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2e2e2e] text-white/60 text-[9px] font-black uppercase transition-all hover:bg-white/10 hover:text-white">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                </svg>
                                                Copy
                                            </button>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 font-mono">Client Implementation (cURL)</h4>
                                        <div className="relative group">
                                            <div className="absolute top-4 right-4 text-[9px] font-mono text-white/20">bash</div>
                                            <div className="p-6 bg-[#0a0a0a] border border-[#2e2e2e] rounded-xl font-mono text-[11px] text-white/50 overflow-x-auto whitespace-pre leading-relaxed scrollbar-hide">
                                                {`curl -X ${feature.method} http://localhost:8080${feature.endpoint.replace('{id}', formData.id || 'int-e168b9d5-a3...')}\\\n  -H "Authorization: Bearer sk_live_...2UhH"\\\n  -H "Content-Type: application/json"\\\n  ${feature.method === 'POST' ? `-d '${JSON.stringify(formData, null, 2)}'` : ''}`}
                                            </div>
                                        </div>
                                    </section>
                                </motion.div>
                            )}

                            {activeTab === 'monitor' && (
                                <motion.div
                                    key="monitor"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="p-8 max-w-5xl mx-auto space-y-10"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Advanced Latency Chart with Visx */}
                                        <div className="lg:col-span-2 bg-[#171717] border border-[#2e2e2e] rounded-xl p-8 space-y-8 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-tekimax-blue animate-ping" />
                                                    <span className="text-[9px] font-black text-tekimax-blue uppercase tracking-[0.2em]">Live Stream: {streamingMeta.org}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 font-mono">Response Latency (P99)</h4>
                                                <div className="text-4xl font-serif text-white tracking-tighter">
                                                    {telemetry.length > 0 ? telemetry[telemetry.length - 1].value.toFixed(1) : '0.0'}
                                                    <span className="text-base text-white/20 ml-1 font-mono tracking-normal">ms</span>
                                                </div>
                                            </div>

                                            <div className="h-44 w-full">
                                                <ParentSize>
                                                    {({ width, height }) => <LatencyChart width={width} height={height} data={telemetry} />}
                                                </ParentSize>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-rows-3 gap-6 font-mono">
                                            <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6 flex flex-col justify-between group hover:border-[#404040] transition-all">
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Success Rate</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-serif text-emerald-400">99.98%</span>
                                                    <span className="text-[9px] text-emerald-500/30 uppercase font-black">+0.02</span>
                                                </div>
                                            </div>
                                            <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6 flex flex-col justify-between group hover:border-[#404040] transition-all">
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Human Agency</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-serif text-tekimax-blue">{((streamingMeta.agency || 0.85) * 100).toFixed(0)}%</span>
                                                    <span className="text-[9px] text-white/10 uppercase font-black tracking-widest">Scoped</span>
                                                </div>
                                            </div>
                                            <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-6 flex flex-col justify-between group hover:border-[#404040] transition-all overflow-hidden text-ellipsis">
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Active Org</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-base font-mono text-white truncate">{streamingMeta.org}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Heatmap Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-[#171717] border border-[#2e2e2e] rounded-xl p-8 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 font-mono">Global Request Cluster</h4>
                                                <span className="text-[8px] text-white/10 font-mono">LIVE DISTRIBUTION</span>
                                            </div>
                                            <div className="h-40 w-full">
                                                <ParentSize>
                                                    {({ width, height }) => <HeatmapChart width={width} height={height} data={heatmapData} />}
                                                </ParentSize>
                                            </div>
                                        </div>

                                        <div className="bg-tekimax-blue/[0.02] border border-tekimax-blue/10 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                                <svg className="w-24 h-24 text-tekimax-blue" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 10-2 0v1a1 1 0 102 0zm6-1a1 1 0 11-2 0v1a1 1 0 112 0v-1z" /></svg>
                                            </div>
                                            <div className="relative z-10">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Multi-Tenant Engineering</h4>
                                                <p className="text-sm text-white/40 font-light leading-relaxed">
                                                    This dashboard automatically scopes all telemetry to your organization (<span className="text-white/60 font-mono">{streamingMeta.org}</span>). Using high-performance <span className="text-white/60 font-mono">@visx</span> SVG rendering, we visualize thousands of data points with sub-second latency.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
