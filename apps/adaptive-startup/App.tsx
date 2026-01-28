import React, { useState, useEffect } from 'react';
import { StartupData, ViewState, AISettings, DEFAULT_ROLES, PageAccess, RoleDefinition } from './types';
import Onboarding from './components/Onboarding';
import { Loader2, Shield } from 'lucide-react';
import Settings from './components/Settings';
import { LandingPage } from './components/LandingPage';
// import SubscriptionPage from './components/SubscriptionPage';
import { BlogPage } from './pages/BlogPage';
import { AiTestPage } from './pages/AiTestPage';
import { BlogDetailPage } from './components/BlogDetailPage';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import ReferralRedeem from './components/ReferralRedeem';
import { OnboardingFlow } from './components/OnboardingFlow';
import StripeCallback from './components/StripeCallback';
import StoryFlow from './components/Story/StepView';
import AppPageRouter from './components/AppPageRouter';

import { useAuth } from '@workos-inc/authkit-react';
import { api } from "./convex/_generated/api";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { Toaster, toast } from "sonner";
import { useEntitlements } from './hooks/useEntitlements';
import { useProjectHandlers } from './hooks/useProjectHandlers';
import { useAccessControl } from './hooks/useAccessControl';
import { RealtimeVoiceSidebar } from './components/RealtimeVoiceSidebar';
import { LiveProvider } from './contexts/LiveContext';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const { user, signIn, signOut, isLoading } = useAuth();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const entitlements = useEntitlements();

  const convexUser = useQuery(api.users.getUser, isAuthenticated ? {} : "skip");
  const storeUser = useMutation(api.users.store);
  const storyProgress = useQuery(api.story.getStoryProgress, isAuthenticated ? {} : "skip");

  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  useEffect(() => {
    if (convexUser !== undefined) {
      setHasLoadedUser(true);
    }
  }, [convexUser]);

  useEffect(() => {
    if (isAuthenticated && user && !isConvexLoading) {
      const isMissingUser = convexUser === null;
      const isMalformedUser = convexUser && (convexUser.onboardingCompleted === undefined || convexUser.onboardingStep === undefined);

      if (isMissingUser || isMalformedUser) {
        storeUser({
          name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || "User",
          email: user.email || "",
          pictureUrl: user.profilePictureUrl || ""
        }).catch(err => console.error("Failed to restore/repair user:", err));
      }
    }
  }, [isAuthenticated, user, convexUser, isConvexLoading, storeUser]);

  // --- CRYPTO IDENTITY ---
  const registerPublicKey = useMutation(api.users.registerPublicKey);
  useEffect(() => {
    if (isAuthenticated && convexUser && !convexUser.publicKey) {
      import('./services/crypto').then(async (m) => {
        const identity = await m.ensureIdentity();
        registerPublicKey({ publicKey: identity.publicKey })
          .catch(err => console.error("Failed to register public key:", err));
      });
    }
  }, [isAuthenticated, convexUser, registerPublicKey]);

  const [projects, setProjects] = useState<StartupData[]>([]);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'ollama',
    modelName: 'gemini-3-flash-preview',
    apiKey: '',
    googleApiKey: '',
    openaiApiKey: '',
    ollamaApiKey: ''
  });

  const [viewState, setViewState] = useState<ViewState>(() => {
    const saved = localStorage.getItem('fs_view_state');
    return (saved as ViewState) || 'ONBOARDING';
  });
  const [settingsTab, setSettingsTab] = useState<'profile' | 'users' | 'domains' | 'organizations' | 'security' | 'integrations' | 'billing'>('profile');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem('fs_current_project_id');
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showCannotDeleteLastVersionModal, setShowCannotDeleteLastVersionModal] = useState(false);
  const [isLivePanelOpen, setIsLivePanelOpen] = useState(false);

  // Persistence for AI Settings
  useEffect(() => {
    const saved = localStorage.getItem('fs_ai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Fix broken model names
        if (parsed.modelName === 'gemini-1.5-pro-latest') {
          parsed.modelName = 'gemini-1.5-flash';
        }
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load AI settings:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fs_ai_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist View State and Project ID
  useEffect(() => {
    localStorage.setItem('fs_view_state', viewState);
  }, [viewState]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('fs_current_project_id', currentProjectId);
    } else {
      localStorage.removeItem('fs_current_project_id');
    }
  }, [currentProjectId]);

  // Handle Deep Linking
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/settings') {
      setViewState('SETTINGS');
    } else if (path === '/subscription' || path === '/billing') {
      setViewState('SETTINGS');
      setSettingsTab('billing');
    } else if (path === '/callback' && !isLoading) {
      const returnUrl = sessionStorage.getItem('founderstack_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('founderstack_return_url');
        window.location.href = returnUrl;
      } else {
        window.history.replaceState({}, document.title, '/');
      }
    } else if (path === '/blog') {
      setViewState('WIKI');
    }
  }, [user, isLoading]);

  // Handle Stripe Redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success') || params.get('subscription_success');
    const canceled = params.get('canceled') || params.get('subscription_canceled');

    if (success === 'true' && isAuthenticated && convexUser?.onboardingCompleted) {
      toast.success("Subscription updated successfully!");
      setViewState('ONBOARDING'); // Redirect to dashboard/project list
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated, convexUser?.onboardingCompleted]);

  // Convex Data
  const convexProjects = useQuery(api.projects.list, isAuthenticated ? {} : "skip");
  const isConvexProject = convexProjects?.some(p => p._id === currentProjectId);
  const remoteProject = useQuery(api.projects.get, (isAuthenticated && isConvexProject) ? { projectId: currentProjectId as any } : "skip");
  const localProject = projects.find(p => p.id === currentProjectId);
  const currentProject = (isConvexProject && remoteProject) ? remoteProject as any : localProject as StartupData | undefined;

  // RBAC
  const customRoles = useQuery(api.roles.list, { projectId: currentProjectId || 'local' }) || [];
  const customRolesList = customRoles.map(r => ({
    id: r._id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    allowedPages: r.allowedPages as PageAccess[]
  }));
  const effectiveDefaultRoles = DEFAULT_ROLES.filter(dr => !customRolesList.some(cr => cr.name === dr.name));
  const allRoles = [...effectiveDefaultRoles, ...customRolesList];

  // Backfill Slugs
  const backfillSlugs = useMutation(api.projects.backfillProjectSlugs);
  useEffect(() => {
    if (isAuthenticated) {
      backfillSlugs().catch(console.error);
    }
  }, [isAuthenticated, backfillSlugs]);

  // Display Projects
  const displayProjects = React.useMemo(() => {
    if (!convexProjects) return projects;
    return convexProjects.map(p => ({
      id: p._id,
      orgId: p.orgId,
      name: p.name,
      slug: (p as any).slug,
      hypothesis: p.hypothesis,
      createdAt: p._creationTime,
      lastModified: p.updatedAt,
      teamMembers: p.teamMembers.map((m: any) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        role: m.role,
        pictureUrl: m.pictureUrl,
        allowedPages: m.allowedPages,
        status: m.status
      })),
      customerInterviews: Array(p.interviewCount).fill({}),
      canvasVersions: (p.canvasVersions || []).map((v: any) => ({ ...v, data: {} as any })),
      marketVersions: [],
      competitorAnalysis: {} as any,
      dataSources: [],
      goals: [],
      equityContributions: [],
      canvasEnabled: p.canvasEnabled,
      marketResearchEnabled: p.marketResearchEnabled,
      isPending: (p as any).isPending,
      invitationData: (p as any).invitationData
    } as StartupData));
  }, [convexProjects, projects]);

  // Handlers Hook
  const handlers = useProjectHandlers({
    currentProjectId,
    currentProject,
    projects,
    setProjects,
    setCurrentProjectId,
    setViewState,
    setIsCreatingNew,
    setShowAuthWarning,
    setShowCannotDeleteLastVersionModal,
    user
  });

  // Permissions & Access Control
  const {
    isAccessDenied,
    isFeatureDisabled,
    currentUserAllowedPages,
    currentUserPermissions,
    currentUserRole
  } = useAccessControl({
    currentProject,
    user,
    viewState,
    entitlements,
    currentProjectId
  });

  // --- LOADING STATES ---
  if (!hasLoadedUser && ((isLoading && !user) || (isAuthenticated && convexUser === undefined))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F8F4] text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-300" />
        <p className="font-serif italic">Loading User Data...</p>
      </div>
    );
  }

  if (isAuthenticated && convexUser === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F8F4] text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-300" />
        <p className="font-serif italic text-lg">Restoring Account...</p>
        <p className="text-sm mt-2">Almost there, syncing your workspace.</p>
      </div>
    );
  }

  // --- PUBLIC ROUTES ---
  if (window.location.pathname === '/blog') {
    return <BlogPage onLogin={signIn} onNavigateHome={() => window.location.href = '/'} />;
  }

  // --- AI TEST PAGE ---
  if (window.location.pathname === '/ai-test') {
    return <AiTestPage />;
  }

  const projectBlogMatch = window.location.pathname.match(/^\/p\/([\w-]+)\/blog$/);
  if (projectBlogMatch) {
    return <BlogPage onLogin={signIn} onNavigateHome={() => window.location.href = '/'} projectSlug={projectBlogMatch[1]} />;
  }

  const blogPostMatch = window.location.pathname.match(/^\/blog\/([\w-]+)$/);
  const projectBlogPostMatch = window.location.pathname.match(/^\/p\/([\w-]+)\/blog\/([\w-]+)$/);
  const postSlug = blogPostMatch ? blogPostMatch[1] : (projectBlogPostMatch ? projectBlogPostMatch[2] : null);

  if (postSlug) {
    const accessedProjectSlug = projectBlogPostMatch ? projectBlogPostMatch[1] : undefined;
    return (
      <BlogDetailPage
        onLogin={signIn}
        onNavigateHome={() => window.location.href = '/'}
        onNavigateToBlog={() => window.location.href = accessedProjectSlug ? `/p/${accessedProjectSlug}/blog` : '/blog'}
        postId={postSlug}
        projectSlug={accessedProjectSlug}
      />
    );
  }

  if (window.location.pathname === '/terms') {
    return <TermsOfService onLogin={signIn} onNavigateHome={() => window.location.href = '/'} />;
  }
  if (window.location.pathname === '/privacy') {
    return <PrivacyPolicy onLogin={signIn} onNavigateHome={() => window.location.href = '/'} />;
  }

  const referralMatch = window.location.pathname.match(/^\/refer\/([A-Za-z0-9]+)$/);
  if (referralMatch) {
    return <ReferralRedeem />;
  }

  // Handle Stripe Connect Callback (Authenticated or Unauthenticated)
  if (window.location.pathname === '/stripe-callback') {
    return <StripeCallback />;
  }

  // --- UNAUTHENTICATED ---
  if (!user) {
    if (window.location.pathname === '/stripe-callback') {
      return <StripeCallback />;
    }
    return <LandingPage onLogin={signIn} />;
  }

  const displayUser = convexUser || (user ? {
    name: user.firstName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0] || "User",
    pictureUrl: user.profilePictureUrl,
    email: user.email
  } : null);

  // --- ONBOARDING FLOW ---
  if (convexUser && !convexUser.onboardingCompleted) {
    return <OnboardingFlow user={displayUser} onComplete={() => { }} />;
  }

  // --- STORY FLOW ---
  const isPaid = convexUser?.subscriptionStatus === 'active' || convexUser?.subscriptionStatus === 'trialing';
  const isStoryCompleted = storyProgress?.completed;

  if (convexUser && convexUser.onboardingCompleted && isPaid && !isStoryCompleted && false) {
    return <StoryFlow onComplete={() => { }} />;
  }

  // --- ACCESS DENIED ---
  if (isAccessDenied || isFeatureDisabled) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl text-stone-900 mb-2">Access Denied</h1>
        <p className="text-stone-500 max-w-md mb-8">
          {isFeatureDisabled
            ? `The ${viewState} feature is currently disabled for this project.`
            : `You do not have permission to view the ${viewState} page.`}
        </p>
        <button
          onClick={() => setViewState('ONBOARDING')}
          className="px-6 py-3 bg-stone-900 text-white rounded-full font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="font-sans text-stone-900 bg-[#F9F8F4] min-h-screen">
      <Toaster position="bottom-right" />

      {viewState === 'SETTINGS' && (
        <Settings
          settings={settings}
          currentProject={currentProject}
          onSave={setSettings}
          onBack={() => setViewState('ONBOARDING')}
          onLogout={signOut}
          currentUserRole={currentUserRole || 'Member'}
          allProjects={displayProjects}
          onSwitchProject={handlers.handleSwitchProject}
          onNewProject={handlers.handleNewProject}
          onNavigate={(view) => {
            if (view === 'SUBSCRIPTION') {
              setSettingsTab('billing');
              setViewState('SETTINGS');
            } else {
              handlers.handleNavigate(view);
            }
          }}
          allowedPages={currentUserAllowedPages}
          initialTab={settingsTab}
        />
      )}

      {viewState === 'ONBOARDING' && (
        <Onboarding
          onComplete={handlers.handleOnboardingComplete}
          onLogout={signOut}
          projects={displayProjects}
          onSwitchProject={handlers.handleSwitchProject}
          onDeleteProject={handlers.handleDeleteProject}
          onOpenSettings={() => setViewState('SETTINGS')}
          onOpenProjectSettings={handlers.handleOpenProjectSettings}
          onUpdateProject={handlers.updateCurrentProject}
          user={displayUser}
          initialMode={isCreatingNew ? 'create' : undefined}
          onRequestSubscription={() => {
            setSettingsTab('billing');
            setViewState('SETTINGS');
          }}
        />
      )}

      {/* Main Content & Sidebar Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <LiveProvider value={{ isLivePanelOpen, setIsLivePanelOpen, toggleLivePanel: () => setIsLivePanelOpen(prev => !prev) }}>
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isLivePanelOpen ? 'mr-[400px]' : ''}`}>
            <AppPageRouter
              viewState={viewState}
              currentProject={currentProject}
              currentProjectId={currentProjectId}
              displayProjects={displayProjects}
              settings={settings}
              allowedPages={currentUserAllowedPages}
              permissions={currentUserPermissions}
              currentUserRole={currentUserRole}
              user={displayUser}
              isAuthenticated={isAuthenticated}
              handlers={handlers}
              signOut={signOut}
              setViewState={setViewState}
            />
          </div>

          <div
            className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl z-40 transform transition-transform duration-300 bg-white border-l border-stone-200 ${isLivePanelOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            <RealtimeVoiceSidebar
              isOpen={isLivePanelOpen}
              onClose={() => setIsLivePanelOpen(false)}
              userName={displayUser?.name}
            />
          </div>
        </LiveProvider>
      </div>

    </div>
  );
};

export default App;
