import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BetaRequestDialog } from './components/ui/BetaRequestDialog';
import { BetaRequestForm } from './components/ui/BetaRequestForm';
import { InfrastructureStack } from './components/InfrastructureStack';
import CodeExampleStack from './components/ui/code-example-stack';
import { sdkCodeExamples } from './components/ui/sdk-examples';

const slideSEO = [
    {
        title: "TEKIMAX | Co-Adaptive Agency & Intelligence Augmentation",
        description: "Secure by Design architectures for Provenance Traces, Accountability, and Visibility into Shadow AI Users."
    },
    {
        title: "TEKIMAX | Ongoing Research in Production",
        description: "Active pilot projects showing co-adaptive guidance and human-in-the-loop ventures."
    },
    {
        title: "TEKIMAX | Research Focus",
        description: "Measuring agency, explainability, and feedback loops in co-adaptive systems."
    },
    {
        title: "TEKIMAX | Impact",
        description: "Committed to the military community through the Hiring Our Heroes 4+1 pledge and free AI training workshops for veterans."
    }
];

const UnderConstruction: React.FC = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        // Update Document Title
        document.title = slideSEO[currentSlide].title;

        // Update Meta Description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', slideSEO[currentSlide].description);
    }, [currentSlide]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % 4);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + 4) % 4);
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.5 } }
    };

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-tekimax-navy text-white relative overflow-y-auto md:overflow-hidden">

            <BetaRequestDialog
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />

            {/* Logo - Top Left */}
            <div className="absolute top-8 left-8 md:left-24 z-30">
                <img src="/images/tekimax-logo-white-RGB-2.png" alt="TEKIMAX Logo" className="h-8 md:h-10 w-auto" />
            </div>

            {/* Contact Button & Navigation - Top Right (Desktop Only) */}
            <div className="absolute top-8 right-8 z-30 hidden md:flex items-center gap-6">
                {/* Navigation Controls */}
                <div className="flex items-center gap-4 bg-white backdrop-blur-md rounded-full px-4 py-2 border border-black/10 shadow-xl">
                    <div className="flex flex-col items-start pr-4 border-r border-black/10">
                        <span className="text-[10px] font-bold text-black tracking-[0.2em] uppercase origin-left">
                            {currentSlide === 0 ? 'Orchestration' : currentSlide === 1 ? 'Ongoing Research' : currentSlide === 2 ? 'Research' : 'Impact'}
                        </span>
                    </div>
                    <button
                        onClick={prevSlide}
                        className="w-7 h-7 flex items-center justify-center bg-black rounded-full hover:bg-black/80 transition-all shadow-md active:scale-95 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        {[0, 1, 2, 3].map((idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-0.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-tekimax-blue' : 'w-3 bg-black/20 hover:bg-black/40'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={nextSlide}
                        className="w-7 h-7 flex items-center justify-center bg-black rounded-full hover:bg-black/80 transition-all shadow-md active:scale-95 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={() => setIsContactOpen(true)}
                    className="px-6 py-3 bg-black text-white rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-black/80 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white"
                >
                    Contact Us
                </button>
            </div>

            {/* Nvidia Inception Badge - Bottom Right */}
            <div className="absolute bottom-8 right-8 z-30 hidden md:block">
                <img src="/images/nvidia-inception-program-badge-rgb-for-screen.svg" alt="NVIDIA Inception Program" className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-4 right-4 z-30 md:hidden">
                <img src="/images/nvidia-inception-program-badge-rgb-for-screen.svg" alt="NVIDIA Inception Program" className="h-12 w-auto opacity-80" />
            </div>

            {/* Mobile Hamburger Menu (Persistent) */}
            <div className="absolute top-8 right-8 z-30 md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-sm flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm border border-white/10 transition-colors"
                >
                    <div className="w-5 h-0.5 bg-white"></div>
                    <div className="w-5 h-0.5 bg-white"></div>
                    <div className="w-5 h-0.5 bg-white"></div>
                </button>
            </div>

            {/* Mobile Side Menu Panel */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-[#111] border-l border-white/10 p-6 overflow-y-auto md:hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Menu</h3>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-10">
                                <h4 className="text-sm font-bold text-tekimax-blue uppercase tracking-widest mb-4">Pages</h4>
                                <div className="space-y-4">
                                    {[
                                        { id: 0, label: '01. Orchestration' },
                                        { id: 1, label: '02. Ongoing Research' },
                                        { id: 2, label: '03. Research' },
                                        { id: 3, label: '04. Impact' }
                                    ].map((slide) => (
                                        <button
                                            key={slide.id}
                                            onClick={() => {
                                                setCurrentSlide(slide.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-sm border transition-all ${currentSlide === slide.id
                                                ? 'bg-tekimax-blue/10 border-tekimax-blue text-white font-bold'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-sm tracking-widest uppercase">{slide.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-tekimax-gold uppercase tracking-widest mb-4">Contact Us</h4>
                                <p className="text-white/60 text-xs mb-6 leading-relaxed">
                                    Request access to our private beta or get in touch with our engineering team.
                                </p>
                                <BetaRequestForm
                                    onSuccess={() => setIsMobileMenuOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Left Column: Content */}
            <div className="w-full md:w-1/2 relative flex flex-col justify-center p-8 md:p-24 z-10 min-h-[60vh] pb-32 md:pb-24">

                <AnimatePresence mode="wait">
                    {currentSlide === 0 ? (
                        <motion.div
                            key="slide-0"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative z-10 max-w-xl w-full"
                        >
                            {/* Hero Badges */}
                            <div className="flex items-center gap-4 mb-8 mt-24 md:mt-0">
                                <span className="px-4 py-1.5 rounded-full bg-tekimax-blue/20 text-tekimax-blue text-[11px] font-bold tracking-[0.2em] uppercase border border-tekimax-blue/30">
                                    Human-Centered AI
                                </span>
                                <div className="h-px w-16 bg-white/20 hidden sm:block"></div>
                                <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] hidden sm:block">Engineering For Good</span>
                            </div>

                            <h1 className="font-barlow text-3xl md:text-5xl text-white mb-6 leading-tight font-bold">
                                Co-Adaptive Systems & <br />
                                <span className="text-tekimax-orange">Intelligence Augmentation.</span>
                            </h1>

                            <div className="h-px w-24 bg-tekimax-gold/30 hidden md:block mb-6"></div>

                            <div className="space-y-6 text-white/80 font-light leading-relaxed mb-12 text-sm max-w-lg">
                                <p>
                                    Our research is focused on <strong>Secure by Design</strong> architectures, <strong>Secure Context</strong>, <strong>Human and AI collaboration</strong>, <strong>Explainability</strong>, and the integration of <strong>human feedback</strong> into models. We enable <strong>co-adaptive systems</strong> that do not just automate tasks away but enable dynamic switching between human and AI control. This <strong>Secure by Design</strong> context ensures every interaction leaves a verifiable <strong>Provenance Trace</strong>, establishing accountability within your organization and visibility into shadow AI users.
                                </p>
                                <p>
                                    We call this <strong>Intelligence Augmentation</strong> where both <strong>AI agents</strong> and <strong>humans</strong> are empowered to execute the tasks they are best suited for, creating a seamless partnership.
                                </p>
                            </div>

                            {/* Maintenance & Mobile Contact */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">


                                <button
                                    onClick={nextSlide}
                                    className="group flex items-center gap-2 text-tekimax-orange hover:text-white transition-colors"
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest">Example Applications</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </div>

                            {/* Feature Showcases */}
                            <div className="mt-12 pt-8 border-t border-white/10">
                                <h2 className="font-display font-bold text-lg md:text-xl text-white mb-6 uppercase tracking-widest">
                                    Engine <span className="text-tekimax-orange">Features.</span>
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Provenance Traces", color: "blue" },
                                        { label: "Co-adaptive Guidance", color: "orange" },
                                        { label: "Sovereign Memory Context", color: "gold" },
                                        { label: "Human Sign-off Protocol", color: "teal" },
                                        { label: "Human vs AI Content Audit", color: "purple" },
                                        { label: "Co-Adaptive Task Routing", color: "green" }
                                    ].map((feature, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-3 rounded-sm bg-white/5 border border-white/10 flex items-center gap-3 group hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${feature.color === 'blue' ? 'bg-tekimax-blue' :
                                                feature.color === 'orange' ? 'bg-tekimax-orange' :
                                                    feature.color === 'gold' ? 'bg-tekimax-gold' :
                                                        feature.color === 'purple' ? 'bg-purple-500' :
                                                            'bg-tekimax-green'
                                                } `}></div>
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                                                {feature.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : currentSlide === 1 ? (
                        <motion.div
                            key="slide-1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative z-10 max-w-xl w-full md:h-full md:overflow-y-auto pr-0 md:pr-2 custom-scrollbar"
                            style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calc(100vh - 100px)' : 'none' }}
                        >


                            <div className="space-y-12">
                                <div className="mt-32">
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-sm backdrop-blur-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-tekimax-gold">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-px w-8 bg-tekimax-gold"></div>
                                            <h3 className="text-tekimax-gold font-bold uppercase tracking-widest text-xs">Active Pilot Projects</h3>
                                        </div>

                                        <p className="text-white/80 text-sm leading-relaxed mb-6 font-light">
                                            We validate our research in the real world. <strong>Adaptive Learning</strong> (internal) and <strong>Adaptive Startup LLC</strong> (external) are live pilot projects where we test our <strong>Human-AI collaboration</strong> hypotheses.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => setIsContactOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-tekimax-gold/10 text-tekimax-gold border border-tekimax-gold/50 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-tekimax-gold hover:text-black transition-all"
                                            >
                                                Request Private Beta
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Divider & Vertical Platforms Header */}
                                <div className="pt-8 border-t border-white/10">
                                    <h2 className="font-display font-bold text-lg text-white mb-6">Ongoing Research in <span className="text-tekimax-orange">Production.</span></h2>

                                    <div className="space-y-12">
                                        {/* Adaptive Learning */}
                                        <div className="flex flex-col sm:flex-row gap-6 items-start group">
                                            <a href="https://adaptivelearning.tekimax.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-32 h-32 flex-shrink-0 rounded-sm overflow-hidden border border-white/10 relative block">
                                                <img src="/images/hero-carousel-5.png" alt="Clinical Study" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-tekimax-blue/10 mix-blend-overlay"></div>
                                            </a>
                                            <div>
                                                <h3 className="text-tekimax-blue font-bold uppercase tracking-widest text-sm mb-2">Adaptive Neurodivergent Platform</h3>
                                                <div className="h-px w-12 bg-tekimax-blue/50 mb-4"></div>
                                                <p className="text-white/70 text-sm leading-relaxed mb-4">
                                                    Focuses on <strong>co-adaptive guidance</strong>, utilizing system context and user perspective to determine the precise type of guidance needed at any moment to facilitate learning.
                                                </p>
                                                <a href="https://adaptivelearning.tekimax.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-tekimax-blue transition-colors underline decoration-white/20 underline-offset-4 hover:decoration-tekimax-blue">
                                                    Visit Learning Platform
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>

                                        {/* Adaptive Ventures */}
                                        <div className="flex flex-col sm:flex-row gap-6 items-start group">
                                            <a href="https://adaptivestartup.io" target="_blank" rel="noopener noreferrer" className="w-full sm:w-32 h-32 flex-shrink-0 rounded-sm overflow-hidden border border-white/10 relative block">
                                                <img src="/images/IMG_0953.JPG" alt="Adaptive Ventures" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 bg-tekimax-orange/10 mix-blend-overlay"></div>
                                            </a>
                                            <div>
                                                <h3 className="text-tekimax-orange font-bold uppercase tracking-widest text-sm mb-2">Human-in-the-Loop Ventures</h3>
                                                <div className="h-px w-12 bg-tekimax-orange/50 mb-4"></div>
                                                <p className="text-white/70 text-sm leading-relaxed mb-4">
                                                    Researching <strong>integrated human feedback loops</strong>, measuring <strong>human agency</strong>, and developing methods to <strong>explain complex systems</strong> to diverse stakeholders.
                                                </p>
                                                <a href="https://adaptivestartup.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-tekimax-orange transition-colors underline decoration-white/20 underline-offset-4 hover:decoration-tekimax-orange">
                                                    Visit Adaptive Startup
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Quick Start (Moved to Right Column) */}
                                {/* <div className="pt-8 border-t border-white/10 md:hidden">
                                    <div className="mb-6">
                                        <h2 className="font-display font-bold text-lg text-white mb-2">Quick <span className="text-tekimax-gold">Start.</span></h2>
                                        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">
                                            Provision & Vibe Code in minutes
                                        </p>
                                        <div className="scale-90 origin-top-left mt-16">
                                            <CodeExampleStack items={sdkCodeExamples} />
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                        </motion.div>
                    ) : currentSlide === 2 ? (
                        <motion.div
                            key="slide-2"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative z-10 max-w-xl w-full md:h-full md:overflow-y-auto pr-0 md:pr-2 custom-scrollbar"
                            style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calc(100vh - 100px)' : 'none' }}
                        >
                            <div className="mt-24 md:mt-24 mb-12">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="inline-block px-3 py-1 rounded-full bg-tekimax-blue text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
                                        Our Research Focus
                                    </span>
                                </div>
                                <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-6 leading-tight">
                                    Co-Adaptive Systems & <span className="text-tekimax-orange">Intelligence Augmentation.</span>
                                </h2>
                                <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
                                    We are dedicated to solving the hard problems of human-AI interaction. We don't just ask abstract questions; we build systems that answer them in production environments.
                                </p>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h3 className="font-display font-bold text-xl text-white mb-6">
                                        Key <span className="text-tekimax-orange">Research Questions</span>
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-1 h-full min-h-[40px] bg-tekimax-blue/50 rounded-full"></div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">How DO we measure human agency?</h4>
                                                <p className="text-white/60 text-xs leading-relaxed">
                                                    Developing metrics to ensure AI augments rather than replaces human decision-making and autonomy.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-1 h-full min-h-[40px] bg-tekimax-orange/50 rounded-full"></div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">How can we explain complex systems?</h4>
                                                <p className="text-white/60 text-xs leading-relaxed">
                                                    Creating explainability stakeholders can trust, from technical engineers to non-technical founders.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-1 h-full min-h-[40px] bg-tekimax-gold/50 rounded-full"></div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">How do we integrate feedback?</h4>
                                                <p className="text-white/60 text-xs leading-relaxed">
                                                    Building feedback loops that seamlessly incorporate human insight back into the model for continuous learning.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="w-1 h-full min-h-[40px] bg-white/20 rounded-full"></div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">How do we manage co-adaptation?</h4>
                                                <p className="text-white/60 text-xs leading-relaxed">
                                                    Orchestrating the dynamic handoff between human agents and AI agents to maximize the strengths of both.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="slide-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative z-10 max-w-xl w-full"
                        >
                            <div className="flex items-center gap-4 mb-8 mt-24 md:mt-0">
                                <span className="px-4 py-1.5 rounded-full bg-tekimax-gold/20 text-tekimax-gold text-[11px] font-bold tracking-[0.2em] uppercase border border-tekimax-gold/30">
                                    Community & Impact
                                </span>
                            </div>

                            <h1 className="font-barlow text-3xl md:text-5xl text-white mb-6 leading-tight font-bold">
                                Hiring Our Heroes & <br />
                                <span className="text-tekimax-orange">Veteran Support.</span>
                            </h1>

                            <div className="space-y-6 text-white/80 font-light leading-relaxed mb-10 text-sm max-w-lg">
                                <p>
                                    We are proud to take the <strong>4+1 Pledge</strong> through <strong>Hiring Our Heroes</strong>, committing to hire military spouses and support our military veterans as they transition into the tech industry.
                                </p>
                                <p>
                                    Beyond hiring, we host <strong>Free Workshops</strong> every 3rd Wednesday of the month. We train veterans on <strong>LLMs</strong>, the new <strong>AI industry</strong>, and the fundamentals of <strong>Vibe Coding</strong> helping them set up development environments and launch new careers.
                                </p>
                            </div>

                            {/* Upcoming Event Card */}
                            <div className="mb-8 p-4 bg-tekimax-blue/5 border border-tekimax-blue/20 rounded-sm relative overflow-hidden group">

                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-sm bg-tekimax-blue/10 flex flex-col items-center justify-center border border-tekimax-blue/20">
                                            <span className="text-[10px] font-bold text-tekimax-blue leading-none">FEB</span>
                                            <span className="text-sm font-bold text-white leading-none mt-0.5">17</span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-1">Upcoming Webinar & Workshop</h3>
                                            <p className="text-tekimax-blue text-[10px] font-medium uppercase tracking-wider">Location: TBD</p>
                                        </div>
                                    </div>
                                    <p className="text-white/70 text-xs leading-relaxed">
                                        <strong>Topic:</strong> Installing and running local models on your computer. Setup your private AI environment from scratch. <strong>Bring your laptop.</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                                <div className="bg-white p-2 rounded-full shadow-xl flex-shrink-0">
                                    <img
                                        src="/images/BSF_41_Badge_Icon_Final_Dec23-150x150.webp"
                                        alt="Hiring Our Heroes Badge"
                                        className="h-16 w-auto"
                                    />
                                </div>
                                <a
                                    href="https://www.hiringourheroes.org/4plus1/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white text-black rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-tekimax-gold transition-all"
                                >
                                    Learn About 4+1 Pledge
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>



            {/* Right Column: Earth Image / Video / Code Stack */}
            <div className="hidden md:flex w-full md:w-1/2 relative h-auto md:min-h-screen bg-black overflow-hidden items-center justify-center">
                <AnimatePresence mode="wait">
                    {currentSlide === 0 ? (
                        <motion.div
                            key="right-slide-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-0"
                        >
                            <img
                                src="/images/risto-kokkonen-461OYLhAo04-unsplash.jpg"
                                alt="Background"
                                className="w-full h-full object-cover opacity-80"
                            />
                            {/* Overlay gradient to blend with left side */}
                            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-tekimax-navy via-transparent to-transparent opacity-80 md:opacity-100"></div>
                        </motion.div>
                    ) : currentSlide === 1 ? (
                        <motion.div
                            key="right-slide-1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative z-10 w-full flex items-center justify-center p-8 h-full"
                        >
                            {/* Video Background for Slide 1 */}

                            <div className="absolute inset-0 z-0">
                                <img
                                    src="/sappho-bakker-O_MksZMAQzM-unsplash.jpg"
                                    alt="Background"
                                    className="w-full h-full object-cover opacity-90"
                                />
                                <div className="absolute inset-0 bg-black/40"></div>
                            </div>
                        </motion.div>
                    ) : currentSlide === 2 ? (
                        // Slide 2 Visuals: Card Stack
                        <motion.div
                            key="visual-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative flex flex-col items-center justify-center p-12"
                        >
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="/images/google-deepmind-QEA9JMqOuVc-unsplash.jpg"
                                    alt="Earth Background"
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-black/60"></div>
                            </div>
                        </motion.div>
                    ) : (
                        // Slide 3 Visuals: Impact / Veteran
                        <motion.div
                            key="visual-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full relative flex flex-col items-center justify-center p-12"
                        >
                            <div className="absolute inset-0 z-0">
                                <img
                                    src="/images/64594def69c84c8dcfc0edd5_download.webp"
                                    alt="Impact Background"
                                    className="w-full h-full object-cover object-right opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-tekimax-navy via-tekimax-navy/80 to-transparent"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Legal Footer */}
            <div className="absolute bottom-4 left-6 z-50">
                <p className="text-[10px] text-white/30 font-light tracking-wide uppercase">
                    © 2026 TEKIMAX LLC. All Rights Reserved.
                    <span className="mx-2">|</span>
                    <a href="/terms" className="hover:text-white/60 transition-colors border-b border-white/20 hover:border-white/40">Terms & Conditions</a>
                    <span className="mx-2">|</span>
                    <a href="/privacy" className="hover:text-white/60 transition-colors border-b border-white/20 hover:border-white/40">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
};

export default UnderConstruction;
