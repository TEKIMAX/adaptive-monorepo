import React, { useState } from 'react';
import { FeatureVisual } from '../../ui/feature-visuals';
import { FeatureDetailDialog } from '../shared/FeatureDetailDialog';
import { TechCard } from '../shared/TechCard';
import { CONTENT_FEATURES, TABS } from '../data';
import { ModalityErrorLog } from '../tabs/ModalityErrorLog';

export const ExplorerView: React.FC = () => {
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('adaptive_content');

    const activeFeature = CONTENT_FEATURES[activeTab as keyof typeof CONTENT_FEATURES];

    const FeatureVisualComponent = {
        'adaptive_content': <FeatureVisual type="adaptive_engine" />,
        'modality_profile': <ModalityErrorLog />,
        'contestability': <FeatureVisual type="compliance_matrix" />,
        'provenance': <FeatureVisual type="human_agency" />,
        'orchestrator': <FeatureVisual type="orchestrator" />,
        'user_profile': <FeatureVisual type="adaptive_engine" />,
        'organization': <FeatureVisual type="compliance_matrix" />,
    }[activeTab];


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 h-full flex flex-col">
            <FeatureDetailDialog
                isOpen={!!selectedFeature}
                onClose={() => setSelectedFeature(null)}
                feature={selectedFeature}
            />

            {/* Header Area */}
            <div className="flex items-center justify-between shrink-0 mb-4">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Integration Hub</h2>
                    <p className="text-sm text-white/40">Configure and monitor Adaptive Architecture endpoints.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded text-xs font-mono shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar mb-6">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-white text-white'
                            : 'border-transparent text-white/40 hover:text-white/70'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Content Area */}
            <div className="flex-grow relative overflow-y-auto">
                <div className="absolute inset-0 pb-20">
                    {/* Visual & Description */}
                    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeTab}>
                        <div className="space-y-8">
                            <div className="text-center">
                                <h3 className="text-lg text-white font-medium mb-3">{activeFeature.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto">{activeFeature.desc}</p>
                            </div>

                            <TechCard
                                content={activeFeature}
                                onClick={() => setSelectedFeature(activeFeature)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
