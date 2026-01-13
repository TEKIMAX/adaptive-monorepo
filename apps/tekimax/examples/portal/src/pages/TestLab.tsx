import { useAuth } from '@workos-inc/authkit-react';
import { useState, useEffect } from 'react';
import { Redirect } from 'wouter';
import {
    Terminal,
    MessageSquare,
    Network,
    Search,
    ShieldCheck,
    Play,
    Activity,
    Lock,
    Cpu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// --- Main Component ---
export default function TestLab() {
    const { user, isLoading: authLoading } = useAuth();
    const [apiKey, setApiKey] = useState(localStorage.getItem('tekimax_test_key') || '');
    const [activeTab, setActiveTab] = useState<'chat' | 'router' | 'research'>('router');

    useEffect(() => {
        localStorage.setItem('tekimax_test_key', apiKey);
    }, [apiKey]);

    if (authLoading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading Console...</div>;
    if (!user) return <Redirect to="/" />;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Sovereign Test Lab</h1>
                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full border border-indigo-100 font-medium">v1.0.0</span>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <Lock className="w-4 h-4 text-slate-400 ml-2" />
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste Master Key (sk_...)"
                            className="bg-transparent border-none text-sm w-48 focus:ring-0 placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Tabs */}
                <div className="flex space-x-1 rounded-xl bg-slate-200/50 p-1 mb-8 max-w-lg mx-auto">
                    <TabButton
                        active={activeTab === 'router'}
                        onClick={() => setActiveTab('router')}
                        icon={<Network className="w-4 h-4" />}
                        label="Sovereign Router"
                    />
                    <TabButton
                        active={activeTab === 'chat'}
                        onClick={() => setActiveTab('chat')}
                        icon={<MessageSquare className="w-4 h-4" />}
                        label="Streaming Chat"
                    />
                    <TabButton
                        active={activeTab === 'research'}
                        onClick={() => setActiveTab('research')}
                        icon={<Search className="w-4 h-4" />}
                        label="Deep Research"
                    />
                </div>

                {/* Content Area */}
                <div className="relative">
                    {activeTab === 'router' && <RouterPanel apiKey={apiKey} />}
                    {activeTab === 'chat' && <ChatPanel key={apiKey} apiKey={apiKey} />}
                    {activeTab === 'research' && <ResearchPanel apiKey={apiKey} />}
                </div>

            </main>
        </div>
    );
}

// --- Components ---

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2 transition-all duration-200",
                active
                    ? "bg-white text-indigo-700 shadow"
                    : "text-slate-600 hover:bg-white/[0.12] hover:text-slate-800"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

function StatusBadge({ status, time }: { status?: string, time?: number }) {
    if (!status) return null;
    const isError = status.includes('Unexpected') || status.includes('error');
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border",
            isError ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
        )}>
            {isError ? <Activity className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            <span>{status}</span>
            {time && <span className="opacity-75">| {time}ms</span>}
        </div>
    );
}

// --- Panels ---

function RouterPanel({ apiKey }: { apiKey: string }) {
    const [intent, setIntent] = useState("Search for quantum physics papers");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [metrics, setMetrics] = useState({ latency: 0, backend: '' });

    const runTest = async () => {
        if (!apiKey) return alert("API Key Required");
        setLoading(true);
        const start = performance.now();

        try {
            const res = await fetch(`${API_URL}/v1/router/classify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ intent })
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                setResult(data);
                setMetrics({
                    latency: Math.round(performance.now() - start),
                    backend: data.backend || 'unknown'
                });
            } catch {
                setResult({ error: "Parse Error", raw: text, status: res.status });
            }
        } catch (e: any) {
            setResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Intent Classification</h2>
                <p className="text-slate-500 text-sm mb-6">Test the high-performance Triton routing layer.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">User Intent</label>
                        <textarea
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
                        />
                    </div>
                    <button
                        onClick={runTest}
                        disabled={loading || !apiKey}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Execute Route
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-sm relative overflow-hidden">
                <div className="absolute top-4 right-4">
                    <StatusBadge status={result ? (result.error ? 'Error' : 'Success') : undefined} time={metrics.latency} />
                </div>
                <div className="mb-4 text-xs tracking-wider text-slate-500 uppercase flex items-center gap-2">
                    <Cpu className="w-3 h-3" />
                    System Output
                </div>
                <pre className="overflow-auto max-h-[400px]">
                    {result ? JSON.stringify(result, null, 2) : <span className="text-slate-600">// Waiting for input...</span>}
                </pre>
            </div>
        </div>
    );
}

import { streamChat, type Message } from '../lib/api';

function ChatPanel({ apiKey }: { apiKey: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !apiKey) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        const currentMessages = [...messages, userMsg];
        setInput('');
        setIsLoading(true);

        // Create a placeholder for the assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        let localAccumulated = '';

        await streamChat(apiKey, currentMessages, {
            onDelta: (delta) => {
                localAccumulated += delta;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = localAccumulated;
                    }
                    return newMessages;
                });
            },
            onFinish: () => {
                setIsLoading(false);
            },
            onError: (err) => {
                console.error('Chat Error:', err);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700">Live Session</span>
                </div>
                {isLoading && <span className="text-xs text-indigo-600 animate-pulse font-medium">Generating...</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                        <p>Start a conversation to test streaming.</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                            m.role === 'user'
                                ? "bg-indigo-600 text-white rounded-br-sm"
                                : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        )}>
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={onSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-50 border-none rounded-full px-4 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button type="submit" disabled={isLoading || !apiKey} className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    <Play className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}

function ResearchPanel({ apiKey }: { apiKey: string }) {
    const [topic, setTopic] = useState("Techniques for Quantum Error Correction");
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const doResearch = async () => {
        if (!apiKey) return alert("API Key Required");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/v1/research/deep`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: topic,
                    response_schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            summary: { type: "string" },
                            findings: { type: "array", items: { type: "string" } }
                        }
                    }
                })
            });
            const text = await res.text();
            try { setReport(JSON.parse(text)); } catch { setReport({ error: "Parse Error", raw: text }); }
        } catch (e: any) {
            setReport({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
            {/* Input Side */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <Search className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Deep Research Agent</h2>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full flex-1 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Enter a complex research topic..."
                    />
                    <button
                        onClick={doResearch}
                        disabled={loading || !apiKey}
                        className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Activity className="w-4 h-4 animate-spin" /> : "Initiate Research"}
                    </button>
                </div>
            </div>

            {/* Output Side */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Research Findings
                </div>
                <div className="flex-1 overflow-auto p-6">
                    {report ? (
                        <div className="prose prose-sm max-w-none">
                            {report.title && <h3 className="text-xl font-bold text-slate-900 mb-2">{report.title}</h3>}
                            {report.summary && <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">{report.summary}</p>}
                            {report.findings && (
                                <ul className="space-y-2">
                                    {report.findings.map((f: string, i: number) => (
                                        <li key={i} className="flex gap-2 items-start text-slate-700">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* Fallback for raw/error */}
                            {!report.title && <pre className="text-xs bg-slate-900 text-slate-50 p-4 rounded-lg overflow-auto">{JSON.stringify(report, null, 2)}</pre>}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <Search className="w-16 h-16 mb-4 opacity-10" />
                            <p>Results will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
