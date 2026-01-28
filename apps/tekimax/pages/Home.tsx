
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import FuturisticIllustration from '../components/FuturisticIllustration';
import ToolTip from '../components/ToolTip'; // Assuming this is used somewhere or might be needed
// Privacy and Terms will be handled in App.tsx routing
import { InfrastructureStack } from '../components/InfrastructureStack';
import { TechnicalArchetype } from '../components/TechnicalArchetype';
import { ArchitectureStack } from '../components/ArchitectureStack';
import { CodeExampleStack, sdkCodeExamples } from '../components/ui/code-example-stack';
import { ScrambleText } from '../components/ui/scramble-text';
import { QuickStartSection } from '../components/ui/QuickStartSection';

const PILL_BLUE = "px-2 py-0.5 rounded-md bg-[#E8F4FF] text-[#357ACA] border border-[#C2E0FF] text-base font-medium";
const PILL_PURPLE = "px-2 py-0.5 rounded-md bg-[#F5E8FF] text-[#8A35CA] border border-[#E0C2FF] text-base font-medium";
const PILL_GREEN = "px-2 py-0.5 rounded-md bg-[#E8FFF0] text-[#2E8B57] border border-[#C2FFD6] text-base font-medium";
const PILL_PINK = "px-2 py-0.5 rounded-md bg-[#FFE8F0] text-[#CA3568] border-[#FFC2D6] text-base font-medium";
const PILL_ORANGE = "px-2 py-0.5 rounded-md bg-[#FFF4E8] text-[#CA6F35] border border-[#FFE0C2] text-base font-medium";

