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
}

export const StoryPanel: React.FC<StoryPanelProps> = ({ data, updateProject }) => {
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default
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
        <div className={`border-r border-stone-200 bg-stone-50 overflow-y-auto relative flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-[45%]'}`}>
            {showSuccess && <Confetti numberOfPieces={200} recycle={false} />}

            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-4 -right-3 z-20 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center hover:bg-nobel-gold hover:text-white hover:border-nobel-gold transition-colors shadow-sm"
                title={isCollapsed ? "Expand Origin Story" : "Collapse Origin Story"}
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {!isCollapsed && (
                <>
                    <div className="p-8 border-b border-stone-200 bg-white sticky top-0 z-10">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-serif text-3xl font-bold text-stone-900">Origin Story</h2>
                            <button
                                onClick={handleGenerateStory}
                                disabled={isGeneratingStory}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-nobel-gold transition-colors disabled:opacity-50"
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
                        <p className="text-stone-500 text-sm italic">
                            Chronicle the key moments that defined {data.name}. This narrative drives the AI's understanding of your context.
                        </p>
                    </div>

                    <div className="flex-grow">
                        <MiniStoryEditor
                            content={data.journeyStoryContent || ''}
                            onChange={(newContent) => {
                                // Debounced update or just direct for now (careful with performance)
                                // StartupJourney.tsx used direct update via MiniStoryEditor logic?
                                // Actually MiniStoryEditor logic calls onChange.
                                // We might want to debounce this in a real app, but for now strict replication.
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
                <div className="flex items-center justify-center h-full">
                    <div className="transform -rotate-90 whitespace-nowrap">
                        <span className="font-serif text-sm font-bold text-stone-400 tracking-wider">ORIGIN STORY</span>
                    </div>
                </div>
            )}
        </div>
    );
};
