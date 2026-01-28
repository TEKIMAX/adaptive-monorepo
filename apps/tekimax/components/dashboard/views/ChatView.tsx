import React, { useState } from 'react';
import { Icons } from '../icons';
import { CONTENT_FEATURES } from '../data';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export const ChatView: React.FC = () => {
    return (
        <div className="h-full flex relative animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#0b0f1a] overflow-hidden rounded-xl border border-white/5">

            {/* Main Content Area - Flex Grow */}
            <div className="flex-grow flex flex-col relative min-w-0">

                {/* Improved Header */}
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                            <Icons.Audit />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-white tracking-wide">AI Reference</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] font-mono text-white/40">API Spec v1.0.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Documentation Hub</span>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-grow relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 bg-[#0b0f1a] p-0 flex flex-col overflow-hidden">
                        <div className="flex-grow overflow-auto custom-scalar-docs">
                            <ApiReferenceReact
                                configuration={{
                                    spec: {
                                        url: '/openapi.yaml',
                                    },
                                    theme: 'default',
                                    hideClientButton: false,
                                    showSidebar: true,
                                    showDeveloperTools: 'localhost',
                                    showToolbar: 'localhost',
                                    operationTitleSource: 'summary',
                                    persistAuth: false,
                                    telemetry: true,
                                    layout: 'modern',
                                    isEditable: false,
                                    isLoading: false,
                                    hideModels: false,
                                    documentDownloadType: 'none',
                                    hideTestRequestButton: false,
                                    hideSearch: false,
                                    showOperationId: false,
                                    hideDarkModeToggle: true,
                                    withDefaultFonts: true,
                                    defaultOpenAllTags: false,
                                    expandAllModelSections: false,
                                    expandAllResponses: false,
                                    orderSchemaPropertiesBy: 'alpha',
                                    orderRequiredPropertiesFirst: true,
                                    _integration: 'react',
                                    hideDownloadButton: true,
                                    default: false,
                                    slug: 'api-1',
                                    title: 'API #1',
                                } as any}
                            />
                        </div>
                        <style>{`
                            .custom-scalar-docs {
                                --scalar-background-1: #0b0f1a;
                                --scalar-background-2: #121212;
                                --scalar-background-3: #1c1c1c;
                                --scalar-color-1: #ffffff;
                                --scalar-color-2: rgba(255, 255, 255, 0.6);
                                --scalar-color-3: rgba(255, 255, 255, 0.4);
                                --scalar-color-accent: #3b82f6;
                                --scalar-border-color: rgba(255, 255, 255, 0.05);
                                --scalar-font: inherit;
                            }
                            .custom-scalar-docs [class*="scalar-card"] {
                                background: #121212 !important;
                                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                            }
                            .custom-scalar-docs .scalar-sidebar {
                                border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
                                background: #0b111d !important;
                            }
                            .custom-scalar-docs .section-header {
                                background: transparent !important;
                            }
                            .custom-scalar-docs .scalar-api-reference {
                                padding: 0 !important;
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        </div>
    );
};
