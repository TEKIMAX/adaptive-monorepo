import React, { useState, useEffect, useMemo } from 'react';
import { useAction } from 'convex/react';
import { api } from "../convex/_generated/api";
import { StartupData } from '../types';
import {
    ConnectComponentsProvider,
    ConnectPayments,
    ConnectPayouts,
    ConnectAccountOnboarding,
    ConnectAccountManagement,
    ConnectDocuments
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { PaymentComingSoon } from './paymentComingSoon';
import { GlobeViz } from './GlobeViz';
import { Logo } from './Logo';
import ProjectSelector from './ProjectSelector';
import TabNavigation from './TabNavigation';
import { ViewState } from '../types';

interface StripeConnectDashboardProps {
    project: StartupData;
    allProjects: StartupData[];
    onSwitchProject: (projectId: string) => void;
    onNewProject: () => void;
    onNavigate: (view: ViewState) => void;
    currentView: ViewState;
    allowedPages?: string[];
}

const StripeConnectDashboard: React.FC<StripeConnectDashboardProps> = ({
    project,
    allProjects,
    onSwitchProject,
    onNewProject,
    onNavigate,
    currentView,
    allowedPages
}) => {
    // Stripe Logic - Hidden for now
    /*
    const createStripeLink = useAction(api.stripe.createAccountLink);
    const createAccountSession = useAction(api.stripe.createAccountSession);

    const [isConnecting, setIsConnecting] = useState(false);
    const [stripeConnectInstance, setStripeConnectInstance] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'onboarding' | 'payments' | 'payouts' | 'documents' | 'settings'>('payments');
    const [error, setError] = useState<string | null>(null);

    const handleConnectStripe = async () => {
        try {
            setIsConnecting(true);
            const { url } = await createStripeLink({ projectId: project.id });
            window.location.href = url;
        } catch (e) {
            console.error("Failed to init connect:", e);
            setIsConnecting(false);
            toast.error("Failed to start connection");
        }
    };

    // Initialize Stripe Connect
    useEffect(() => {
        if (project.stripeAccountId && !stripeConnectInstance) {
            const initStripe = async () => {
                try {
                    const instance = await loadConnectAndInitialize({
                        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "", // Ensure this is set
                        fetchClientSecret: async () => {
                            const { clientSecret } = await createAccountSession({ stripeAccountId: project.stripeAccountId! });
                            return clientSecret;
                        },
                        appearance: {
                            overlays: 'dialog',
                            variables: {
                                colorPrimary: '#0C0A09', // stone-900
                                fontFamily: 'Inter, system-ui, sans-serif',
                            },
                        },
                    });
                    setStripeConnectInstance(instance);
                } catch (e) {
                    console.error("Failed to initialize Stripe Connect:", e);
                    setError("Failed to load financial dashboard. Please check your configuration.");
                }
            };
            initStripe();
        }
    }, [project.stripeAccountId, createAccountSession]);
    */

    return (
        <div className="flex flex-col h-screen bg-[#F9F8F4] overflow-hidden">
            {/* Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between border-b border-stone-200">
                <div className="flex items-center gap-4">
                    <Logo imageClassName="h-8 w-auto" />
                    <div className="h-6 w-px bg-stone-200" />
                    <ProjectSelector
                        projects={allProjects}
                        currentProjectId={project.id}
                        onSelectProject={onSwitchProject}
                        onCreateNew={onNewProject}
                    />
                    <div className="h-6 w-px bg-stone-200" />
                    <TabNavigation
                        currentView={currentView}
                        onNavigate={onNavigate}
                        allowedPages={allowedPages}
                        projectFeatures={{
                            canvasEnabled: project.canvasEnabled,
                            marketResearchEnabled: project.marketResearchEnabled
                        }}
                    />
                </div>
            </header>

            <div className="relative w-full flex-grow flex items-center">
                {/* Background Globe Visualization - Moved to right */}
                <div className="absolute top-[60%] -right-24 -translate-y-1/2 w-[90rem] h-[90rem] z-0 opacity-80 mix-blend-multiply pointer-events-none transform scale-75 md:scale-100">
                    <GlobeViz />
                </div>

                {/* Gradient Overlay for better text readability - adjusted for right-side globe */}
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#F9F8F4] via-[#F9F8F4]/80 to-transparent pointer-events-none" />

                {/* Content Card */}
                <div className="relative z-10 p-6 md:p-12 w-full max-w-7xl mx-auto flex">
                    <div className="max-w-xl">
                        <PaymentComingSoon />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StripeConnectDashboard;
