import React, { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-react';
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Check, ChevronRight, Building2, User, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingFlowProps {
    user: any;
    onComplete: (name: string, hypothesis: string, foundingDate?: number) => void;
    mode?: 'onboarding' | 'create';
    className?: string; // Allow custom styling for embedded use cases
}

const STEPS = [
    { id: 1, title: 'Profile', icon: User },
    { id: 2, title: 'Role', icon: Shield },
    { id: 3, title: 'Organization', icon: Building2 },
    { id: 4, title: 'Plan', icon: CreditCard },
    { id: 5, title: 'Complete', icon: Check },
];

const ROLES = [
    "Founder",
    "Co-Founder",
    "CEO",
    "CTO",
    "Product Manager",
    "Serial Entrepreneur",
    "Business Owner",
    "Investor",
    "Other"
];

const ORG_SIZES = [
    "Just me",
    "2-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201+ employees"
];

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 50 : -50,
        opacity: 0,
    }),
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete, mode = 'onboarding' }) => {
    const updateStep = useMutation(api.users.updateOnboardingStep);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const createSubscription = useAction(api.stripe.createSubscriptionCheckout);
    const { signOut } = useAuth();

    // Determine initial step based on mode
    const initialStep = mode === 'create' ? 3 : (user?.onboardingStep || 1);
    const [currentStep, setCurrentStep] = useState(initialStep);

    // ... existing specific state ...
    const [direction, setDirection] = useState(0);
    const [formData, setFormData] = useState({
        role: user?.onboardingData?.role || "",
        orgSize: user?.onboardingData?.orgSize || "",
        yearsInBusiness: user?.onboardingData?.yearsInBusiness || "",
        industry: user?.onboardingData?.industry || "",
        name: user?.name || "",
        startupName: "",
        hypothesis: "We help [Target Audience] solve [Problem] by [Solution] with [Secret Sauce].",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Sync local state with user prop if it updates
    useEffect(() => {
        // Only sync step from user profile if NOT in 'create' mode (where we always start fresh)
        if (mode !== 'create' && user?.onboardingStep && user.onboardingStep > currentStep) {
            setCurrentStep(user.onboardingStep);
        }
    }, [user?.onboardingStep, mode]);

    // Check for success redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            setCurrentStep(5);
        }
    }, []);

    // Helper to check subscription status
    const isSubscribed = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
    const hasValidPeriod = user?.endsOn && user.endsOn > Date.now();
    const isInvitedMember = user?.roles && user.roles.length > 0;
    const shouldSkipPayment = isSubscribed || hasValidPeriod || (mode !== 'create' && (user?.onboardingCompleted || isInvitedMember));

    // Handle initial render side-effect for payment skipping (legacy support)
    useEffect(() => {
        // Only skip if fully active (paid) or completed, allowing 'trialing' users to see the Plan step
        const isPaid = user?.subscriptionStatus === 'active';
        if (currentStep === 4 && (isPaid || (mode !== 'create' && user?.onboardingCompleted))) {
            setCurrentStep(5);
        }
    }, [currentStep, user?.subscriptionStatus, mode, user?.onboardingCompleted]);

    const handleNext = async () => {
        setIsSubmitting(true);
        setDirection(1);
        try {
            let nextStep = currentStep + 1;

            // Save data to Convex
            const { name, ...restData } = formData;
            // Only update backend step if we are in onboarding mode
            if (mode === 'onboarding') {
                await updateStep({
                    step: nextStep,
                    name: name,
                    data: restData
                });
            }

            // Logic to SKIP Payment Step (4) if already paid (active)
            const isPaid = user?.subscriptionStatus === 'active';
            if (nextStep === 4 && (isPaid || (mode !== 'create' && user?.onboardingCompleted))) {
                nextStep = 5; // Jump to complete
            }

            setCurrentStep(nextStep);
        } catch (error) {
            toast.error("Failed to save progress. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = async () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(currentStep - 1);
            // Optionally sync back to server, but strictly mostly needed for forward progress
            await updateStep({ step: currentStep - 1 });
        }
    };

    const handlePayment = async () => {
        setIsSubmitting(true);
        try {
            // Redirect to Stripe with correct billing interval
            const { url } = await createSubscription({
                seats: 1,
                interval: billingCycle === 'yearly' ? 'year' : 'month'
            });
            if (url) {
                window.location.href = url;
            } else {
                toast.error("Failed to start checkout.");
                setIsSubmitting(false);
            }
        } catch (error) {
            toast.error("Failed to initialize payment.");
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        return (
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full"
                >
                    {(() => {
                        switch (currentStep) {
                            case 1:
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-serif text-stone-900 mb-2">Welcome, {user?.name || "User"}</h2>
                                            <p className="text-stone-500 text-lg">Let's confirm your details to get started.</p>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-transparent border-b border-stone-300 py-3 text-stone-900 font-medium focus:outline-none focus:border-stone-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="w-full bg-transparent border-b border-stone-300 py-3 text-stone-900 font-medium focus:outline-none cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex items-center justify-between">
                                            <div />
                                            <button
                                                onClick={handleNext}
                                                className="group flex items-center justify-center gap-2 bg-stone-900 text-white rounded-full px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 hover:gap-3 transition-all"
                                            >
                                                Continue <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            case 2:
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-serif text-stone-900 mb-2">One last thing...</h2>
                                            <p className="text-stone-500 text-lg">What is your primary role?</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {ROLES.map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => setFormData({ ...formData, role })}
                                                    className={`p-4 px-6 text-left transition-all border rounded-full font-medium ${formData.role === role
                                                        ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                                                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-900 hover:text-stone-900'
                                                        }`}
                                                >
                                                    <span className="font-medium">{role}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="pt-4 flex items-center justify-between">
                                            <button
                                                onClick={handleBack}
                                                className="group flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs hover:text-stone-600 hover:bg-stone-100 px-4 py-2 rounded-full transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Back
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                disabled={!formData.role || isSubmitting}
                                                className="group flex items-center justify-center gap-2 bg-stone-900 text-white rounded-full px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 hover:gap-3 transition-all disabled:opacity-50 disabled:hover:gap-2"
                                            >
                                                {isSubmitting ? 'Saving...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            case 3:
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-serif text-stone-900 mb-2">Tell us about your org</h2>
                                            <p className="text-stone-500 text-lg">We use this to benchmark your progress.</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Startup Name & Hypothesis - ONLY FOR CREATE MODE */}
                                            {mode === 'create' && (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Startup Name</label>
                                                        <input
                                                            type="text"
                                                            value={formData.startupName}
                                                            onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                                                            placeholder="e.g. Acme AI"
                                                            className="w-full bg-transparent border-b border-stone-300 py-3 text-stone-900 font-medium focus:outline-none focus:border-stone-900 text-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hypothesis</label>
                                                        <textarea
                                                            value={formData.hypothesis}
                                                            onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                                                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-stone-600 focus:outline-none focus:border-stone-900 h-24 text-sm"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Organization Size</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {ORG_SIZES.map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setFormData({ ...formData, orgSize: size })}
                                                            className={`px-6 py-2 text-sm border rounded-full transition-all font-medium ${formData.orgSize === size
                                                                ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                                                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-900'
                                                                }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Years in Business</label>
                                                    <select
                                                        value={formData.yearsInBusiness}
                                                        onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                                                        className="w-full bg-transparent border-b border-stone-300 py-2 text-stone-900 focus:outline-none focus:border-stone-900 rounded-none"
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="Pre-revenue / Idea">Idea Phase</option>
                                                        <option value="< 1 year">&lt; 1 year</option>
                                                        <option value="1-3 years">1-3 years</option>
                                                        <option value="3-5 years">3-5 years</option>
                                                        <option value="5+ years">5+ years</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Industry</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Examples: SaaS, AI..."
                                                        value={formData.industry}
                                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                        className="w-full bg-transparent border-b border-stone-300 py-2 text-stone-900 placeholder-stone-300 focus:outline-none focus:border-stone-900"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-between">
                                            <button
                                                onClick={handleBack}
                                                className="group flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-xs hover:text-stone-600 hover:bg-stone-100 px-4 py-2 rounded-full transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Back
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                disabled={!formData.orgSize || isSubmitting}
                                                className="group flex items-center justify-center gap-2 bg-stone-900 text-white rounded-full px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-stone-800 hover:gap-3 transition-all disabled:opacity-50 disabled:hover:gap-2"
                                            >
                                                {isSubmitting ? 'Saving...' : 'Plan'} <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            case 4:
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-serif text-stone-900 mb-2">Choose Your Path</h2>
                                            <p className="text-stone-500 text-lg">Start with a trial or commit to building your legacy.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Explorer Trial Card */}
                                            <div className={`p-8 border-2 rounded-3xl transition-all relative overflow-hidden ${user?.subscriptionStatus === 'trialing' ? 'border-stone-900 bg-stone-50 shadow-lg' : 'border-stone-100 bg-white'}`}>
                                                {user?.subscriptionStatus === 'trialing' && (
                                                    <div className="absolute top-0 right-0 bg-stone-900 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                                        Current Plan
                                                    </div>
                                                )}
                                                <div className="mb-6">
                                                    <p className="font-bold uppercase tracking-widest text-xs text-stone-500 mb-1">Explorer</p>
                                                    <h3 className="text-2xl font-serif text-stone-900 mb-2">Free Trial</h3>
                                                    <div className="text-3xl font-serif font-bold">$0</div>
                                                    <span className="text-stone-500 text-sm block">3 Days Access</span>
                                                </div>

                                                <ul className="space-y-3 mb-8 text-sm text-stone-600">
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Business Model Canvas</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Ideation & Whiteboard</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Startup Journey</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Team & Roles</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Documents</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> Financial Forecast</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> SAFE Generator</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-stone-400" /> AI Chat</li>
                                                    <li className="flex items-center gap-2 text-stone-400 italic text-xs pl-6">
                                                        *Rate Limited
                                                        <span className="block">+ more...</span>
                                                    </li>
                                                </ul>

                                                <button
                                                    onClick={() => {
                                                        // Continue with trial
                                                        setIsSubmitting(true);
                                                        setTimeout(() => {
                                                            setCurrentStep(5);
                                                            setIsSubmitting(false);
                                                        }, 500);
                                                    }}
                                                    className="w-full py-4 border border-stone-300 text-stone-900 font-bold uppercase tracking-widest text-xs hover:bg-stone-900 hover:text-white transition-colors rounded-full"
                                                >
                                                    Continue with Trial
                                                </button>
                                            </div>

                                            {/* Founder Pro Card */}
                                            <div className="p-8 border border-stone-100 rounded-3xl shadow-xl bg-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-nobel-gold text-[#0c0a09] text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                                    Most Popular
                                                </div>

                                                {/* Billing Toggle (Mini) */}
                                                <div className="flex justify-start mb-6">
                                                    <div className="bg-stone-100 p-1 rounded-full inline-flex">
                                                        <button
                                                            type="button"
                                                            onClick={() => setBillingCycle('monthly')}
                                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${billingCycle === 'monthly' ? 'bg-stone-900 text-white shadow' : 'text-stone-400 hover:text-stone-900'}`}
                                                        >
                                                            Monthly
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setBillingCycle('yearly')}
                                                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${billingCycle === 'yearly' ? 'bg-stone-900 text-white shadow' : 'text-stone-400 hover:text-stone-900'}`}
                                                        >
                                                            Yearly
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mb-6">
                                                    <p className="font-bold uppercase tracking-widest text-xs text-nobel-gold mb-1">Founder</p>
                                                    <h3 className="text-2xl font-serif text-stone-900 mb-2">Pro Membership</h3>
                                                    <div className="text-3xl font-serif font-bold">${billingCycle === 'monthly' ? '160' : '144'}</div>
                                                    <span className="text-stone-500 text-sm block">/month</span>
                                                </div>

                                                <ul className="space-y-3 mb-8 text-sm text-stone-600">
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-nobel-gold" /> Context-Aware AI Chat</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-nobel-gold" /> Market Research</li>
                                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-nobel-gold" /> Financial Modeling</li>
                                                </ul>
                                                <p className="text-sm text-stone-500 italic pl-6 pb-6 -mt-4">
                                                    + more...
                                                </p>

                                                <button
                                                    onClick={handlePayment}
                                                    disabled={isSubmitting}
                                                    className="w-full py-4 bg-nobel-gold text-[#0c0a09] font-bold uppercase tracking-widest text-xs hover:bg-white border border-transparent hover:border-nobel-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-80 rounded-full shadow-lg"
                                                >
                                                    {isSubmitting ? 'Processing...' : 'Upgrade Now'} <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-center">
                                            <button
                                                onClick={() => signOut()}
                                                className="text-stone-400 hover:text-stone-600 text-[10px] uppercase font-bold tracking-widest transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                );
                            case 5:
                                return (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-4xl font-serif text-stone-900 mb-2">Welcome to the Club.</h2>
                                            <p className="text-stone-500 text-lg">Your entrepreneurial journey begins now. Build something legendary.</p>
                                        </div>
                                        <div className="bg-white p-8 border border-stone-100 rounded-3xl shadow-xl text-center">
                                            <div className="mb-6 flex justify-center">
                                                <div className="h-16 w-16 bg-stone-900 rounded-full flex items-center justify-center">
                                                    <Check className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-serif text-stone-900 mb-2">All Systems Go</h3>
                                            <p className="text-stone-500 mb-8">Your workspace is ready. Let's get to work.</p>

                                            <button
                                                onClick={async () => {
                                                    // Complete onboarding (for user status)
                                                    if (mode !== 'create') {
                                                        await completeOnboarding();
                                                    }
                                                    // Pass project data if creating
                                                    onComplete(formData.startupName, formData.hypothesis);
                                                }}
                                                className="w-full py-4 bg-stone-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors rounded-full"
                                            >
                                                Enter Adaptive Startup
                                            </button>
                                        </div>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className={`flex h-screen w-full bg-[#FAFAFA] overflow-hidden font-sans ${user ? '' : ''} ${mode === 'create' ? 'h-full min-h-[800px] rounded-2xl shadow-xl border border-stone-200' : ''}`}>
            {/* Left Side - Content */}
            <div className={`w-full lg:w-[70%] h-full flex flex-col px-8 md:px-16 lg:px-24 relative overflow-y-auto ${mode === 'create' ? 'px-8 md:px-12 lg:px-16' : ''}`}>
                {/* Header / Breadcrumbs */}
                <div className="pt-12 pb-8">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <span className={`${currentStep === step.id ? 'text-stone-900' : ''} transition - colors`}>
                                    {step.title}
                                </span>
                                {index < STEPS.length - 1 && <span className="text-stone-300">/</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col justify-center mx-auto w-full pb-20 ${currentStep === 4 ? 'max-w-6xl' : 'max-w-xl'}`}>
                    {renderStepContent()}
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:block lg:w-[30%] h-full relative">
                <img
                    src="/onboarding-cover.png"
                    alt="Onboarding"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-stone-900/30" />

                <div className="absolute bottom-16 left-16 max-w-md text-white">
                    <p className="font-serif text-3xl mb-4 leading-tight">
                        "The secret of getting ahead is getting started."
                    </p>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                        — Mark Twain
                    </p>
                </div>
            </div>
        </div>
    );
};
