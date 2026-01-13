import React, { useState, useEffect } from 'react';
import { StartupData, ViewState, AISettings, DEFAULT_ROLES, PageAccess, RoleDefinition } from './types';
import Onboarding from './components/Onboarding';
import { Loader2, Shield } from 'lucide-react';
import Settings from './components/Settings';
import { LandingPage } from './components/LandingPage';
// import SubscriptionPage from './components/SubscriptionPage';
import { BlogPage } from './pages/BlogPage';
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
    const success = params.get('success');
    const canceled = params.get('canceled');

    if (success === 'true' && isAuthenticated && convexUser?.onboardingCompleted) {
      toast.success("Subscription updated successfully!");
      setViewState('SETTINGS'); // Redirect to settings to see the updated plan
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

      {/* Footer */}
      {viewState !== 'ONBOARDING' && viewState !== 'LANDING_PAGE' && (
        <div className="fixed bottom-3 right-6 w-auto text-right pointer-events-none z-40">
          <p className="text-[10px] text-stone-400 font-medium tracking-wide font-sans">
            © 2025 Adaptive Startup. All rights reserved.
          </p>
        </div>
      )}

      {/* Auth Warning Modal */}
      {showAuthWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-stone-900 mb-2">Sign In Required</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signIn()}
                  className="px-6 py-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-colors"
                >
                  Sign In
                </button>
              </div>
              <div className="flex gap-3 mt-4 justify-center">
                <button
                  onClick={() => setShowAuthWarning(false)}
                  className="text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Expired Modal */}
      {user && !isAuthenticated && !isLoading && !isConvexLoading && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl px-8 py-8 md:w-[400px] text-center border border-stone-100">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-serif text-xl text-stone-900 mb-2">Session Expired</h3>
            <p className="text-stone-500 text-sm mb-6 leading-relaxed">
              Your security session has timed out. Please sign in again to continue working safely.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => signIn()}
                className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl"
              >
                Sign In to Resume
              </button>
              <button
                onClick={() => signOut()}
                className="text-xs text-stone-400 hover:text-stone-600 underline py-2"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cannot Delete Last Version Modal */}
      {showCannotDeleteLastVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl text-stone-900 mb-2">Action Prevented</h3>
            <p className="text-stone-500 text-sm mb-6">
              You cannot delete the last version. Please create a new version first before removing this one.
            </p>
            <button
              onClick={() => setShowCannotDeleteLastVersionModal(false)}
              className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-stone-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default App;
