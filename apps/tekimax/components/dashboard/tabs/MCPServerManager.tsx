import React, { useState } from 'react';
import { Server, Plus, Trash2, RefreshCw, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

interface MCPServer {
    id: string;
    name: string;
    type: 'stdio' | 'sse';
    command?: string;
    url?: string;
    status: 'connected' | 'error' | 'connecting';
    toolsCount: number;
    lastSeen: string;
}

export const MCPServerManager: React.FC = () => {
    const [servers, setServers] = useState<MCPServer[]>([
        { id: '1', name: 'Google Search MCP', type: 'stdio', command: 'npx @modelcontextprotocol/google-search', status: 'connected', toolsCount: 12, lastSeen: '2m ago' },
        { id: '2', name: 'GitHub Integration', type: 'stdio', command: 'npx @modelcontextprotocol/github', status: 'connected', toolsCount: 24, lastSeen: '5m ago' },
        { id: '3', name: 'Local SQLite', type: 'stdio', command: 'npx @modelcontextprotocol/sqlite data.db', status: 'error', toolsCount: 0, lastSeen: '1h ago' },
        { id: '4', name: 'Memory Service', type: 'stdio', command: 'node servers/memory.js', status: 'connected', toolsCount: 6, lastSeen: 'Now' },
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newServer, setNewServer] = useState({ name: '', command: '' });

    const handleAddServer = (e: React.FormEvent) => {
        e.preventDefault();
        const server: MCPServer = {
            id: Math.random().toString(36).substr(2, 9),
            name: newServer.name,
            type: 'stdio',
            command: newServer.command,
            status: 'connecting',
            toolsCount: 0,
            lastSeen: 'Just now'
        };
        setServers([...servers, server]);
        setNewServer({ name: '', command: '' });
        setIsAdding(false);

        // Simulate connection
        setTimeout(() => {
            setServers(current => current.map(s => s.id === server.id ? { ...s, status: 'connected', toolsCount: Math.floor(Math.random() * 10) + 1 } : s));
        }, 1500);
    };

    const removeServer = (id: string) => {
        setServers(servers.filter(s => s.id !== id));
    };

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-tekimax-blue/10 border border-tekimax-blue/20">
                        <Server className="w-4 h-4 text-tekimax-blue" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Connected MCP Servers</h4>
                        <p className="text-[10px] text-white/40 font-mono">Registry synchronized with local environment</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-tekimax-blue hover:bg-tekimax-blue/80 text-white rounded text-xs font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                >
                    <Plus className="w-3 h-3" />
                    Add Server
                </button>
            </div>

            {/* Add Server Form */}
            {isAdding && (
                <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <form onSubmit={handleAddServer} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Server Name</label>
                                <input
                                    value={newServer.name}
                                    onChange={e => setNewServer({ ...newServer, name: e.target.value })}
                                    placeholder="e.g. Postgres Utils"
                                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-tekimax-blue/50 outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Transport Command (stdio)</label>
                                <input
                                    value={newServer.command}
                                    onChange={e => setNewServer({ ...newServer, command: e.target.value })}
                                    placeholder="e.g. npx @mcp/postgres-server"
                                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-tekimax-blue/50 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-sm"
                            >
                                Connect Server
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Servers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servers.map((server) => (
                    <div key={server.id} className="group bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all relative overflow-hidden">
                        {/* Status Light */}
                        <div className={`absolute top-0 right-0 w-1 h-full ${server.status === 'connected' ? 'bg-emerald-500/40' :
                                server.status === 'error' ? 'bg-red-500/40' : 'bg-amber-500/40'
                            }`} />

                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${server.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                                        server.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    <Terminal className="w-4 h-4" />
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-white group-hover:text-tekimax-blue transition-colors">{server.name}</h5>
                                    <span className="text-[10px] text-white/30 font-mono">TYPE: {server.type.toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors">
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeServer(server.id)} className="p-1.5 hover:bg-red-500/10 rounded text-white/40 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                <code className="text-[10px] font-mono text-white/60 block truncate">{server.command || server.url}</code>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">Tools Capacity</span>
                                        <span className="text-xs font-mono text-white/80">{server.toolsCount} units</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">Last Active</span>
                                        <span className="text-xs font-mono text-white/80">{server.lastSeen}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${server.status === 'connected' ? 'bg-emerald-500 animate-pulse' :
                                            server.status === 'error' ? 'bg-red-500' : 'bg-amber-500'
                                        }`} />
                                    <span className={`text-[10px] font-bold uppercase ${server.status === 'connected' ? 'text-emerald-400' :
                                            server.status === 'error' ? 'text-red-400' : 'text-amber-400'
                                        }`}>{server.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Info */}
            <div className="pt-6 border-t border-white/5">
                <div className="bg-tekimax-blue/5 border border-tekimax-blue/10 rounded-lg p-4 flex items-start gap-4">
                    <div className="p-2 rounded bg-tekimax-blue/10">
                        <ShieldCheck className="w-5 h-5 text-tekimax-blue" />
                    </div>
                    <div>
                        <h6 className="text-xs font-bold text-white mb-1">Secure by Design: Tool Provenance</h6>
                        <p className="text-[10px] text-white/40 leading-relaxed">
                            Every tool invocation via MCP is cryptographically signed and logged to the global provenance chain.
                            Unauthorized server commands are automatically intercepted by the platform orchestrator.
                        </p>
                    </div>
                    <button className="ml-auto text-[10px] text-tekimax-blue font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                        Security Specs <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};
