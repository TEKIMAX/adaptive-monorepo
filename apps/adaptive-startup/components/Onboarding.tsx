import React, { useState } from 'react';
import { Pencil, Rocket, Check, Plus, Trash2, X, LogOut, Loader2, Users, UserMinus, SettingsIcon, ArrowRight, UserPlus, User, ArrowLeft, ChevronRight, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from "../convex/_generated/api";
import { StartupData, CanvasSection, Role, DEFAULT_ROLES, PageAccess } from '../types';
import CustomSelect from './CustomSelect';
import MultiSelect from './MultiSelect';
import { Logo } from './Logo';
import DebugControlPanel from './DebugControlPanel';
import { UnifiedMediaPicker } from './UnifiedMediaPicker';
import { OnboardingFlow } from './OnboardingFlow';

import { CreateVentureForm } from './CreateVentureForm';

interface OnboardingProps {
    onComplete: (name: string, hypothesis: string, foundingDate?: number, logo?: string) => void;
    projects: StartupData[];
    onSwitchProject: (id: string) => void;
    onDeleteProject?: (id: string) => void;
    onOpenSettings: () => void;
    onOpenProjectSettings?: (id: string) => void;
    onUpdateProject?: (updater: (project: StartupData) => StartupData) => void;
    user?: any;
    initialMode?: 'dashboard' | 'create';
    onLogout?: () => void;
    onRequestSubscription?: () => void;
}

const HYPOTHESIS_TEMPLATE = "We help [Target Audience] solve [Problem] by [Solution] with [Secret Sauce].";

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, projects, onSwitchProject, onDeleteProject, onOpenSettings, onOpenProjectSettings, onUpdateProject, user, initialMode, onLogout, onRequestSubscription }) => {
    // Determine initial mode:
    // 1. If user is explicitly passed initialMode, use it.
    // 2. If user is NOT a Founder (paid subscriber), forced to 'dashboard' (cannot create).
    // 3. If user has projects, default to 'dashboard'.
    // 4. Otherwise (Founder with 0 projects), default to 'create'.
    // canCreate is true if user is a paying founder, admin, OR trialing (Explorer)
    const canCreate = user?.isFounder === true || user?.role === 'Founder' || user?.role === 'Admin' || user?.subscriptionStatus === 'trialing';
    const [mode, setMode] = useState<'dashboard' | 'create'>(() => {
        if (initialMode) return initialMode;
        if (!canCreate) return 'dashboard';
        return projects.length > 0 ? 'dashboard' : 'create';
    });

    const [name, setName] = useState('');
    const [hypothesis, setHypothesis] = useState(HYPOTHESIS_TEMPLATE);
    // Default to current year
    const [foundingYear, setFoundingYear] = useState<string>(new Date().getFullYear().toString());

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeProjectIdForInvite, setActiveProjectIdForInvite] = useState<string | null>(null);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<Role>('Employee');
    const [selectedPages, setSelectedPages] = useState<string[]>([]);

    // Delete Confirmation State
    // Delete Confirmation State
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    // Invite Processing State
    const [processingInvite, setProcessingInvite] = useState<string | null>(null);

    // Actions
    const acceptInvitation = useAction(api.workos.acceptInvitation);
    const revokeInvitation = useAction(api.workos.revokeInvitation);

    // Profile Dropdown State
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Edit Sheet State
    const [editingProject, setEditingProject] = useState<StartupData | null>(null);
    const [editName, setEditName] = useState('');
    const [editHypothesis, setEditHypothesis] = useState('');
    const [editFoundingYear, setEditFoundingYear] = useState('');
    const [editLogo, setEditLogo] = useState('');
    const [editLogoPreview, setEditLogoPreview] = useState('');
    const [activeLogoPicker, setActiveLogoPicker] = useState<'create' | 'edit' | null>(null);
    const [createLogo, setCreateLogo] = useState('');
    const [createLogoPreview, setCreateLogoPreview] = useState('');

    // Referral Modal State
    const [showReferralModal, setShowReferralModal] = useState(false);

    // Mutations
    // Mutations & Actions
    const updateProjectMutation = useMutation(api.projects.update);
    const leaveProjectAction = useAction(api.workos.leaveOrganization);

    // Leave State
    const [projectToLeave, setProjectToLeave] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeaveProject = async () => {
        if (!projectToLeave) return;
        setIsLeaving(true);
        // Optimistic update (remove local immediately for speed perception)
        // onUpdateProject might not remove it from list, so we rely on parent refetch or reload, 
        // but ideally we should update local state. 'projects' prop comes from parent.
        // We can't easily force parent update without callback. 
        // But the action is fast.

        try {
            const project = projects.find(p => p.id === projectToLeave);
            if (project && project.orgId) {
                await leaveProjectAction({ orgId: project.orgId });
                // We should ideally reload or notify parent. 
                // Since this component uses 'projects' prop, we need parent to refresh.
                // Assuming 'window.location.reload()' or similar standard pattern for major state changes if no callback provided.
                window.location.reload();
            }
        } catch (e) {
            console.error("Failed to leave project:", e);
            alert("Failed to leave project. Please try again.");
            setIsLeaving(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Enforce Subscription Check
        const isSubscribed = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
        // We only enforce this for CREATE action.
        if (!isSubscribed && onRequestSubscription) {
            onRequestSubscription();
            return;
        }

        if (name.trim() && hypothesis.trim()) {
            const year = parseInt(foundingYear) || new Date().getFullYear();
            // Create a timestamp for Jan 1st of that year
            const dateTimestamp = new Date(year, 0, 1).getTime();
            onComplete(name, hypothesis, dateTimestamp, createLogo);
        }
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // ... (rest of handleInvite logic)
    };

    // ... (rest of component logic)

    const timeAgo = (date: number) => {
        const seconds = Math.floor((Date.now() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    // Helper to get initials
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F8F4] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-nobel-dark selection:bg-nobel-gold selection:text-white">

            {/* Header - Hidden in Create Mode */}
            {mode !== 'create' && (
                <header className="px-6 py-6 flex justify-between items-center bg-[#F9F8F4]/90 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 border-b border-stone-200/50">
                    <div className="cursor-pointer" onClick={() => setMode('dashboard')}>
                        <Logo className="flex items-center gap-3" imageClassName="h-16 w-auto rounded-lg" textClassName="font-serif font-bold text-lg tracking-wide text-stone-900" />
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium tracking-wide text-stone-600">

                        {/* User Profile */}
                        {user && (
                            <div className="relative">
                                <div
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="flex items-center gap-3 mr-4 pl-4 border-l border-stone-200 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs font-bold text-stone-900 flex items-center justify-end gap-1">
                                            {user.name}
                                            {(user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') && (
                                                <span className="bg-nobel-gold text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider">PRO</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-stone-400 uppercase tracking-wider">{user.role || "Founder"}</div>
                                    </div>
                                    {user.pictureUrl ? (
                                        <img src={user.pictureUrl} alt={user.name} className="w-8 h-8 rounded-full border border-white shadow-sm object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500 border border-white shadow-sm">
                                            {getInitials(user.name || "User")}
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown Menu */}
                                {showProfileDropdown && (
                                    <div className="absolute top-12 right-4 bg-white rounded-xl shadow-xl border border-stone-100 py-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">

                                        <button
                                            onClick={() => {
                                                if (onLogout) onLogout();
                                                setShowProfileDropdown(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </div>
                                )}

                                {/* Backdrop to close */}
                                {showProfileDropdown && (
                                    <div
                                        className="fixed inset-0 z-40 bg-transparent"
                                        onClick={() => setShowProfileDropdown(false)}
                                    ></div>
                                )}
                            </div>
                        )}

                        {/* Header Buttons */}
                        {mode === 'dashboard' && (
                            <div className="flex gap-3">
                                {user?.isFounder && (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') && (
                                    <button
                                        onClick={() => setShowReferralModal(true)}
                                        className="px-5 py-2 bg-green-100/50 text-green-700 border border-green-200/60 rounded-full hover:bg-green-100 transition-colors shadow-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Gift className="w-3 h-3" /> Refer & Gain $50
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </header>
            )}

            <div className="flex-grow flex flex-col items-center p-6 pb-20">

                {mode === 'dashboard' ? (
                    /* DASHBOARD VIEW */
                    <div className="w-full max-w-7xl mt-12 animate-fade-in-up">
                        <div className="text-center mb-16">
                            <div className="inline-block mb-3 text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">PORTFOLIO</div>
                            <h1 className="font-serif text-4xl md:text-5xl mb-6 text-stone-900">Your Startups</h1>
                            <div className="w-16 h-1 bg-nobel-gold mx-auto opacity-60"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                            {/* Create New Card - Only visible when projects exist */}
                            {projects.length > 0 && (
                                <button
                                    onClick={() => setMode('create')}
                                    className="flex flex-col items-center justify-center h-72 bg-[#F5F4F0] rounded-xl border border-stone-200 border-dashed hover:border-stone-400 hover:bg-white transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-nobel-gold group-hover:text-white transition-colors mb-4">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-serif text-lg text-stone-500 group-hover:text-stone-900 italic">Start New Venture</span>
                                </button>
                            )}


                            {/* Existing Projects - AuthorCard Style */}
                            {[...projects].sort((a, b) => b.lastModified - a.lastModified).map((project, i) => {
                                if (project.isPending) {
                                    return (
                                        <div
                                            key={project.id}
                                            className="flex flex-col relative group p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-300 h-72 cursor-default hover:border-nobel-gold/50"
                                            style={{ animationDelay: (i * 0.1) + 's' }}
                                        >
                                            <div className="absolute top-4 right-4 animate-pulse">
                                                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-200">
                                                    EXTERNAL INVITE
                                                </span>
                                            </div>

                                            <div className="flex-grow flex flex-col items-center text-center justify-center">
                                                <h3 className="font-serif text-2xl text-stone-900 mb-3 line-clamp-2" title={project.invitationData?.orgName}>
                                                    {project.invitationData?.orgName || "New Organization"}
                                                </h3>
                                                <div className="w-8 h-0.5 bg-nobel-gold mb-4 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                                                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-2 leading-relaxed">
                                                    You found a new invite!
                                                </p>
                                                <p className="text-xs text-stone-400 italic mb-6">
                                                    Invited by {project.invitationData?.inviterName || "a team member"}
                                                </p>

                                                <div className="flex gap-3">
                                                    <button
                                                        disabled={processingInvite === project.invitationData?.id}
                                                        onClick={async () => {
                                                            if (project.invitationData?.id) {
                                                                setProcessingInvite(project.invitationData.id);
                                                                try {
                                                                    await acceptInvitation({ invitationId: project.invitationData.id });
                                                                } catch (e) {
                                                                    alert("Failed to accept: " + e);
                                                                    setProcessingInvite(null);
                                                                }
                                                            } else if (project.invitationData?.acceptUrl) {
                                                                // Legacy handling
                                                                alert("This invitation is too old to be accepted here. Please ask the admin to delete it and send you a NEW invitation.");
                                                                // window.location.href = project.invitationData.acceptUrl;
                                                            } else {
                                                                alert("Invalid invitation data. Please request a new invitation.");
                                                            }
                                                        }}
                                                        className={`px-6 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-600 transition-colors shadow-lg ${processingInvite === project.invitationData?.id ? 'opacity-50 cursor-wait' : ''} `}
                                                    >
                                                        {processingInvite === project.invitationData?.id ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        disabled={processingInvite === project.invitationData?.id}
                                                        onClick={async () => {
                                                            if (project.invitationData?.id) {
                                                                try {
                                                                    if (confirm("Are you sure you want to decline this invitation?")) {
                                                                        setProcessingInvite(project.invitationData.id);
                                                                        await revokeInvitation({ invitationId: project.invitationData.id });
                                                                    }
                                                                } catch (e) {
                                                                    alert("Failed to decline: " + e);
                                                                    setProcessingInvite(null);
                                                                }
                                                            } else {
                                                                alert("To deny, please ignore the invite or contact support.");
                                                            }
                                                        }}
                                                        className={`px-6 py-2 bg-stone-100 text-stone-500 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 transition-colors ${processingInvite === project.invitationData?.id ? 'opacity-50 cursor-wait' : ''} `}
                                                    >
                                                        Deny
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => onSwitchProject(project.id)}
                                        className="flex flex-col relative group p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-300 h-72 cursor-pointer hover:border-nobel-gold/50"
                                        style={{ animationDelay: (i * 0.1) + 's' }}
                                    >
                                        {/* Role Badge */}
                                        <div className="absolute top-4 left-4 z-20">
                                            {(() => {
                                                const myRole = project.teamMembers?.find((m: any) => m.email === user?.email)?.role || 'Member';
                                                const isOwner = myRole === 'Founder';
                                                return (
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border tracking-wider uppercase ${isOwner
                                                        ? 'bg-stone-900 text-white border-stone-900'
                                                        : 'bg-white text-stone-500 border-stone-200'
                                                        }`}>
                                                        {myRole === 'Member' ? 'EXTERNAL' : myRole}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* Settings / Delete Actions (Founder/Admin only) */}
                                        {(() => {
                                            const myRole = project.teamMembers?.find((m: any) => m.email === user?.email)?.role || 'Member';
                                            const canManage = myRole === 'Founder' || (myRole as string) === 'Admin';

                                            if (canManage) {
                                                return (
                                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onOpenProjectSettings) onOpenProjectSettings(project.id);
                                                            }}
                                                            className="p-2 text-stone-300 hover:text-stone-900 hover:bg-stone-50 rounded-full transition-colors"
                                                            title="Project Settings"
                                                        >
                                                            <SettingsIcon className="w-4 h-4" />
                                                        </button>
                                                        {myRole === 'Founder' && ( // Only Founder can delete? Or Admin too? user rules say Founder/Admin.
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProjectToDelete(project.id);
                                                                }}
                                                                className="p-2 text-stone-300 hover:text-red-500 hover:bg-stone-50 rounded-full transition-colors"
                                                                title="Delete Project"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            } else {
                                                // Member - Leave button
                                                return (
                                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setProjectToLeave(project.id);
                                                            }}
                                                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-stone-50 rounded-full transition-colors"
                                                            title="Leave Project"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        })()
                                        }

                                        {/* Settings Button */}


                                        <div className="flex-grow flex flex-col items-center text-center">
                                            <div className="flex items-center gap-4 mb-6">
                                                {(project as any).logo && (
                                                    <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center p-2 flex-shrink-0 shadow-sm">
                                                        <img src={(project as any).logo} alt="Logo" className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                                <h3 className="font-serif text-2xl text-stone-900 line-clamp-2 text-left">{project.name}</h3>
                                            </div>
                                            <div className="w-8 h-0.5 bg-nobel-gold mb-4 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-6 leading-relaxed line-clamp-3">
                                                {project.hypothesis || "No hypothesis defined"}
                                            </p>

                                            {/* Team Avatars */}
                                            <div className="flex -space-x-2 mb-4">
                                                {(project.teamMembers || []).slice(0, 4).map((m, idx) => (
                                                    <div key={idx} className="w-6 h-6 rounded-full bg-stone-100 border border-white flex items-center justify-center text-[8px] font-bold text-stone-600 overflow-hidden" title={`${m.name} (${m.role})`}>
                                                        {m.pictureUrl ? (
                                                            <img src={m.pictureUrl} alt={m.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            getInitials(m.name)
                                                        )}
                                                    </div>
                                                ))}
                                                {(project.teamMembers?.length || 0) > 4 && (
                                                    <div className="w-6 h-6 rounded-full bg-stone-200 border border-white flex items-center justify-center text-[8px] font-bold text-stone-500">
                                                        +{project.teamMembers.length - 4}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            {/* Stats Removed as per request */}
                                        </div>

                                        {
                                            (user?.role === 'Founder' || user?.role === 'Admin') && (
                                                <div className="absolute bottom-4 right-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingProject(project);
                                                            setEditName(project.name);
                                                            setEditHypothesis(project.hypothesis || '');
                                                            setEditFoundingYear(project.foundingDate ? new Date(project.foundingDate).getFullYear().toString() : new Date(project.createdAt).getFullYear().toString());
                                                            setEditLogo((project as any).logoStorageId || (project as any).logo || '');
                                                            setEditLogoPreview((project as any).logo || '');
                                                        }}
                                                        className="bg-stone-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-nobel-gold"
                                                        title="Edit Startup"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State for Members (Cannot Create) */}
                        {projects.length === 0 && !canCreate && mode === 'dashboard' && (
                            <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in-up">
                                {/* Hero Image with White Border - Tilted */}
                                <div className="relative mb-8">
                                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 border-white shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <img
                                            src="/images/Team.png"
                                            alt="Join a team"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-nobel-gold/10 rounded-full blur-2xl"></div>
                                    <div className="absolute -top-4 -left-4 w-16 h-16 bg-stone-200/50 rounded-full blur-xl"></div>
                                </div>

                                {/* Exciting Text */}
                                <div className="text-center max-w-lg">
                                    <div className="inline-block mb-4 px-3 py-1 border border-nobel-gold text-nobel-gold text-xs tracking-[0.2em] uppercase font-bold rounded-full">
                                        Venture Portfolio
                                    </div>
                                    <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">
                                        Your Adventure <span className="italic text-stone-500">Awaits</span>
                                    </h2>
                                    <p className="text-stone-500 text-lg leading-relaxed mb-8">
                                        The journey of a thousand miles begins with a single step. Start your venture today and transform your vision into reality the world is waiting for your innovation!
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        {/* Create Button - Black */}
                                        <button
                                            onClick={() => setMode('create')}
                                            className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                                        >
                                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                            Create Venture
                                        </button>

                                        {/* Invite Team Button - White */}
                                        <button
                                            onClick={() => window.location.href = '/subscription'}
                                            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 border border-stone-200 rounded-full text-sm font-bold uppercase tracking-widest hover:border-stone-400 hover:bg-stone-50 transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <Users className="w-5 h-5" />
                                            Invite Team
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty State for Founders (Can Create) */}
                        {projects.length === 0 && canCreate && mode === 'dashboard' && (
                            <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in-up">
                                {/* Hero Image with White Border */}
                                <div className="relative mb-8">
                                    <div className="w-72 h-72 md:w-96 md:h-80 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
                                        <img
                                            src="/images/hero-7.png"
                                            alt="Start your entrepreneurial journey"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-nobel-gold/20 rounded-full blur-2xl"></div>
                                    <div className="absolute -top-4 -left-4 w-20 h-20 bg-stone-200/50 rounded-full blur-xl"></div>
                                </div>

                                {/* Exciting Copy */}
                                <div className="text-center max-w-lg">
                                    <div className="inline-block mb-4 px-3 py-1 border border-nobel-gold text-nobel-gold text-xs tracking-[0.2em] uppercase font-bold rounded-full">
                                        Launch Your Vision
                                    </div>
                                    <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">
                                        Build Something <span className="italic text-stone-500">Extraordinary</span>
                                    </h2>
                                    <p className="text-stone-500 text-lg leading-relaxed mb-8">
                                        Every great company started with a single idea. Create your first venture and let Adaptive Startup guide you from concept to market.
                                    </p>

                                    {/* Two Buttons */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        {/* Create Button - Black */}
                                        <button
                                            onClick={() => setMode('create')}
                                            className="group inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                                        >
                                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                            Create Venture
                                        </button>

                                        {/* Invite Team Button - White */}
                                        <button
                                            onClick={() => window.location.href = '/subscription'}
                                            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-stone-900 border border-stone-200 rounded-full text-sm font-bold uppercase tracking-widest hover:border-stone-400 hover:bg-stone-50 transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <Users className="w-5 h-5" />
                                            Invite Team
                                        </button>
                                    </div>

                                    <p className="mt-6 text-xs text-stone-400 italic">
                                        "The best time to plant a tree was 20 years ago. The second best time is now."
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* CREATE VIEW */
                    <div className="w-full min-h-screen flex items-center justify-center">
                        <CreateVentureForm
                            onBack={() => setMode('dashboard')}
                            onComplete={onComplete}
                        />
                    </div>
                )}

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                            <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-nobel-gold" />
                                    <h3 className="font-serif text-xl text-stone-900">Invite Team</h3>
                                </div>
                                <button onClick={() => setShowInviteModal(false)} className="text-stone-400 hover:text-stone-900"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                {projects.length === 0 ? (
                                    <div className="text-center py-6 text-stone-500">
                                        <p className="mb-4">Create a project first to invite members.</p>
                                        <button onClick={() => { setShowInviteModal(false); setMode('create'); }} className="text-nobel-gold font-bold underline">Create Project</button>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Select Project</label>
                                            <CustomSelect
                                                value={activeProjectIdForInvite || ''}
                                                onChange={setActiveProjectIdForInvite}
                                                options={projects.map(p => ({ label: p.name, value: p.id }))}
                                                placeholder="Choose a project..."
                                            />
                                        </div>

                                        {activeProjectIdForInvite && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        value={newMemberName}
                                                        onChange={(e) => setNewMemberName(e.target.value)}
                                                        className="w-full p-2 border border-stone-200 rounded font-sans text-sm"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        value={newMemberEmail}
                                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                                        className="w-full p-2 border border-stone-200 rounded font-sans text-sm"
                                                        placeholder="john@example.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Role</label>
                                                    <CustomSelect
                                                        value={newMemberRole}
                                                        onChange={(val) => {
                                                            setNewMemberRole(val);
                                                            // Auto-populate pages based on role default
                                                            const roleDef = DEFAULT_ROLES.find(r => r.name === val);
                                                            if (roleDef) {
                                                                setSelectedPages(roleDef.allowedPages);
                                                            }
                                                        }}
                                                        options={DEFAULT_ROLES.map(r => ({ label: r.name, value: r.name }))}
                                                    />
                                                </div>

                                                <div>
                                                    <MultiSelect
                                                        label="Page Access"
                                                        options={Object.values(PageAccess).map(p => ({ label: p, value: p }))}
                                                        selectedValues={selectedPages}
                                                        onChange={setSelectedPages}
                                                        placeholder="Select pages..."
                                                    />
                                                </div>

                                                <div className="bg-stone-50 p-3 rounded text-xs text-stone-500 italic mt-2">
                                                    Tip: Investors invited here can be assigned to SAFE agreements in the Cap Table view.
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (onUpdateProject && activeProjectIdForInvite) {
                                                            // This logic assumes we can invoke onSwitchProject to make the project active first
                                                            // then update it. This is a workaround for the app structure.
                                                            onSwitchProject(activeProjectIdForInvite);
                                                            setTimeout(() => {
                                                                onUpdateProject(p => ({
                                                                    ...p,
                                                                    teamMembers: [...(p.teamMembers || []), {
                                                                        id: `member-${Date.now()} `,
                                                                        name: newMemberName,
                                                                        email: newMemberEmail,
                                                                        role: newMemberRole,
                                                                        allowedPages: selectedPages as PageAccess[],
                                                                        equity: 0
                                                                    }]
                                                                }));
                                                                setShowInviteModal(false);
                                                                setNewMemberName('');
                                                                setNewMemberEmail('');
                                                                setSelectedPages([]);
                                                            }, 100);
                                                        }
                                                    }}
                                                    disabled={!newMemberName || !newMemberEmail}
                                                    className="w-full py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-nobel-gold transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                                >
                                                    <UserPlus className="w-4 h-4" /> Add to Team
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {projectToDelete && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-serif text-xl text-stone-900 mb-2">Delete Project?</h3>
                                <p className="text-stone-500 text-sm mb-6">
                                    Are you sure you want to delete <span className="font-bold text-stone-900">{projects.find(p => p.id === projectToDelete)?.name}</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setProjectToDelete(null)}
                                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onDeleteProject) onDeleteProject(projectToDelete);
                                            setProjectToDelete(null);
                                        }}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Confirmation Modal */}
                {projectToLeave && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-600">
                                    <UserMinus className="w-6 h-6" />
                                </div>
                                <h3 className="font-serif text-xl text-stone-900 mb-2">Leave Project?</h3>
                                <p className="text-stone-500 text-sm mb-6">
                                    Are you sure you want to leave <span className="font-bold text-stone-900">{projects.find(p => p.id === projectToLeave)?.name}</span>? You will lose access to this project.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setProjectToLeave(null)}
                                        disabled={isLeaving}
                                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLeaveProject}
                                        disabled={isLeaving}
                                        className="flex-1 py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLeaving ? 'Leaving...' : 'Leave Project'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Startup Sheet */}
                {editingProject && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
                            onClick={() => setEditingProject(null)}
                        ></div>

                        {/* Side Sheet */}
                        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
                            <div className="h-full flex flex-col">
                                {/* Header */}
                                <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-nobel-gold rounded-full flex items-center justify-center text-white">
                                            <Pencil className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-serif text-xl text-stone-900">Edit Startup</h3>
                                    </div>
                                    <button
                                        onClick={() => setEditingProject(null)}
                                        className="text-stone-400 hover:text-stone-900 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                                    {/* Logo Upload for Edit */}
                                    {/* Logo Upload for Edit - HIDDEN */}
                                    {/* <div className="flex justify-center">
                                        <div
                                            onClick={() => setActiveLogoPicker('edit')}
                                            className="relative w-24 h-24 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-nobel-gold hover:bg-stone-50 transition-all group overflow-hidden"
                                        >
                                            {editLogoPreview ? (
                                                <img src={editLogoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-stone-400 group-hover:text-stone-600">
                                                    <div className="p-2 bg-stone-200 rounded-full">
                                                        <Rocket className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Logo</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
                                            </div>
                                        </div>
                                    </div> */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                            Startup Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="e.g. Acme AI"
                                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:border-nobel-gold focus:ring-0 outline-none transition-colors text-lg font-serif text-stone-900 placeholder-stone-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                            Founded Year
                                        </label>
                                        <input
                                            type="number"
                                            value={editFoundingYear}
                                            onChange={(e) => setEditFoundingYear(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:border-nobel-gold focus:ring-0 outline-none transition-colors text-lg font-serif text-stone-900 placeholder-stone-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
                                            Value Proposition
                                        </label>
                                        <textarea
                                            value={editHypothesis}
                                            onChange={(e) => setEditHypothesis(e.target.value)}
                                            placeholder="We help [Target Audience] solve [Problem] by [Solution] with [Secret Sauce]."
                                            className="w-full px-4 py-4 bg-[#F9F8F4] border border-stone-200 rounded-lg focus:border-stone-400 focus:ring-0 outline-none transition-all text-base text-stone-600 font-light leading-relaxed h-40 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex gap-3">
                                    <button
                                        onClick={() => setEditingProject(null)}
                                        className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-stone-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onUpdateProject && editingProject) {
                                                const year = parseInt(editFoundingYear) || new Date().getFullYear();
                                                const newFoundingDate = new Date(year, 0, 1).getTime();

                                                // Update Milestones if "Project Inception" exists
                                                let updatedMilestones = editingProject.milestones || [];
                                                const inceptionIndex = updatedMilestones.findIndex(m => m.id === 'inception' || m.title === 'Project Inception');
                                                if (inceptionIndex >= 0) {
                                                    updatedMilestones = [...updatedMilestones];
                                                    updatedMilestones[inceptionIndex] = {
                                                        ...updatedMilestones[inceptionIndex],
                                                        date: newFoundingDate
                                                    };
                                                }

                                                // 1. Convex Persistence
                                                if (user) {
                                                    updateProjectMutation({
                                                        id: editingProject.id as any,
                                                        updates: {
                                                            name: editName,
                                                            hypothesis: editHypothesis,
                                                            foundingDate: newFoundingDate,
                                                            milestones: updatedMilestones,
                                                            logo: editLogo
                                                        }
                                                    })
                                                        .then(() => {
                                                            toast.success("Startup updated successfully");
                                                            setEditingProject(null);
                                                        })
                                                        .catch((err) => {
                                                            console.error(err);
                                                            toast.error("Failed to update startup");
                                                        });
                                                }

                                                // 2. Local Update (Optimistic - Optional if real-time)
                                                if (onUpdateProject) {
                                                    onUpdateProject(p => ({
                                                        ...p,
                                                        name: editName,
                                                        hypothesis: editHypothesis,
                                                        foundingDate: newFoundingDate,
                                                        milestones: updatedMilestones,
                                                        logo: editLogoPreview || editLogo,
                                                        logoStorageId: editLogo
                                                    }));
                                                }
                                            }
                                        }}
                                        disabled={!editName.trim()}
                                        className="flex-1 py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-nobel-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Media Picker */}
                {activeLogoPicker && (
                    <UnifiedMediaPicker
                        onSelect={(url, preview) => {
                            if (activeLogoPicker === 'create') {
                                setCreateLogo(url);
                                setCreateLogoPreview(preview || url);
                            } else if (activeLogoPicker === 'edit') {
                                setEditLogo(url);
                                setEditLogoPreview(preview || url);
                            }
                            setActiveLogoPicker(null);
                        }}
                        onClose={() => setActiveLogoPicker(null)}
                        initialSearchTerm="abstract background"
                    />
                )}

                {/* Referral Modal */}
                {showReferralModal && (
                    <ReferralModal
                        onClose={() => setShowReferralModal(false)}
                        user={user}
                    />
                )}

            </div>
            {/* <DebugControlPanel /> */}
        </div>
    );
};

const ReferralModal = ({ onClose, user }: { onClose: () => void, user: any }) => {
    const generateCodeMutation = useMutation(api.referrals.generateReferralCode);
    const referralStats = useQuery(api.referrals.getReferralStats);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await generateCodeMutation();
            toast.success("Referral link generated! $50 credit applied.");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate code.");
        } finally {
            setGenerating(false);
        }
    };

    const copyLink = () => {
        if (referralStats?.code) {
            const url = `${window.location.origin}/refer/${referralStats.code}`;
            navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-100">
                <div className="bg-[#F9F8F4] text-center relative overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1600"
                        alt="Community"
                        className="w-full h-32 object-cover object-center opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F9F8F4] opacity-90"></div>

                    <button onClick={onClose} className="absolute top-4 right-4 text-stone-600 hover:text-stone-900 transition-colors bg-white/50 backdrop-blur-sm p-1 rounded-full z-10">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 -mt-10 mb-4 px-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-green-600 shadow-xl border-4 border-[#F9F8F4]">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="font-serif text-2xl text-stone-900 mt-2 mb-2">Refer & Earn Program</h3>
                        <p className="text-stone-500 text-sm leading-relaxed max-w-xs mx-auto">
                            Invite fellow founders to join Adaptive Startup.
                            <br /><span className="font-bold text-green-700">Earn Credit</span> for every new paid subscription.
                        </p>
                        <div className="mt-4 flex gap-2 justify-center text-[10px] uppercase font-bold tracking-wider text-stone-400">
                            <span className="bg-stone-200/50 px-2 py-1 rounded">Help Pay for Extra Seats</span>
                            <span className="bg-stone-200/50 px-2 py-1 rounded">Help Pay Monthly Bill</span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {referralStats === undefined ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                        </div>
                    ) : referralStats ? (
                        <div className="space-y-6">
                            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Your Unique Link</span>
                                <div className="flex items-center gap-2 w-full">
                                    <code className="flex-1 bg-white border border-stone-200 px-3 py-2 rounded-lg text-sm text-stone-600 font-mono truncate">
                                        {window.location.origin}/refer/{referralStats.code}
                                    </code>
                                    <button
                                        onClick={copyLink}
                                        className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors"
                                        title="Copy Link"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                                    <div className="text-2xl font-bold text-green-700 font-serif">{referralStats.count}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-600">Referrals</div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-100">
                                    <div className="text-2xl font-bold text-stone-700 font-serif">
                                        {referralStats.hasReceivedCredit ? '$50' : '$0'}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Credit Earned</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                Generate My Link
                            </button>
                            <p className="mt-4 text-xs text-stone-400 italic">
                                Use this credit towards your next bill.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;