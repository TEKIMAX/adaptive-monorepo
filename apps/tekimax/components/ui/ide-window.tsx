import React, { useState, ReactNode } from 'react';

export interface IDETab {
    id: string;
    title: string;
    icon?: ReactNode;
}

export interface IDEWindowProps {
    /** Title displayed in the macOS-style title bar */
    windowTitle?: string;
    /** Label for the sidebar section */
    sidebarLabel?: string;
    /** Tabs/features to display in sidebar and tab bar */
    tabs: IDETab[];
    /** Currently active tab ID */
    activeTabId?: string;
    /** Callback when tab changes */
    onTabChange?: (tabId: string) => void;
    /** Function to render content for the active tab */
    renderContent: (activeTabId: string) => ReactNode;
    /** Minimum height of the window */
    minHeight?: string;
    /** Whether to show the tab bar at the top of the content area */
    showTabBar?: boolean;
    /** Additional className for the container */
    className?: string;
}

export const IDEWindow: React.FC<IDEWindowProps> = ({
    windowTitle = "tekimax - explorer",
    sidebarLabel = "Features",
    tabs,
    activeTabId: controlledActiveTabId,
    onTabChange,
    renderContent,
    minHeight = "700px",
    showTabBar = true,
    className = "",
}) => {
    const [internalActiveId, setInternalActiveId] = useState(tabs[0]?.id || "");

    // Support both controlled and uncontrolled modes
    const activeId = controlledActiveTabId !== undefined ? controlledActiveTabId : internalActiveId;

    const handleTabChange = (tabId: string) => {
        if (onTabChange) {
            onTabChange(tabId);
        } else {
            setInternalActiveId(tabId);
        }
    };

    return (
        <div className={`relative group ${className}`}>
            {/* Background glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-tekimax-blue/10 to-purple-500/10 rounded-2xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000" />

            <div className={`relative bg-[#0b0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col`} style={{ minHeight }}>

                {/* macOS Title Bar */}
                <div className="h-12 bg-white/[0.03] border-b border-white/5 flex items-center px-6 gap-8">
                    <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <div className="flex-grow flex justify-center">
                        <div className="px-4 py-0.5 bg-black/20 rounded border border-white/5 text-[9px] text-white/30 font-mono tracking-wider uppercase">
                            {windowTitle}
                        </div>
                    </div>
                </div>

                <div className="flex-grow flex flex-col md:flex-row">
                    {/* IDE Sidebar */}
                    <div className="w-full md:w-64 border-r border-white/5 flex flex-col bg-white/[0.01]">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{sidebarLabel}</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${activeId === tab.id
                                        ? 'bg-white/5 text-white'
                                        : 'text-white/20 hover:bg-white/[0.02] hover:text-white/50'
                                        }`}
                                >
                                    {tab.icon && (
                                        <span className={`transition-opacity ${activeId === tab.id ? 'text-tekimax-blue opacity-100' : 'opacity-40'}`}>
                                            {tab.icon}
                                        </span>
                                    )}
                                    <span className="text-[11px] font-mono tracking-tight">{tab.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Code Editor Pane */}
                    <div className="flex-grow flex flex-col relative bg-[#121621]/20">
                        {/* Editor Tabs */}
                        {showTabBar && (
                            <div className="flex h-11 bg-black/40 px-0.5 pt-0.5 gap-0.5 border-b border-white/5 overflow-x-auto">
                                {tabs.map((tab, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`px-6 h-full flex items-center gap-3 font-mono text-[10px] border-r border-white/5 transition-all cursor-pointer relative whitespace-nowrap ${activeId === tab.id
                                            ? 'bg-[#0b0f1a] text-white border-t-2 border-t-tekimax-blue'
                                            : 'bg-black/20 text-white/20 hover:text-white/40 hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {tab.icon && <span className="opacity-40 scale-75">{tab.icon}</span>}
                                        <span>{tab.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Main Content View */}
                        <div className="flex-grow p-6 md:p-12 overflow-y-auto">
                            {renderContent(activeId)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