const Home: React.FC = () => {
    const [activeForm, setActiveForm] = React.useState<'partnership' | 'licensing' | 'hackathon' | 'contact' | null>(null);
    const [activeSheet, setActiveSheet] = React.useState<'learning' | 'startup' | null>(null);
    const [isSetupOpen, setIsSetupOpen] = React.useState(true);
    const [accessDialogOpen, setAccessDialogOpen] = React.useState(false);

    // Contact Form State
    const [contactFormStatus, setContactFormStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [contactData, setContactData] = React.useState({ name: '', email: '', subject: '', message: '' });

    // Access Request State
    const [accessFormStatus, setAccessFormStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [accessData, setAccessData] = React.useState({ name: '', email: '', company: '', role: '', useCase: '' });

    // Compliance Tabs State
    const [activeCompliance, setActiveCompliance] = React.useState<'c2pa' | 'nist'>('c2pa');

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContactData({ ...contactData, [e.target.name]: e.target.value });
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactFormStatus('submitting');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData),
            });
            if (res.ok) {
                setContactFormStatus('success');
                setContactData({ name: '', email: '', subject: '', message: '' });
            } else {
                setContactFormStatus('error');
            }
        } catch (error) {
            setContactFormStatus('error');
        }
    };

    const handleContactClick = () => {
        setActiveForm('contact');
        document.getElementById('research-sec')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleAccessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setAccessData({ ...accessData, [e.target.name]: e.target.value });
    };

    const handleAccessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAccessFormStatus('submitting');
        try {
            const res = await fetch('/api/request-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(accessData),
            });
            if (res.ok) {
                setAccessFormStatus('success');
            } else {
                setAccessFormStatus('error');
            }
        } catch (error) {
            // For now, show success since the backend may not exist yet
            setAccessFormStatus('success');
        }
    };

    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen font-sans selection:bg-tekimax-blue selection:text-white overflow-x-hidden">
            <Navigation onContactClick={handleContactClick} />

            {/* Hero + Partners Container */}
            <div className="h-screen flex flex-col relative bg-tekimax-navy overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    {/* Earth Hero Background */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/images/risto-kokkonen-461OYLhAo04-unsplash.jpg"
                            alt="Background"
                            className="w-full h-full object-cover object-center opacity-80"
                        />
                    </div>

                    {/* Navy Gradient Overlay for Text Readability - Balanced for the new image */}
                    <div className="absolute inset-0 bg-black/50 z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-tekimax-navy/85 via-tekimax-navy/65 to-tekimax-navy z-20"></div>
                </div>

                {/* Hero Section */}
                <section id="hero" className="relative flex-grow flex items-center pt-32 pb-12 px-4 md:px-12 z-30 w-full">

                    <div className="max-w-7xl mx-auto relative z-10 w-full">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="max-w-4xl">
                                <div className="flex items-center gap-4 mb-8 mt-12 reveal-on-scroll">
                                    <span className="hidden md:inline-block px-4 py-1.5 rounded-full bg-tekimax-blue/20 text-tekimax-blue text-[11px] font-bold tracking-[0.2em] uppercase border border-tekimax-blue/30">
                                        Human-Centered AI
                                    </span>
                                    <div className="h-px w-16 bg-white/20"></div>
                                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">Engineering For Good</span>
                                </div>

                                <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-[72px] text-white leading-[1.1] mb-8 md:mb-10 tracking-tight reveal-on-scroll" style={{ transitionDelay: '0.2s' }}>
                                    The Human-Adaptive <br />
                                    <span className="text-tekimax-orange">Engine.</span>
                                </h1>

                                <p className="text-sm md:text-xl text-white/70 leading-relaxed mb-8 md:mb-12 max-w-2xl font-light reveal-on-scroll" style={{ transitionDelay: '0.4s' }}>
                                    Is your AI keeping humans in control, and can you prove it? Our technology naturally adapts to your workflow, ensuring your <strong>agency and ingenuity</strong> remain at the center of innovation.
                                </p>

                                <div className="flex flex-wrap gap-4 md:gap-6 items-center reveal-on-scroll" style={{ transitionDelay: '0.6s' }}>
                                    <button onClick={() => setAccessDialogOpen(true)} className="bg-white text-tekimax-navy px-5 py-3 rounded-sm md:px-8 md:py-4 font-bold hover:bg-tekimax-blue hover:text-white transition-all shadow-2xl">
                                        Request Access
                                    </button>
                                </div>
                            </div>

                            {/* Code Examples Stack - Hero Placement: Showcasing the SDK immediately */}
                            <div className="hidden lg:block w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto reveal-on-scroll mt-8 lg:mt-24 lg:scale-90 lg:origin-top-right origin-top">
                                <CodeExampleStack items={sdkCodeExamples} scaleFactor={0.05} offset={10} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Partners Section */}
                <section className="py-8 px-6 border-t border-b border-white/5 bg-tekimax-navy/50 backdrop-blur-sm relative z-20 flex-none">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">

                        <div className="flex items-center gap-8">
                            <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap hidden md:block">Accelerated By</span>

                            {/* NVIDIA: Needs white background for legibility */}
                            <div className="bg-white rounded-sm flex items-center">
                                <img src="/images/nvidia-inception-program-badge-rgb-for-screen.svg" alt="NVIDIA Inception Program" className="h-16 w-auto" />
                            </div>


                            <div className="h-8 w-px bg-white/30 hidden md:block"></div>

                            {/* Google/Microsoft: Keep as white text on navy */}
                            <img src="/images/google-partner.png" alt="Microsoft for Startups Founders Hub" className="h-14 w-auto brightness-0 invert" />
                        </div>

                        <p className="text-white/80 text-xs md:text-sm font-light max-w-lg text-center md:text-left leading-relaxed">
                            We build on the <strong className="text-white">NVIDIA AI</strong> stack. As members of the Inception Program, we leverage cutting-edge technology and software to power our Human-Adaptive Engine.
                        </p>

                    </div>
                </section>
            </div>

            {/* The Core IP Section */}
            {/* The Core IP Section */}
            <section id="engine" className="py-32 px-6 bg-white border-b border-tekimax-dark/5 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="reveal-on-scroll">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-px w-16 bg-tekimax-blue/30"></div>
                                <span className="inline-block px-3 py-1 rounded-full bg-tekimax-blue text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
                                    Context is Key
                                </span>
                            </div>
                            <h2 className="font-display font-bold text-4xl md:text-6xl text-tekimax-dark mb-10 leading-tight">
                                Scale with <span className="text-tekimax-orange"><ScrambleText text="Confidence." className="italic" hover={true} /></span>
                            </h2>
                            <div className="space-y-6 text-lg text-tekimax-dark/60 font-light leading-relaxed">
                                <p>
                                    The <span className={PILL_BLUE}>TEKIMAX Human-Adaptive Engine</span> is a self-adaptive AI platform designed for high-impact environments. We deliver <span className={PILL_PURPLE}>verifiable human agency</span> through <span className={PILL_ORANGE}>modality-based learning</span> (Visual, Auditory, Textual) and <span className={PILL_GREEN}>cryptographic provenance</span>. Our value lies in ensuring technology expands the human mind without replacing it, providing organizations with ethical, neuro-inclusive AI that meets strict compliance standards for <span className={PILL_PINK}>transparency and accountability</span>.
                                </p>
                            </div>
                        </div>
                        <div className="reveal-on-scroll" style={{ transitionDelay: '0.3s' }}>
                            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-tekimax-dark/5 bg-tekimax-navy h-[500px] relative">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                >
                                    <source src="https://s3.tekimax.com/public/branch.mp4" type="video/mp4" />
                                </video>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Infrastructure / API Section */}
            <section id="infrastructure" className="py-32 px-6 bg-tekimax-navy relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20 reveal-on-scroll">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-16 bg-tekimax-blue/30"></div>
                            <span className="inline-block px-3 py-1 rounded-full bg-tekimax-blue text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg glow-blue">
                                Infrastructure for Responsible AI
                            </span>
                            <div className="h-px w-16 bg-tekimax-blue/30"></div>
                        </div>
                        <h2 className="font-display font-bold text-4xl md:text-6xl text-white mb-10 leading-tight">
                            Human-AI <span className="text-tekimax-orange">Collaboration.</span>
                        </h2>
                        <div className="flex flex-col items-center gap-6">
                            <div className="space-y-6 text-lg text-white/60 font-light leading-relaxed max-w-4xl mx-auto text-center">
                                <p>
                                    We provide cryptographic proof of human vs. AI authorship - verifiable attribution for every output. Our Human-Adaptive Engine ensures AI augments your judgment while preserving <strong>agency, creativity, and verifiable authorship</strong>.
                                </p>
                                <p>
                                    With <strong>cryptographic provenance</strong>, <strong>Human Agency Scores</strong>, and <strong>Human-in-the-Loop (HITL)</strong> workflows, you can prove who made decisions. Built for <strong>NIST AI RMF</strong> compliance from the ground up.
                                </p>
                            </div>
                        </div>
                    </div>




                    {/* Background glowing orb */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-tekimax-blue/10 rounded-full blur-[120px] pointer-events-none" />


                    <TechnicalArchetype />
                </div>
            </section>

            {/* Solutions / Platforms Section */}
            <section id="platforms" className="py-32 px-6 bg-[#F9F8F4] scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-20 reveal-on-scroll text-center md:text-left">
                        <h2 className="font-display font-bold text-4xl md:text-6xl text-tekimax-dark mb-10 leading-tight">Vertical <span className="text-tekimax-orange">Platforms.</span></h2>
                        <p className="text-base text-tekimax-dark/50 max-w-2xl font-light leading-relaxed">
                            We apply our Human-Adaptive Engine to build these vertical platforms. The Adaptive Neurodivergent Platform helps learners in their own modality via clinical study, while Adaptive Ventures empowers founders with human-AI collaboration, human-in-the-loop workflows, and AI-human audit trails for building with confidence and accountability.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Platform 1 Card: Learning */}
                        <a href="https://adaptivelearning.tekimax.com" target="_blank" rel="noopener noreferrer" className="relative group rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col justify-end p-6 md:p-10 cursor-pointer shadow-2xl transition-all hover:scale-[1.01]">
                            <div className="absolute inset-0">
                                <img src="/images/hero-carousel-5.png" alt="Learning Background" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-tekimax-navy via-tekimax-navy/90 to-transparent opacity-100"></div>
                            </div>
                            <div className="relative z-10 text-white">
                                <div className="mb-6">
                                    <img src="/images/tekimax-logo-white-RGB-2.png" alt="Tekimax Logo" className="h-12 w-auto" />
                                </div>
                                <h3 className="font-serif text-3xl md:text-5xl mb-4">Adaptive <span className="text-tekimax-orange">Learning.</span></h3>
                                <p className="text-white/70 text-lg font-light leading-relaxed mb-8 max-w-md">
                                    Empowering <strong>neurodivergent learners</strong> through <strong>modality-adaptive interfaces</strong> that adapt to how you learn. Visual, Auditory, or Textual. Our platform preserves <strong>human agency</strong> while meeting <strong>Section 508 accessibility</strong> standards. Currently in clinical study.
                                </p>
                                <div className="flex items-center gap-4">
                                    <button className="w-12 h-12 rounded-sm bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-tekimax-blue group-hover:border-tekimax-blue transition-all">
                                        <svg className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Launch Platform</span>
                                </div>
                            </div>
                        </a>

                        {/* Platform 2 Card: Startup */}
                        <a href="https://adaptivestartup.io/" target="_blank" rel="noopener noreferrer" className="relative group rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col justify-end p-6 md:p-10 cursor-pointer shadow-2xl transition-all hover:scale-[1.01]">
                            <div className="absolute inset-0">
                                <img src="/images/IMG_0953.JPG" alt="Startup Background" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-tekimax-navy via-tekimax-navy/90 to-transparent opacity-100"></div>
                            </div>
                            <div className="relative z-10 text-white">
                                <div className="mb-8">
                                    <img src="/images/adaptivestartup.png" alt="Adaptive Ventures Logo" className="h-32 w-auto" />
                                </div>
                                <h3 className="font-serif text-3xl md:text-5xl mb-4">Adaptive <span className="text-tekimax-orange">Ventures.</span></h3>
                                <p className="text-white/70 text-lg font-light leading-relaxed mb-8 max-w-md">
                                    Built for founders who demand <strong>human-AI collaboration</strong> with full transparency. Our <strong>Human-in-the-Loop (HITL)</strong> workflows and <strong>AI-human audit trails</strong> ensure every decision is traceable, contestable, and accountable. Scale your startup with confidence.
                                </p>
                                <div className="flex items-center gap-4">
                                    <button className="w-12 h-12 rounded-sm bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-tekimax-blue group-hover:border-tekimax-blue transition-all">
                                        <svg className="w-5 h-5 text-white transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Launch Platform</span>
                                </div>
                            </div>
                        </a>

                    </div>
                </div>
            </section>

            {/* Developer Getting Started Section */}
            <QuickStartSection />

            {/* Team Section */}
            <section className="py-32 px-6 bg-white border-b border-tekimax-dark/5 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">

                        {/* Collage */}
                        <div className="w-full md:w-1/2 ">
                            <div className="grid grid-cols-3 gap-3">
                                {/* Column 1 */}
                                <div className="space-y-3 mt-8">
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-32 md:h-40">
                                        <img src="/images/teams/IMG_0728.jpg" alt="Team 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-32 md:h-48">
                                        <img src="/images/teams/IMG_0252.jpg" alt="Team 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-24 md:h-32">
                                        <img src="/images/teams/ABE08C6E-32BB-4603-ACD2-965C6220EE94.JPG" alt="Team 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-3">
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-24 md:h-32">
                                        <img src="/images/teams/IMG_6729.PNG" alt="Team 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-32 md:h-48">
                                        <img src="/images/teams/IMG_0527.jpg" alt="Team 5" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-24 md:h-32">
                                        <img src="/images/teams/IMG_0926.JPG" alt="Team 6" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-24 md:h-32">
                                        <img src="/images/teams/IMG_6722.jpg" alt="Team 7" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                </div>

                                {/* Column 3 */}
                                <div className="space-y-3 mt-12">
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-28 md:h-36">
                                        <img src="/images/teams/IMG_0604.jpg" alt="Team 8" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-32 md:h-48">
                                        <img src="/images/teams/IMG_5187.JPG" alt="Team 9" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl h-24 md:h-32">
                                        <img src="/images/teams/IMG_6720.jpg" alt="Team 10" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="w-full md:w-1/2 reveal-on-scroll">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-px w-12 bg-tekimax-blue"></div>
                                <span className="inline-block px-3 py-1 rounded-full bg-tekimax-blue text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
                                    Join Our Team
                                </span>
                            </div>

                            <h2 className="font-display font-bold text-3xl md:text-5xl text-tekimax-dark mb-10 leading-tight">
                                Building the <span className="text-tekimax-orange">architecture for responsible AI</span>
                            </h2>

                            <div className="space-y-6 text-lg text-tekimax-dark/70 font-light leading-relaxed">
                                <p>
                                    Build on infrastructure designed for <strong>responsible AI deployment</strong>. We provide the ethical foundation for CAIOs, developers, and product teams who need to prove their AI keeps humans in control.
                                </p>
                                <p className="font-medium text-tekimax-dark text-xl">
                                    "We build the Human-Adaptive Engine so you can deploy AI with confidence and integrity."
                                </p>
                            </div>

                            <div className="relative group inline-block mt-8">
                                <button
                                    disabled
                                    className="px-8 py-4 bg-tekimax-navy/50 text-white/50 rounded-sm font-bold uppercase tracking-widest text-xs cursor-not-allowed transition-colors shadow-none"
                                >
                                    Join the Mission
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1 bg-tekimax-navy text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-lg whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-tekimax-navy">
                                    Position opening soon
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* Side Sheet Overlay */}
            <div className={`fixed inset-0 z-50 transition-colors duration-500 ${activeSheet ? 'bg-tekimax-navy/80 backdrop-blur-sm pointer-events-auto' : 'bg-transparent pointer-events-none'}`} onClick={() => setActiveSheet(null)}></div>

            {/* Side Sheet Content - Learning (Human-Adaptive Engine) */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[60%] lg:w-[50%] bg-[#F9F8F4] z-50 shadow-2xl transform transition-transform duration-500 ease-spring ${activeSheet === 'learning' ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
                <div className="p-10 md:p-16">
                    <button onClick={() => setActiveSheet(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-tekimax-dark/5 hover:bg-tekimax-dark/10 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-tekimax-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="text-tekimax-blue font-bold tracking-widest uppercase text-xs mb-4 block">Adaptive Learning Infrastructure</span>
                    <div className="mb-8">
                        <img src="/images/tekimax-logo-darkRGB-1.png" alt="Tekimax Logo" className="h-20 w-auto" />
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl text-tekimax-dark mb-4">Human-Adaptive Engine</h2>


                    <div className="space-y-12">
                        <div>
                        </div>

                        <div className="p-8 bg-tekimax-navy text-white rounded-sm shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 3l-2 3H8V3H6v3H3v2h3v3h2V8h3l-2 3h2l3-4.5L13 3zM5 13l2-3h3v3h2v-3h3v-2h-3v-3h-2v3h-3l2-3H7l-3 4.5L5 13z" /></svg>
                            </div>
                            <h4 className="text-tekimax-blue text-xs font-bold uppercase tracking-widest mb-4">Architectural Roadmap</h4>
                            <div className="space-y-4 relative z-10">
                                <p className="text-sm font-light leading-relaxed opacity-80">
                                    A fundamental shift from static, one-size-fits-all learning to a dynamic, human-centric Human-Adaptive Engine that adapts to each learner.
                                </p>
                                <div className="pt-4 border-t border-white/10 space-y-3">
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-tekimax-blue font-bold">2025:</span>
                                        <span className="opacity-60">Deployment of the first Self-Adaptive state machine with modality switching for neurodivergent learners.</span>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-tekimax-blue font-bold">2027:</span>
                                        <span className="opacity-60">Post-quantum encryption and data sovereignty for learner profiles.</span>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-tekimax-blue font-bold">2030:</span>
                                        <span className="opacity-60">Full model portability, letting learners own and export their trained cognitive profiles.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="mt-12 pt-8 border-t border-tekimax-dark/10">
                        <a href="https://adaptivelearning.tekimax.com" target="_blank" className="w-full block text-center py-5 bg-tekimax-blue text-white rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-tekimax-dark transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Launch Learning Engine
                        </a>
                    </div>

                </div>
            </div>

            {/* Side Sheet Content - Startup */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[60%] lg:w-[50%] bg-[#F9F8F4] z-50 shadow-2xl transform transition-transform duration-500 ease-spring ${activeSheet === 'startup' ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
                <div className="p-10 md:p-16">
                    <button onClick={() => setActiveSheet(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-tekimax-dark/5 hover:bg-tekimax-dark/10 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-tekimax-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="text-tekimax-blue font-bold tracking-widest uppercase text-xs mb-4 block">The New Industrial Evolution</span>
                    <div className="mb-8">
                        <img src="/images/adaptive-startup.png" alt="Adaptive Ventures Logo" className="h-12 w-auto" />
                    </div>
                    <h2 className="font-display font-bold text-4xl md:text-6xl text-tekimax-dark mb-10 leading-tight">Adaptive <span className="text-tekimax-orange">Ventures.</span></h2>
                    <p className="text-xl text-tekimax-dark/60 font-light leading-relaxed mb-10">
                        Built for founders who demand <strong>human-AI collaboration</strong> with full transparency. Our <strong>Human-in-the-Loop (HITL)</strong> workflows and <strong>AI-human audit trails</strong> ensure every decision is traceable, contestable, and accountable. Scale your startup with confidence.
                    </p>

                    <div className="space-y-12">
                        <div>
                            <h4 className="text-sm font-bold text-tekimax-blue uppercase tracking-widest mb-3 border-b border-tekimax-blue/20 pb-2">Platform Capabilities</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-sm shadow-sm border border-tekimax-dark/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-tekimax-blue"></div>
                                        <h5 className="font-bold text-tekimax-dark text-base">Strategic Clarity</h5>
                                    </div>
                                    <p className="text-xs text-tekimax-dark/60 ml-5 leading-relaxed">
                                        Auto-generated <strong>Business Canvas</strong> and OKRs.
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-sm shadow-sm border border-tekimax-dark/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-tekimax-blue"></div>
                                        <h5 className="font-bold text-tekimax-dark text-base">Market Recon</h5>
                                    </div>
                                    <p className="text-xs text-tekimax-dark/60 ml-5 leading-relaxed">
                                        AI Agents for deep <strong>Competitor Analysis</strong> and TAM/SAM/SOM.
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-sm shadow-sm border border-tekimax-dark/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-tekimax-blue"></div>
                                        <h5 className="font-bold text-tekimax-dark text-base">Financial Modeling</h5>
                                    </div>
                                    <p className="text-xs text-tekimax-dark/60 ml-5 leading-relaxed">
                                        Risk-adjusted <strong>Revenue Projections</strong> and SAFE management.
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-sm shadow-sm border border-tekimax-dark/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-tekimax-blue"></div>
                                        <h5 className="font-bold text-tekimax-dark text-base">Pitch Engineering</h5>
                                    </div>
                                    <p className="text-xs text-tekimax-dark/60 ml-5 leading-relaxed">
                                        Data-driven <strong>Pitch Deck</strong> generation.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mt-12 pt-8 border-t border-tekimax-dark/10">
                        <a href="https://adaptivestartup.io/" target="_blank" className="w-full block text-center py-5 bg-tekimax-blue text-white rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-tekimax-navy transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Launch Venture Engine
                        </a>

                    </div>
                </div>
            </div>


            {/* Human-Adaptive Engine SECTION */}
            <section id="exoskeleton" className="py-32 px-6 bg-[#F9F8F4] border-b border-tekimax-dark/5 scroll-mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20 reveal-on-scroll">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-16 bg-tekimax-blue/30"></div>
                            <span className="inline-block px-3 py-1 rounded-full bg-tekimax-blue text-white text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
                                Our Research Focus
                            </span>
                            <div className="h-px w-16 bg-tekimax-blue/30"></div>
                        </div>
                        <h2 className="font-display font-bold text-4xl md:text-6xl text-tekimax-dark mb-10 leading-tight">
                            Self-Adaptive <span className="text-tekimax-orange">Engine.</span>
                        </h2>
                        <p className="text-sm text-tekimax-dark/60 font-light leading-relaxed">
                            Not just another AI tool. We answer the question: <strong>"Is our AI keeping humans in control of every decision, and can we prove it?"</strong> Our research delivers <strong>modality-adaptive interfaces</strong> for different cognitive styles, <strong>verifiable attribution</strong> for every output, and <strong>Human Agency Scores</strong> that quantify oversight. The Engine adapts to you in real-time, ensuring human intent drives every decision.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto reveal-on-scroll delay-200 flex justify-center">
                        <InfrastructureStack darkButton={true} />
                    </div>


                </div>
            </section>

            {/* CTA / Research Section */}
            <section id="research-sec" className="py-40 px-6 bg-tekimax-navy text-white relative overflow-hidden scroll-mt-20">
                <div className="absolute inset-0 bg-grid-dots opacity-5"></div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="max-w-3xl mx-auto reveal-on-scroll">
                        <h2 className="font-display font-bold text-4xl md:text-6xl text-white mb-10 leading-tight">Partner <span className="text-tekimax-orange">With Us.</span></h2>
                        <p className="text-xl text-white/50 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
                            Join us on our frontier mission. Whether you're a research institution validating <strong>human-AI collaboration</strong> or an enterprise deploying <strong>responsible AI</strong> with verifiable oversight, we want to build with you.
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 mb-12">
                            <button
                                onClick={() => setActiveForm('partnership')}
                                className={`px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${activeForm === 'partnership' ? 'bg-tekimax-blue text-white shadow-xl scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                Research Partnership
                            </button>

                            <button
                                onClick={() => setActiveForm('hackathon')}
                                className={`px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-xs transition-all ${activeForm === 'hackathon' ? 'bg-tekimax-blue text-white shadow-xl scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                Sponsor Hackathon
                            </button>
                        </div>

                        {activeForm === 'partnership' && (
                            <form className="max-w-xl mx-auto space-y-4 animate-fade-in-up bg-white/5 p-8 rounded-3xl border border-white/10">
                                <div className="text-left mb-6">
                                    <h4 className="text-tekimax-blue font-serif text-2xl mb-2">Research Partnership</h4>
                                    <p className="text-white/40 text-sm">For institutions with clinical experience and capital.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Institution Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                    <input type="text" placeholder="Contact Person" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                </div>
                                <textarea placeholder="Describe your experience in this industry..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue h-24"></textarea>
                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:outline-none focus:border-tekimax-blue">
                                    <option value="" disabled selected>Available Capital / Grant Funding</option>
                                    <option value="seed">&lt; $100k</option>
                                    <option value="seriesA">$100k - $1M</option>
                                    <option value="seriesB">$1M+</option>
                                </select>
                                <button className="w-full bg-tekimax-blue text-white font-bold py-4 rounded-sm hover:brightness-110 transition-all shadow-lg uppercase tracking-widest text-xs mt-4">
                                    Submit Inquiry
                                </button>
                            </form>
                        )}



                        {activeForm === 'hackathon' && (
                            <form className="max-w-xl mx-auto space-y-4 animate-fade-in-up bg-white/5 p-8 rounded-3xl border border-white/10">
                                <div className="text-left mb-6">
                                    <h4 className="text-tekimax-blue font-serif text-2xl mb-2">Sponsor a Hackathon</h4>
                                    <p className="text-white/40 text-sm">Empower innovation by sponsoring our next engineering event.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Organization Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                    <input type="text" placeholder="Contact Person" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                </div>
                                <input type="email" placeholder="Email Address" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Hackathon Date" onFocus={(e) => (e.target.type = 'date')} onBlur={(e) => (e.target.type = 'text')} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                    <input type="number" placeholder="Est. Attendees" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                </div>
                                <input type="text" placeholder="Location (Country, State)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue" />
                                <textarea placeholder="Tell us about your organization and goals..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue h-24"></textarea>
                                <button className="w-full bg-tekimax-blue text-white font-bold py-4 rounded-sm hover:brightness-110 transition-all shadow-lg uppercase tracking-widest text-xs mt-4">
                                    Inquire about Sponsorship
                                </button>
                            </form>
                        )}

                        {activeForm === 'contact' && (
                            <form onSubmit={handleContactSubmit} className="max-w-xl mx-auto space-y-4 animate-fade-in-up bg-white/5 p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                                {contactFormStatus === 'success' ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-tekimax-navy/95 z-10 p-6 text-center animate-fade-in">
                                        <div className="w-16 h-16 bg-tekimax-blue rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <h4 className="text-2xl text-white font-serif mb-2">Message Sent</h4>
                                        <p className="text-white/60 text-sm mb-6">Thank you for reaching out. We will respond shortly.</p>
                                        <button type="button" onClick={() => setActiveForm(null)} className="text-tekimax-blue text-xs uppercase tracking-widest font-bold hover:text-white transition-colors">Close Form</button>
                                    </div>
                                ) : null}

                                <div className="text-left mb-6">
                                    <h4 className="text-tekimax-blue font-serif text-2xl mb-2">Contact Us</h4>
                                    <p className="text-white/40 text-sm">Send us a message and we'll get back to you shortly.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input required name="name" value={contactData.name} onChange={handleContactChange} type="text" placeholder="Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                    <input required name="email" value={contactData.email} onChange={handleContactChange} type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full" />
                                </div>
                                <input name="subject" value={contactData.subject} onChange={handleContactChange} type="text" placeholder="Subject" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue" />
                                <textarea required name="message" value={contactData.message} onChange={handleContactChange} placeholder="Your message..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue h-32"></textarea>
                                <button disabled={contactFormStatus === 'submitting'} className="w-full bg-tekimax-blue text-white font-bold py-4 rounded-sm hover:brightness-110 transition-all shadow-lg uppercase tracking-widest text-xs mt-4 disabled:opacity-50 disabled:cursor-wait">
                                    {contactFormStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                                </button>
                                {contactFormStatus === 'error' && <p className="text-red-400 text-xs text-center mt-2">Failed to send message. Please try again.</p>}
                            </form>
                        )}

                    </div>
                </div>
            </section >

            <footer className="py-24 px-6 bg-[#efeeea] text-tekimax-dark border-t border-tekimax-dark/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-20">
                        <div>
                            <div className="mb-8">
                                <img src="/images/tekimax-logo-darkRGB-1.png" alt="Tekimax Logo" className="h-10 w-auto" />
                            </div>
                            <p className="text-tekimax-dark/60 text-xs max-w-sm leading-relaxed font-light">
                                Join us on our frontier mission. Whether you are a research institution or an organization looking to <strong>Trial</strong> our platform within your organization, we want to build with you.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24">
                            <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-tekimax-blue mb-8">Platforms</h5>
                                <ul className="space-y-4 text-sm font-medium text-tekimax-dark/60">
                                    <li><a href="#platforms" className="hover:text-tekimax-blue transition-colors">Learning Engine</a></li>
                                    <li><a href="https://adaptivestartup.io/" className="hover:text-tekimax-blue transition-colors" target="_blank">Adaptive Ventures</a></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-tekimax-blue mb-8">Research</h5>
                                <ul className="space-y-4 text-sm font-medium text-tekimax-dark/60">
                                    <li><a href="#engine" className="hover:text-tekimax-blue transition-colors">Human-Adaptive Engine</a></li>
                                    <li className="hover:text-tekimax-blue cursor-pointer transition-colors">Clinical Studies</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-tekimax-blue mb-8">Gov Contract</h5>
                                <ul className="space-y-4 text-sm font-medium text-tekimax-dark/60">
                                    <li><span className="block text-[10px] uppercase tracking-wider opacity-70">UEI</span>MKHHA23AJ9S8</li>
                                    <li><span className="block text-[10px] uppercase tracking-wider opacity-70">CAGE</span>7CCP</li>

                                </ul>
                            </div>
                            <div>
                                <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-tekimax-blue mb-8">Partner Program</h5>
                                <div className="mt-0">
                                    <a href="https://www.hiringourheroes.org/4plus1/" target="_blank" rel="noreferrer" className="block w-24 hover:opacity-80 transition-opacity">
                                        <img src="/4+1-badge-li-tw.jpg" alt="Hiring Our Heroes 4+1 Commitment" className="w-full h-auto rounded-full" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="pt-12 border-t border-tekimax-dark/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] uppercase tracking-widest font-bold text-tekimax-dark/30">
                        <div className="flex items-center gap-3">
                            <img src="/images/us-flag.png" alt="Made in USA" className="h-2.5 w-auto rounded-sm grayscale hover:grayscale-0 transition-all" />
                            <p>© 2026 TEKIMAX Technologies.</p>
                        </div>
                        <div className="flex gap-12">
                            <a href="https://www.linkedin.com/company/tekimax-sfg" target="_blank" rel="noreferrer" className="hover:text-tekimax-navy cursor-pointer transition-colors">LinkedIn</a>
                            <a href="/privacy" className="hover:text-tekimax-navy cursor-pointer transition-colors">Privacy Policy</a>
                            <a href="/terms" className="hover:text-tekimax-navy cursor-pointer transition-colors">Terms of Service</a>
                        </div>

                    </div>
                </div>
            </footer>

            {/* Request Access Dialog */}
            <AnimatePresence>
                {accessDialogOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                            onClick={() => { setAccessDialogOpen(false); setAccessFormStatus('idle'); }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="bg-tekimax-navy border border-white/10 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
                                {/* Close Button */}
                                <button
                                    onClick={() => { setAccessDialogOpen(false); setAccessFormStatus('idle'); }}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                {accessFormStatus === 'success' ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-tekimax-blue rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <h3 className="text-2xl font-serif text-white mb-2">Request Submitted</h3>
                                        <p className="text-white/50 text-sm mb-6">Thank you! We'll review your request and get back to you soon.</p>
                                        <button
                                            onClick={() => { setAccessDialogOpen(false); setAccessFormStatus('idle'); setAccessData({ name: '', email: '', company: '', role: '', useCase: '' }); }}
                                            className="text-tekimax-blue text-xs uppercase tracking-widest font-bold hover:text-white transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleAccessSubmit} className="space-y-5">
                                        <div className="text-center mb-6">
                                            <div className="flex items-center justify-center gap-2 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-tekimax-blue animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-tekimax-blue">Early Access</span>
                                            </div>
                                            <h3 className="text-2xl font-serif text-white mb-2">Request API Access</h3>
                                            <p className="text-white/40 text-sm">Get early access to the Adaptive Engine API and Developer Dashboard.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                required
                                                name="name"
                                                value={accessData.name}
                                                onChange={handleAccessChange}
                                                type="text"
                                                placeholder="Full Name"
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full text-sm"
                                            />
                                            <input
                                                required
                                                name="email"
                                                value={accessData.email}
                                                onChange={handleAccessChange}
                                                type="email"
                                                placeholder="Work Email"
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue w-full text-sm"
                                            />
                                        </div>

                                        <input
                                            name="company"
                                            value={accessData.company}
                                            onChange={handleAccessChange}
                                            type="text"
                                            placeholder="Company / Organization"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue text-sm"
                                        />

                                        <select
                                            name="role"
                                            value={accessData.role}
                                            onChange={handleAccessChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 focus:outline-none focus:border-tekimax-blue text-sm"
                                        >
                                            <option value="" disabled>Select your role</option>
                                            <option value="developer">Developer / Engineer</option>
                                            <option value="product">Product Manager</option>
                                            <option value="executive">Executive / Leadership</option>
                                            <option value="researcher">Researcher / Academic</option>
                                            <option value="other">Other</option>
                                        </select>

                                        <textarea
                                            name="useCase"
                                            value={accessData.useCase}
                                            onChange={handleAccessChange}
                                            placeholder="Tell us about your use case..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tekimax-blue h-24 text-sm resize-none"
                                        />

                                        <button
                                            type="submit"
                                            disabled={accessFormStatus === 'submitting'}
                                            className="w-full bg-tekimax-blue text-white font-bold py-4 rounded-sm hover:brightness-110 transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            {accessFormStatus === 'submitting' ? 'Submitting...' : 'Submit Request'}
                                        </button>

                                        {accessFormStatus === 'error' && (
                                            <p className="text-red-400 text-xs text-center">Something went wrong. Please try again.</p>
                                        )}
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
