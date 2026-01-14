'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, usePaginatedQuery, useConvexAuth } from 'convex/react';
import { api } from "../convex/_generated/api";
import { toast } from 'sonner';
import { StartupData, RolePermissions } from '../types';
import {
    Home, Calendar, Target,
    TrendingUp, FileText, Users,
    Bell, Coffee, Video, Settings
} from 'lucide-react';
import { isSameDay, format, differenceInDays } from 'date-fns';

import TabNavigation from './TabNavigation';
import { Logo } from './Logo';
import DotPatternBackground from './DotPatternBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIGenerateDailyMemo, useAIGenerateStartupSummary } from '../hooks/useAICreate';
import { AIStrategyMemo } from './startup-overview/AIStrategyMemo';
import { HealthScore } from './startup-overview/HealthScore';
import { DailySchedule } from './startup-overview/DailySchedule';
import { CurrentFocus } from './startup-overview/CurrentFocus';
import { PriorityTasks } from './startup-overview/PriorityTasks';
import { HealthExplanationSheet } from './startup-overview/HealthExplanationSheet';
import { StrategySummarySheet } from './startup-overview/StrategySummarySheet';
import { GoalSheet } from './startup-overview/GoalSheet';

interface StartupOverviewProps {
    data: StartupData;
    onNavigate: (view: any) => void;
    currentView: any;
    allowedPages?: string[];
    permissions?: RolePermissions;
    currentUserRole?: string;
    userName?: string;
}

const timeAgo = (date: number) => {
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
};

const getMeetingIcon = (type: string) => {
    switch (type) {
        case 'investor': return <TrendingUp className="w-4 h-4" />;
        case 'team': return <Users className="w-4 h-4" />;
        case 'customer': return <Coffee className="w-4 h-4" />;
        case 'advisory': return <Video className="w-4 h-4" />;
        default: return <Calendar className="w-4 h-4" />;
    }
};

