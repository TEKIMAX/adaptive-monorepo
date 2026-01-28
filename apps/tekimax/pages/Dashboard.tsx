import React, { useState } from 'react';
import { ExplorerView } from '../components/dashboard/views/ExplorerView';
import { ChatView } from '../components/dashboard/views/ChatView';
import { AuditView } from '../components/dashboard/views/AuditView';
import { CAIOView } from '../components/dashboard/views/CAIOView';
import { ReportsView } from '../components/dashboard/views/ReportsView';
import { WelcomeView } from '../components/dashboard/landing/WelcomeView';
import { Icons } from '../components/dashboard/icons';

// --- Types ---
type ViewType = 'explorer' | 'chat' | 'audit' | 'reports' | 'caio';
type UserRole = 'ciao' | 'developer' | null;

interface NavItem {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[]; // Added roles
}

const ALL_NAV_ITEMS: NavItem[] = [
    { id: 'explorer', label: 'Integration Hub', icon: <Icons.Explorer />, roles: ['developer', 'ciao'] },
    { id: 'chat', label: 'AI Reference', icon: <Icons.Audit />, roles: ['developer'] },
    { id: 'caio', label: 'CAIO Oversight', icon: <Icons.Explorer />, roles: ['ciao'] },
    { id: 'audit', label: 'Audit Logs', icon: <Icons.Audit />, roles: ['ciao'] },
    { id: 'reports', label: 'Attribution', icon: <Icons.Reports />, roles: ['ciao'] },
];

export default function Dashboard() {
    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const [activeView, setActiveView] = useState<ViewType>('explorer');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Filter items based on role
    const navItems = ALL_NAV_ITEMS.filter(item =>
        selectedRole && item.roles.includes(selectedRole as any)
    );

    // Reset view when role changes ensure we landed on a valid view
    const handleRoleSelect = (role: 'ciao' | 'developer') => {
        setSelectedRole(role);
        // Default views per role
        if (role === 'developer') setActiveView('chat');
        if (role === 'ciao') setActiveView('caio'); // CAIOs go to Overlay
    };

    // If no role selected, show Welcome View
    if (!selectedRole) {
        return (
            <div className="h-screen w-full bg-[#121212] flex items-center justify-center overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]">
                <WelcomeView onSelectRole={handleRoleSelect} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] text-gray-200 font-sans selection:bg-emerald-500/30 overflow-hidden flex bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px]">

            {/* Sidebar Navigation */}
            <aside
                className={`relative z-20 h-screen bg-[#121212] border-r border-white/5 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16'
                    }`}
            >
                {/* Logo Area */}
                <div className="h-14 flex items-center px-4 border-b border-white/5 shrink-0">
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        <div className="w-6 h-6 bg-[#ededed] rounded flex items-center justify-center">
                            <span className="text-[#121212] font-bold text-sm">T</span>
                        </div>
                        <span className="text-sm font-bold text-[#ededed] tracking-wide">TEKIMAX</span>
                    </div>
                    {!isSidebarOpen && (
                        <div className="w-6 h-6 bg-[#ededed] rounded flex items-center justify-center mx-auto">
                            <span className="text-[#121212] font-bold text-sm">T</span>
                        </div>
                    )}
                </div>

                {/* Role Switcher Indicator */}
                {isSidebarOpen && (
                    <div className="px-3 pt-3">
                        <button
                            onClick={() => setSelectedRole(null)}
                            className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-md p-2 flex items-center gap-3 transition-colors group"
                        >
                            <div className={`w-6 h-6 rounded flex items-center justify-center border text-white ${selectedRole === 'ciao' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                                {selectedRole === 'ciao' ? (
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ) : (
                                    <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                )}
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Project</div>
                                <div className="text-xs text-[#ededed] font-medium truncate group-hover:text-white transition-colors">
                                    {selectedRole === 'ciao' ? 'Engineering' : 'Platform'}
                                </div>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                        </button>
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-grow py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative ${activeView === item.id
                                ? 'bg-white/10 text-white'
                                : 'text-white/40 hover:bg-white/[0.02] hover:text-white'
                                }`}
                        >
                            <div className={`relative z-10 ${activeView === item.id ? 'text-white' : 'group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-12'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Toggle / User Profile */}
                <div className="p-4 border-t border-white/5 shrink-0">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-colors mb-4"
                    >
                        {isSidebarOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
                    </button>

                    <div className={`flex items-center gap-3 px-2 transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px]">
                            <div className="w-full h-full rounded-full bg-[#080c14] overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                            </div>
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <div className="text-xs font-bold text-white">Alex Chen</div>
                                <div className="text-[10px] text-white/40">Lead Architect</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow h-screen relative flex flex-col overflow-hidden bg-[#121212]">
                {/* Top Header - Contextual */}
                <header className="h-14 border-b border-white/5 bg-[#121212] flex items-center justify-between px-6 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-white/40 text-sm font-mono">/</span>
                            <h1 className="text-sm font-medium text-white tracking-wide">
                                {ALL_NAV_ITEMS.find(n => n.id === activeView)?.label}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-[#000] border border-white/10 rounded text-xs text-white focus:outline-none focus:border-white/20 w-64 py-1.5 pl-8 pr-4 transition-all"
                            />
                            <div className="absolute left-2.5 top-2 text-white/40">
                                <Icons.Search />
                            </div>
                        </div>
                        <button className="text-white/40 hover:text-white transition-colors">
                            <Icons.Reports /> {/* Using Reports icon as help/settings placeholder if needed, or just bell */}
                        </button>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-grow overflow-hidden relative w-full">
                    <div className="h-full w-full max-w-[1000px] mx-auto p-4 lg:p-6 relative">
                        {activeView === 'explorer' && <ExplorerView />}
                        {activeView === 'chat' && <ChatView />}
                        {activeView === 'audit' && <AuditView />}
                        {activeView === 'caio' && <CAIOView />}
                        {activeView === 'reports' && <ReportsView />}
                    </div>
                </div>
            </main>

        </div>
    );
}
