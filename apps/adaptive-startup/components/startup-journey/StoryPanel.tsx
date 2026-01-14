import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import React, { useState } from 'react';
import { Wand2, ChevronLeft, ChevronRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { MiniStoryEditor } from './MiniStoryEditor';
import { StartupData } from '../../types';

interface StoryPanelProps {
    data: StartupData;
    updateProject: any;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const StoryPanel: React.FC<StoryPanelProps> = ({ data, updateProject, isCollapsed, onToggleCollapse }) => {
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const generateStory = useAction(api.ai.generateStartupJourneyStory);

    const handleGenerateStory = async () => {
        setIsGeneratingStory(true);
        try {
            const story = await generateStory({ startupData: data });
            await updateProject({
                id: data.id as any,
                updates: {
                    journeyStoryContent: story
                }
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Failed to generate story:", error);
        } finally {
            setIsGeneratingStory(false);
        }
    };

    return (
        <div className={`border-r border-stone-200 bg-stone-50 relative flex flex-col h-full transition-all duration-300 z-30 ${isCollapsed ? 'w-12' : 'w-[45%]'}`}>
            {showSuccess && <Confetti numberOfPieces={200} recycle={false} />}

            {/* Collapse/Expand Toggle - Centered Vertical Pill */}
            <button
                onClick={onToggleCollapse}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 h-16 w-6 bg-white border border-stone-200 rounded-r-xl flex items-center justify-center shadow-md text-stone-400 hover:text-nobel-gold hover:bg-stone-50 transition-all cursor-pointer"
                title={isCollapsed ? "Expand Origin Story" : "Collapse Origin Story"}
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Scrollable Content Container */}
            <div className="w-full h-full overflow-y-auto flex flex-col">
                {!isCollapsed && (
                    <>
                        <div className="p-8 border-b border-stone-200 bg-white sticky top-0 z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <h2 className="font-serif text-3xl font-bold text-stone-900">Origin Story</h2>
                                {/* Optional: Close X inside header if preferred, but pill is sufficient */}
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-stone-500 text-sm italic max-w-sm">
                                    Chronicle the key moments that defined {data.name}. This narrative drives the AI's understanding.
                                </p>

                                <button
                                    onClick={handleGenerateStory}
                                    disabled={isGeneratingStory}
                                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors disabled:opacity-50 shrink-0"
                                >
                                    {isGeneratingStory ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Writing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-3 h-3" /> AI Writer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col p-8 pt-0 pb-8">
                            <MiniStoryEditor
                                className="flex-grow min-h-[500px]"
                                content={data.journeyStoryContent || ''}
                                onChange={(newContent) => {
                                    updateProject({
                                        id: data.id as any,
                                        updates: { journeyStoryContent: newContent }
                                    });
                                }}
                            />
                        </div>
                    </>
                )}

                {/* Collapsed State - Vertical Text */}
                {isCollapsed && (
                    <div className="flex items-center justify-center h-full cursor-pointer hover:bg-stone-100 transition-colors" onClick={onToggleCollapse}>
                        <div className="transform -rotate-90 whitespace-nowrap">
                            <span className="font-serif text-sm font-bold text-stone-400 tracking-wider">ORIGIN STORY</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