export const StartupOverview: React.FC<StartupOverviewProps> = ({
    data,
    onNavigate,
    currentView,
    allowedPages,
    userName,
}) => {
    const [showGoalsPanel, setShowGoalsPanel] = useState(false);
    const [showHealthSheet, setShowHealthSheet] = useState(false);
    const [showSummarySheet, setShowSummarySheet] = useState(false);
    const [summaryContent, setSummaryContent] = useState<string>('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMemoExpanded, setIsMemoExpanded] = useState(false);

    // AI Daily Focus Logic
    const today = new Date().toISOString().split('T')[0];
    const dailyMemo = useQuery(api.dailyMemos.getDailyMemo, { projectId: data.id as any, date: today });
    const markMemoAsRead = useMutation(api.dailyMemos.markAsRead);
    const generateDailyMemo = useAIGenerateDailyMemo();
    const generateStrategySummary = useAIGenerateStartupSummary();
    const updateProject = useMutation(api.projects.update);
    const markAllNotificationsRead = useMutation(api.notifications.markAllAsRead);

    // Notifications
    const { results: recentNotifications } = usePaginatedQuery(
        api.notifications.getNotifications,
        { projectId: data.id as any },
        { initialNumItems: 5 }
    );
    const unreadCount = recentNotifications?.filter(n => !n.isRead).length || 0;
    const [isGeneratingMemo, setIsGeneratingMemo] = useState(false);
    const [showAISettings, setShowAISettings] = useState(false);

    // Calendar Data
    const { isAuthenticated } = useConvexAuth();
    const calendarEvents = useQuery(api.calendar.getEvents, isAuthenticated ? { projectId: data.id as any } : "skip");
    const todayEvents = React.useMemo(() => {
        if (!calendarEvents) return [];
        return calendarEvents.filter(e => isSameDay(new Date(e.start), new Date()));
    }, [calendarEvents]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setShowSummarySheet(true);
        try {
            const summary = await generateStrategySummary({ projectId: data.id as any });
            setSummaryContent(summary);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setSummaryContent("Failed to generate strategic summary. Please try again.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleRefreshMemo = async () => {
        setIsGeneratingMemo(true);
        try {
            await generateDailyMemo({ projectId: data.id as any, date: today });
        } catch (error) {
            console.error("Failed to generate daily memo:", error);
        } finally {
            setIsGeneratingMemo(false);
        }
    };

    // Auto-generate memo if missing
    React.useEffect(() => {
        if (dailyMemo === null && !isGeneratingMemo) {
            handleRefreshMemo();
        }
    }, [dailyMemo]);

    // Bi-weekly Strategy Logic
    React.useEffect(() => {
        const lastGen = data.lastStrategyGeneratedAt || 0;
        const frequency = data.strategyFrequencyDays || 14;
        const daysSince = differenceInDays(new Date(), new Date(lastGen));

        if (daysSince >= frequency && !isGeneratingSummary) {
            console.log("Strategic analysis is due.");
        }
    }, [data.lastStrategyGeneratedAt]);

    const createGoal = useMutation(api.goals.addGoal);

    // Health score calculation
    const healthBreakdown = React.useMemo(() => {
        let scores = {
            legalDocs: 0,
            legalDocsDetails: {} as Record<string, boolean>,
            total: 0
        };

        // Parse organization details
        let orgDetails: any = {};
        if (data.organizationDetails) {
            try {
                orgDetails = typeof data.organizationDetails === 'string'
                    ? JSON.parse(data.organizationDetails)
                    : data.organizationDetails;
            } catch (e) {
                console.error("Failed to parse organizationDetails", e);
            }
        }

        const legalDocs = orgDetails.legalDocs || {};
        scores.legalDocsDetails = legalDocs;

        const foundationalDocs = [
            'Business Registration',
            'EIN Number',
            'Operating Agreement',
            'Bylaws'
        ];

        let checkedCount = 0;
        foundationalDocs.forEach(doc => {
            if (legalDocs[doc]) checkedCount++;
        });

        scores.legalDocs = checkedCount * 25;
        scores.total = scores.legalDocs;

        return scores;
    }, [data.organizationDetails]);

    const healthScore = healthBreakdown.total;

    const getHealthColor = (score: number) => score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-nobel-gold' : 'text-red-500';
    const getHealthBg = (score: number) => score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-nobel-gold' : 'bg-red-500';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    };

    const activeGoal = data.goals?.find(g => g.status === 'In Progress');

    const activeGoalProgress = activeGoal && activeGoal.keyResults && activeGoal.keyResults.length > 0
        ? Math.round(activeGoal.keyResults.reduce((acc, kr) => {
            const target = kr.target || 1;
            const progress = Math.max(0, Math.min(1, kr.current / target));
            return acc + progress;
        }, 0) / activeGoal.keyResults.length * 100)
        : 0;

    const markAsRead = useMutation(api.notifications.markAsRead);

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markAsRead({ notificationId: notification._id });
        }
        setShowNotifications(false);

        if (notification.metadata) {
            if (notification.metadata.includes('market-research') || notification.metadata.includes('/market')) {
                onNavigate('MARKET');
            } else if (notification.metadata.includes('bottom-up') || notification.metadata.includes('/bottom-up-sizing')) {
                onNavigate('BOTTOM_UP_SIZING');
            } else if (notification.metadata.includes('competitors')) {
                onNavigate('COMPETITORS');
            } else if (notification.metadata.includes('calendar')) {
                onNavigate('CALENDAR');
            } else if (notification.metadata.includes('okr') || notification.metadata.includes('goals')) {
                onNavigate('GOALS');
            }
        }
    };

    return (
        <div className="h-screen flex bg-nobel-cream relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-[30%] h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20"
            >
                <img
                    src="/images/milad-fakurian-F4qy_1tAFfs-unsplash.jpg"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
                    alt="Startup Overview"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-900/80" />
                <div className="absolute top-12 left-12 z-30">
                    <Logo imageClassName="h-10 w-auto brightness-0 invert" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-12 space-y-6 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pt-32">
                    <div className="space-y-4">
                        <h2 className="text-white text-4xl font-serif font-bold leading-tight">
                            {getGreeting()}<br />
                            <span className="text-nobel-gold italic">{userName ? userName.split(' ')[0] : 'Founder'}.</span>
                        </h2>
                        <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                        <p className="text-stone-300 text-sm leading-relaxed max-w-sm">
                            Here's what needs your attention today.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="w-[70%] h-full flex flex-col relative z-10">
                <DotPatternBackground color="#a8a29e" />
                <header className="px-10 py-4 flex items-center justify-between relative z-30 bg-white/80 backdrop-blur-sm border-b border-stone-200">
                    <div className="flex items-center gap-6">
                        <Logo imageClassName="h-8 w-auto" />
                        <div className="w-px h-6 bg-stone-200" />
                        <TabNavigation
                            currentView={currentView}
                            onNavigate={onNavigate}
                            allowedPages={allowedPages}
                            projectFeatures={{
                                canvasEnabled: data.canvasEnabled,
                                marketResearchEnabled: data.marketResearchEnabled
                            }}
                            mode="light"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('MARKET')}
                            className="px-4 py-2 bg-nobel-gold text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#A38035] transition-colors flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" /> HUB
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-50 transition-all hover:shadow-sm"
                            >
                                <Bell className={`w-4 h-4 text-stone-600 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                                    >
                                        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900">Activity Log</h4>
                                            <button
                                                onClick={() => markAllNotificationsRead({ projectId: data.id as any })}
                                                className="text-[10px] text-nobel-gold font-bold hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto">
                                            {recentNotifications && recentNotifications.length > 0 ? (
                                                recentNotifications.map(n => (
                                                    <div
                                                        key={n._id}
                                                        onClick={() => handleNotificationClick(n)}
                                                        className={`px-5 py-4 hover:bg-stone-50 border-b border-stone-50 last:border-0 cursor-pointer transition-colors group ${n.isRead ? 'opacity-50' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 shadow-sm group-hover:scale-110 transition-transform`}>
                                                                <Bell className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h5 className={`text-[13px] font-bold text-stone-900 ${n.isRead ? 'line-through text-stone-400' : ''}`}>{n.title}</h5>
                                                                    <span className="text-[10px] text-stone-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                                                </div>
                                                                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{n.description}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-stone-400 text-xs italic">
                                                    No recent activity found.
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-5 py-3 bg-stone-50 text-center">
                                            <button
                                                onClick={() => { setShowNotifications(false); onNavigate('NOTIFICATIONS'); }}
                                                className="bg-black text-white rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                                            >
                                                View Timeline
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => onNavigate('SETTINGS')}
                            className="p-2 bg-white border border-stone-200 rounded-full hover:bg-stone-50 transition-all hover:shadow-sm"
                        >
                            <Settings className="w-3.5 h-3.5 text-stone-600" />
                        </button>
                    </div>
                </header>

                <main className="flex-grow flex flex-col px-12 py-10 overflow-y-auto relative z-10">
                    <div className="max-w-4xl mx-auto w-full space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold text-stone-900 mb-2">Startup Overview</h1>
                            <p className="text-stone-500">Your daily command center for {data.name}.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <AIStrategyMemo
                                dailyMemo={dailyMemo}
                                isGeneratingMemo={isGeneratingMemo}
                                showAISettings={showAISettings}
                                setShowAISettings={setShowAISettings}
                                isMemoExpanded={isMemoExpanded}
                                setIsMemoExpanded={setIsMemoExpanded}
                                markMemoAsRead={markMemoAsRead}
                                handleRefreshMemo={handleRefreshMemo}
                                updateProject={updateProject}
                                data={data}
                            />
                            <HealthScore
                                healthScore={healthScore}
                                setShowHealthSheet={setShowHealthSheet}
                                getHealthColor={getHealthColor}
                                getHealthBg={getHealthBg}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DailySchedule
                                todayEvents={todayEvents}
                                onNavigate={onNavigate}
                                format={format}
                                getMeetingIcon={getMeetingIcon}
                            />
                            <CurrentFocus
                                activeGoal={activeGoal}
                                activeGoalProgress={activeGoalProgress}
                                onNavigate={onNavigate}
                                setShowGoalsPanel={setShowGoalsPanel}
                            />
                        </div>

                        <PriorityTasks
                            data={data}
                            currentView={currentView}
                            onNavigate={onNavigate}
                            handleGenerateSummary={handleGenerateSummary}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-3 gap-4"
                        >
                            <button
                                onClick={() => setShowGoalsPanel(true)}
                                className="p-4 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-nobel-gold transition-all group text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3 group-hover:bg-nobel-gold group-hover:text-white transition-colors">
                                    <Target className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-stone-900 text-sm">Add New Goal</h3>
                                <p className="text-xs text-stone-400 mt-1">Set OKRs for next cycle</p>
                            </button>
                            <button
                                onClick={() => onNavigate('TEAM')}
                                className="p-4 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-nobel-gold transition-all group text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3 group-hover:bg-nobel-gold group-hover:text-white transition-colors">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-stone-900 text-sm">Team check-in</h3>
                                <p className="text-xs text-stone-400 mt-1">Review team progress</p>
                            </button>
                            <button
                                onClick={() => onNavigate('DOCUMENTS')}
                                className="p-4 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-nobel-gold transition-all group text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-3 group-hover:bg-nobel-gold group-hover:text-white transition-colors">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-stone-900 text-sm">Upload Documents</h3>
                                <p className="text-xs text-stone-400 mt-1">Organize contracts & files</p>
                            </button>
                        </motion.div>
                    </div>
                </main>
            </div>

            <HealthExplanationSheet
                isOpen={showHealthSheet}
                onClose={() => setShowHealthSheet(false)}
                healthScore={healthScore}
                legalDocs={healthBreakdown.legalDocsDetails || {}}
            />

            <GoalSheet
                isOpen={showGoalsPanel}
                onClose={() => setShowGoalsPanel(false)}
                currentGoals={data.goals || []}
                onCreateGoal={createGoal as any}
                projectId={data.id as any}
            />

            <StrategySummarySheet
                isOpen={showSummarySheet}
                onClose={() => setShowSummarySheet(false)}
                summary={summaryContent}
                isGenerating={isGeneratingSummary}
            />
        </div>
    );
};
