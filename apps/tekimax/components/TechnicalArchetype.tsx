import React, { useState } from 'react';
import { IDEWindow, IDETab } from './ui/ide-window';
import {
    FeatureVisual,
    AdaptiveEngineVisual,
    ComplianceMatrixVisual,
    OrchestratorVisual,
    HumanAgencyVisual
} from './ui/feature-visuals';

// Tab configuration with icons
const ARCH_FEATURES: IDETab[] = [
    {
        id: "responsible_ai",
        title: "Responsible AI",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    },
    {
        id: "manage_dashboard",
        title: "Manage Dashboard",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
        )
    },
    {
        id: "api_config",
        title: "Your API",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        )
    }
];

// Content descriptions for each feature
const FEATURE_CONTENT: Record<string, { title: string; desc: string }> = {
    "manage_dashboard": {
        title: "Unified Governance & Operational Control",
        desc: "A central command center for real-time monitoring of AI orchestration, human agency scores, and global compliance health. Manage your adaptive ecosystem with granular oversight and actionable insights."
    },
    "api_config": {
        title: "Seamless Integration & Extensibility",
        desc: "Your dedicated interface for API key management, endpoint configuration, and SDK deployment. Built for developers who demand high-performance scalability and enterprise-grade reliability."
    },
    "responsible_ai": {
        title: "Verifiable Ethical Framework Alignment",
        desc: "Automatically align every AI interaction with global standards like NIST AI RMF. Our configuration engine ensures that your AI remains transparent, auditable, and inherently responsible."
    }
};

export const TechnicalArchetype: React.FC = () => {
    const [activeId, setActiveId] = useState(ARCH_FEATURES[0].id);

    const renderContent = (tabId: string) => {
        const content = FEATURE_CONTENT[tabId] || { title: "Loading...", desc: "Synchronizing architectural nodes..." };

        // Map tab IDs to visual types
        const visualTypeMap: Record<string, any> = {
            "manage_dashboard": "orchestrator",
            "api_config": "adaptive_engine",
            "responsible_ai": "compliance_matrix"
        };

        const visualType = visualTypeMap[tabId] || tabId;

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <FeatureVisual type={visualType as any} />
                <div className="max-w-4xl px-2">
                    <h3 className="text-3xl text-white font-serif mb-6 leading-tight">{content.title}</h3>
                    <p className="text-white/40 text-lg font-light leading-relaxed">
                        {content.desc}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="hidden md:block mt-32 w-full max-w-7xl mx-auto px-6 reveal-on-scroll">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif text-white mb-2">Managed AI Architecture</h2>
                    <p className="text-white/40 text-sm font-light">Select the menu to see detailed description</p>
                </div>

                {/* Interactive Status Badge & Stats */}
                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-full bg-white border border-white/20 flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] group cursor-default">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b0f1a]">Interactive</span>
                    </div>
                </div>
            </div>

            <IDEWindow
                windowTitle="tekimax - architecture explorer"
                sidebarLabel="Core Features"
                tabs={ARCH_FEATURES}
                activeTabId={activeId}
                onTabChange={setActiveId}
                renderContent={renderContent}
                minHeight="700px"
                showTabBar={true}
                className="hidden md:block"
            />
        </div>
    );
};

// Re-export useful components for external use
export { IDEWindow } from './ui/ide-window';
export type { IDETab } from './ui/ide-window';
export {
    FeatureVisual,
    AdaptiveEngineVisual,
    ComplianceMatrixVisual,
    OrchestratorVisual,
    HumanAgencyVisual
} from './ui/feature-visuals';
