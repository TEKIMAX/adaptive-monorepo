import React, { useState, useEffect } from 'react';
import { Layout, Zap, Users, ArrowRight, CheckCircle2, ShieldCheck, PieChart, Target, Rocket, Globe, FileText, Lock, LineChart, Menu, X, MessageSquare, Presentation, ChevronDown, ExternalLink, Activity, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';
import { PaymentComingSoon } from './paymentComingSoon';
import { GlobeViz } from './GlobeViz';
import { IdeationTeaser } from './Ideation/IdeationTeaser';
import { Helmet as BaseHelmet } from 'react-helmet-async';
const Helmet = BaseHelmet as any;
import AttributionBadge from './AttributionBadge';
import { open } from '@tauri-apps/plugin-shell';

interface LandingPageProps {
   onLogin: () => void;
}

const features = [
   {
      id: 'ai',
      title: 'Adaptive AI & Compliance',
      desc: 'Audit trails and cryptographic sign-off of actions.',
      longDesc: 'The Adaptive Engine ensures institutional-grade compliance through human-driven audit trails. Every AI-assisted decision is cryptographically signed off by you, building an immutable record of venture integrity.',
      image: '/images/milad-fakurian-F4qy_1tAFfs-unsplash.jpg',
      screenshot: '/images/nobel-chat.png',
      align: 'object-center',
      details: [
         'Cryptographic action sign-off',
         'Human-driven audit trails',
         'Institutional-grade compliance',
         'Strategic drift monitoring'
      ]
   },
   {
      id: 'overview',
      title: 'Startup Overview',
      desc: 'Your central command center for the entire journey.',
      longDesc: 'PillarOS provides a comprehensive dashboard that aggregates all your startup metrics, tasks, and strategic documents into a single source of truth. Designed for founders who need to move fast with precision.',
      image: '/images/IMG_0953.JPG',
      screenshot: '/images/hero-carousel-1.png',
      align: 'object-center',
      position: '70% center',
      details: [
         'Real-time health monitoring of business goals',
         'Integrated task management and Eisenhower priority matrix',
         'Direct access to all research and strategy documents',
         'Team collaboration and activity tracking'
      ]
   },
   {
      id: 'market',
      title: 'Market Intelligence',
      desc: 'Validate TAM, SAM, SOM with autonomous agents.',
      longDesc: 'Our autonomous agents scour global datasets to provide you with accurate Top-Down and Bottom-Up market sizing. Don\'t guess your market potential; quantify it with evidence.',
      image: '/images/working_women.png',
      screenshot: '/images/marketresearch.png',
      align: 'object-top',
      details: [
         'Autonomous TAM/SAM/SOM calculation',
         'Real-time competitor tracking and matrix generation',
         'Customer discovery interview logging and AI analysis',
         'Dynamic market sizing reports'
      ]
   },
   {
      id: 'strategy',
      title: 'Strategic Planning',
      desc: 'Iterate on your Business Model Canvas in real-time.',
      longDesc: 'Move beyond static PDF business plans. Use our interactive Business Model Canvas and dynamic roadmaps to pivot and iterate your strategy as you learn and grow.',
      image: '/OfficeDiscussion.png',
      screenshot: '/images/canvas.png',
      align: 'object-center',
      details: [
         'Interactive Business Model Canvas',
         'Agile product roadmapping',
         'Goal setting with OKR frameworks',
         'Integrated whiteboards and ideation tools'
      ]
   }
];
export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
   const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adaptivestartup.io';
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [isScrolled, setIsScrolled] = useState(false);
   const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
   const [activeAccordion, setActiveAccordion] = useState<number | null>(0);
   const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

   // Trial Request Dialog State
   const [showTrialDialog, setShowTrialDialog] = useState(false);
   const [trialForm, setTrialForm] = useState({ name: '', email: '', company: '', message: '' });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitSuccess, setSubmitSuccess] = useState(false);

   const handleTrialSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulate API call - in production, this would call a backend endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitting(false);
      setSubmitSuccess(true);
      // Reset after 3 seconds
      setTimeout(() => {
         setShowTrialDialog(false);
         setSubmitSuccess(false);
         setTrialForm({ name: '', email: '', company: '', message: '' });
      }, 3000);
   };

   const mobileNavItems = [
      { id: 'problem', label: 'The Problem' },
      { id: 'solution', label: 'Philosophy' },
      { id: 'mission', label: 'Mission' },
      { id: 'features', label: 'Features' },
      { id: 'pricing', label: 'Pricing' },
   ];

   useEffect(() => {
      const handleScroll = () => {
         // In a scrollable div, we check the div's scrollTop, but since we are changing to handle scroll internally
         // we might need to attach this to the ref or the window if it propagates.
         // However, with h-screen overflow-y-auto, the window scroll event might not fire.
         // We'll attach a listener to the container.
      };
      // window.addEventListener('scroll', handleScroll); // This won't work well with overflow container
      // return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   // Handle external links
   useEffect(() => {
      const handleLinkClick = async (e: MouseEvent) => {
         const target = (e.target as HTMLElement).closest('a');
         if (target && target.href && target.href.startsWith('http') && !target.href.startsWith(window.location.origin)) {
            e.preventDefault();
            await open(target.href);
         }
      };

      document.addEventListener('click', handleLinkClick);
      return () => document.removeEventListener('click', handleLinkClick);
   }, []);

   const scrollToSection = (id: string) => {
      const element = document.getElementById(id);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth' });
         setIsMobileMenuOpen(false);
      }
   };

   // ... items ...

   return (
      <div className="h-screen w-full bg-[#F9F8F4] font-sans text-stone-900 selection:bg-nobel-gold selection:text-white overflow-y-auto overflow-x-hidden" onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}>
         <Helmet>
            <title>Adaptive Startup | AI-Powered Guidance for Early-Stage Founders</title>
            <meta name="description" content="Turn chaos into clarity with AI. Adaptive Startup helps early-stage founders navigate their entrepreneurial journey - from first idea to funded startup. AI-powered market research, strategy, and fundraising tools." />
            <meta name="keywords" content="startup, founder, AI assistant, early-stage, business plan, lean canvas, market research, fundraising, pitch deck, entrepreneurial journey, turn chaos into clarity" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:title" content="Adaptive Startup | Turn Chaos Into Clarity" />
            <meta property="og:description" content="AI-powered guidance for early-stage founders. Turn chaos into clarity - from first idea to funded startup." />
            <meta property="og:image" content={`${siteUrl}/images/onboarding-cover.png`} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={siteUrl} />
            <meta property="twitter:title" content="Adaptive Startup | Navigate Uncertainty, Idea to Proof" />
            <meta property="twitter:description" content="AI-powered guidance for early-stage founders. Navigate your entrepreneurial journey with clarity and confidence." />
            <meta property="twitter:image" content={`${siteUrl}/images/onboarding-cover.png`} />
         </Helmet>

         {/* --- NAVIGATION BAR --- */}
         <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'h-20 bg-[#F9F8F4]/80 backdrop-blur-md border-b border-stone-200/50' : 'h-24 bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between">

               {/* Logo */}
               <div className="flex-shrink-0">
                  <Logo className="flex items-center gap-3" imageClassName="h-20 w-auto rounded" textClassName="font-serif font-bold text-xl tracking-wide text-stone-900" src="/images/black-logo.png" />
               </div>

               {/* Desktop Navigation - Centered */}
               <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
                  <a href="https://tekimax.com" className="hover:text-stone-900 transition-colors">Home</a>
                  <a href="#problem" className="hover:text-stone-900 transition-colors">The Problem</a>
                  <a href="#solution" className="hover:text-stone-900 transition-colors">Philosophy</a>
                  <a href="#mission" className="hover:text-stone-900 transition-colors">Mission</a>
                  <a href="#features" className="hover:text-stone-900 transition-colors">Features</a>
                  <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
               </div>

               {/* Right Actions */}
               <div className="hidden md:flex items-center gap-4">
                  <button onClick={() => setShowTrialDialog(true)} className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-sm font-bold hover:bg-nobel-gold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                     Request Trial
                  </button>
               </div>

               {/* Mobile Menu Toggle */}
               <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-stone-900"
               >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
               <div className="fixed inset-0 top-20 bg-[#F9F8F4] z-40 flex flex-col p-8 pointer-events-auto md:hidden animate-in fade-in slide-in-from-top-10 duration-300 border-t border-stone-200">
                  <div className="flex flex-col gap-6 text-xl font-serif font-bold text-stone-900">
                     <a href="https://tekimax.com" className="text-left py-2 hover:text-nobel-gold transition-colors">Home</a>
                     {mobileNavItems.map((item) => (
                        <button
                           key={item.id}
                           onClick={() => scrollToSection(item.id)}
                           className="text-left py-2 hover:text-nobel-gold transition-colors"
                        >
                           {item.label}
                        </button>
                     ))}
                     <hr className="border-stone-200" />
                     <button
                        onClick={() => { onLogin(); setIsMobileMenuOpen(false); }}
                        className="text-left py-2 hover:text-nobel-gold transition-colors"
                     >
                        Beta V1
                     </button>
                     <button
                        onClick={() => { setShowTrialDialog(true); setIsMobileMenuOpen(false); }}
                        className="mt-2 px-8 py-4 bg-stone-900 text-white rounded-full text-lg font-bold hover:bg-nobel-gold transition-colors shadow-xl text-center"
                     >
                        Request Trial
                     </button>
                  </div>
               </div>
            )}
         </nav>



         {/* --- HERO SECTION --- */}
         <header className="relative w-full min-h-[80vh] flex items-center justify-center p-6 overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-stone-900">


               {/* Overlays */}
               <div className="absolute inset-0 bg-white/90"></div>
               <div className="absolute inset-0 bg-[#F9F8F4]/20 backdrop-blur-[8px] mix-blend-overlay"></div>
               <div className="absolute inset-0 bg-gradient-to-b from-[#F9F8F4]/60 via-transparent to-[#F9F8F4]"></div>
               <div className="absolute inset-0 canvas-pattern opacity-10" style={{ backgroundSize: '24px 24px' }}></div>

               {/* Background Decor */}
               <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-nobel-gold/15 rounded-full blur-[120px] animate-blob"></div>
               <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-stone-900/5 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

               {/* Left Column: Content */}
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center lg:text-left pt-24 md:pt-0">

                  {/* Beta V1 Badge */}
                  <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-stone-900 text-white border border-nobel-gold/30">
                     <span className="text-xs font-bold tracking-widest text-nobel-gold uppercase">Beta V1</span>
                  </div>

                  <h1 className="font-serif text-6xl md:text-7xl lg:text-7xl text-stone-900 leading-[1.1] tracking-tight">
                     The Operating System for <span className="text-nobel-gold font-bold">0 to 1.</span>
                  </h1>

                  <p className="text-lg md:text-xl text-stone-600 leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                     Validate your market, audit your strategy, and execute your vision with context-aware AI. A unified workspace for early-stage founders.
                  </p>

                  <div className="flex flex-col items-center lg:items-start gap-4 pt-4">
                     <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4">
                        <button
                           onClick={() => setShowTrialDialog(true)}
                           className="group relative px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-base uppercase tracking-widest hover:bg-nobel-gold transition-all shadow-xl hover:shadow-[#D4AF37]/40 hover:-translate-y-1 flex items-center justify-center gap-3 overflow-hidden"
                        >
                           <span className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                           <Rocket className="w-5 h-5 relative z-10" />
                           <span className="relative z-10">Request Trial</span>
                           <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>





               </div>


               {/* Right Column: Logo */}
               <div className="relative hidden lg:block w-full overflow-hidden">
                  <div className="flex items-center justify-end h-full w-full">
                     <img
                        src="/images/hero-logo.png"
                        alt="Adaptive Startup"
                        className="w-full max-w-2xl object-contain"
                     />
                  </div>
                  {/* Abstract background glow behind the grid */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-stone-100/50 to-transparent rounded-full -z-10 blur-3xl pointer-events-none"></div>
               </div>
            </div>
         </header>
         {/* Horizontal Image Scroller */}
         <div className="w-screen relative left-[calc(-50vw+50%)] mb-12 -mt-24 overflow-hidden">
            {/* Bottom Layer: Grayscale */}
            <div className="flex gap-4 animate-scroll-right w-max">
               {[
                  "/images/hero-1.jpg", "/images/hero-carousel-1.png",
                  "/images/hero-2.jpg", "/images/hero-carousel-2.png",
                  "/images/IMG_0953.JPG", "/images/hero-carousel-3.png",
                  "/images/hero-3.jpg", "/images/hero-carousel-4.png",
                  "/images/hero-7.png", "/images/hero-carousel-5.png",
                  "/images/hero-4.jpg",
                  // Repeat for infinite scroll
                  "/images/hero-1.jpg", "/images/hero-carousel-1.png",
                  "/images/hero-2.jpg", "/images/hero-carousel-2.png",
                  "/images/IMG_0953.JPG", "/images/hero-carousel-3.png",
                  "/images/hero-3.jpg", "/images/hero-carousel-4.png",
                  "/images/hero-7.png", "/images/hero-carousel-5.png",
                  "/images/hero-4.jpg",
                  // Repeat again
                  "/images/hero-1.jpg", "/images/hero-carousel-1.png",
                  "/images/hero-2.jpg", "/images/hero-carousel-2.png",
                  "/images/IMG_0953.JPG", "/images/hero-carousel-3.png",
                  "/images/hero-3.jpg", "/images/hero-carousel-4.png",
                  "/images/hero-7.png", "/images/hero-carousel-5.png",
                  "/images/hero-4.jpg"
               ].map((src, i) => (
                  <div key={i} className="w-48 h-64 flex-shrink-0 transition-all duration-500 rounded-lg overflow-hidden border border-white/20">
                     <img src={src} alt="Startup Journey" className="w-full h-full object-cover" />
                  </div>
               ))}
            </div>
         </div>
         {/* --- GOLD BAR --- */}
         <div className="w-full bg-[#C5A065] py-4">
            <p className="text-center text-white text-sm font-bold uppercase tracking-[0.3em]">Structure for the uncertainty of Day One.</p>
         </div>

         {/* --- THE PROBLEM SECTION (New) --- */}
         <section id="problem" className="py-24 px-6 md:px-12 bg-stone-900 text-white border-b border-stone-800">
            <div className="max-w-7xl mx-auto">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                     <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-[#C5A065]/10 border border-[#C5A065]/20 backdrop-blur-sm">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#C5A065] animate-pulse"></span>
                           <span className="text-xs font-bold tracking-widest text-[#C5A065]">THE REALITY</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-serif text-white mb-6 leading-tight">
                           Building is faster than ever. <br />
                           <span className="text-stone-500">But clarity is harder to find.</span>
                        </h2>
                        <p className="text-lg text-stone-400 leading-relaxed font-light mb-8">
                           AI has made creation accessible to everyone. You can ship code or design a product in seconds. But speed without strategy creates noise.
                        </p>
                        <p className="text-lg text-stone-400 leading-relaxed font-light mb-8">
                           With <strong className="text-white">72.9 million independent workers in 2025</strong> in the US alone and a massive influx of AI-first companies, the market is crowded. Founders remain stuck in a loop of endless iteration without validation, missing the business fundamentals needed to survive.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-8 mt-12 border-t border-stone-800 pt-8">
                           <div>
                              <div className="text-3xl font-serif text-white mb-1">72.9 M</div>
                              <div className="text-xs text-stone-500 uppercase tracking-widest mb-1">Total Independents (2025)</div>
                              <a href="https://www.mbopartners.com/state-of-independence/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#C5A065]/10 text-[#C5A065] border border-[#C5A065]/20 hover:bg-[#C5A065]/20 transition-colors">
                                 Source: MBO Partners
                                 <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                           </div>
                           <div>
                              <div className="text-3xl font-serif text-white mb-1">42%</div>
                              <div className="text-xs text-stone-500 uppercase tracking-widest mb-1">AI Startup Growth</div>
                              <a href="https://stripe.com/blog/stripe-atlas-startups-in-2025-year-in-review" target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#C5A065]/10 text-[#C5A065] border border-[#C5A065]/20 hover:bg-[#C5A065]/20 transition-colors">
                                 Source: Stripe Atlas
                                 <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                           </div>

                        </div>
                     </div>
                  </div>

                  <div className="relative h-[400px] w-full hidden lg:block">
                     {/* Chaos Visualization - Floating Cards */}
                     <div className="absolute top-10 left-10 z-10">
                        <div className="bg-[#1c1917] p-4 rounded-lg border border-stone-700 shadow-2xl transform -rotate-6 w-64 hover:rotate-0 transition-transform duration-500">
                           <div className="flex items-center gap-3 text-red-400 mb-2">
                              <X className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">The Trap</span>
                           </div>
                           <p className="text-white font-serif text-lg leading-snug">"I built the product in a weekend, but I have no idea who my customer is."</p>
                        </div>
                     </div>

                     <div className="absolute top-0 right-0 z-20">
                        <div className="bg-stone-800/80 backdrop-blur-md p-4 rounded-lg border border-stone-600 shadow-xl transform rotate-3 w-56 hover:rotate-0 transition-transform duration-500">
                           <p className="text-stone-300 text-sm">Endless ideation loops...</p>
                           <div className="mt-2 h-1 w-full bg-stone-700 rounded-full overflow-hidden">
                              <div className="h-full w-1/3 bg-stone-500 animate-pulse"></div>
                           </div>
                        </div>
                     </div>

                     <div className="absolute bottom-20 left-20 z-30">
                        <div className="bg-[#2a2925] p-5 rounded-lg border border-nobel-gold/30 shadow-2xl transform -rotate-3 w-72 hover:rotate-0 transition-transform duration-500">
                           <div className="flex items-center justify-between mb-3">
                              <span className="text-stone-500 text-xs uppercase">Market Research</span>
                              <span className="text-red-400 text-xs">Missing</span>
                           </div>
                           <div className="space-y-2">
                              <div className="h-2 w-3/4 bg-stone-700 rounded-full"></div>
                              <div className="h-2 w-1/2 bg-stone-700 rounded-full"></div>
                           </div>
                        </div>
                     </div>

                     <div className="absolute bottom-40 right-12 z-0 opacity-60">
                        <div className="bg-stone-900 p-4 rounded-lg border border-stone-800 transform rotate-12 w-48">
                           <p className="text-stone-600 text-xs italic">Is this scalable?</p>
                           <p className="text-stone-600 text-xs italic mt-1">Competitor analysis?</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* --- EXPLORATION SECTION: Horizontal Slices --- */}
         <section className="relative w-full min-h-[80vh] lg:h-[80vh] bg-stone-900 border-b-4 border-nobel-gold py-12 group/exploration overflow-hidden">
            <div className="h-full flex flex-col lg:flex-row">
               {features.map((feature, i) => (
                  <div
                     key={feature.id}
                     onMouseEnter={() => setSelectedFeature(feature)}
                     onMouseLeave={() => setSelectedFeature(null)}
                     onClick={() => setSelectedFeature(selectedFeature?.id === feature.id ? null : feature)}
                     className={`relative flex-1 min-h-[25vh] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group border-b lg:border-b-0 lg:border-r border-stone-800 last:border-0 overflow-hidden cursor-pointer ${selectedFeature?.id === feature.id ? 'flex-[3] lg:flex-[4]' : 'flex-1'
                        }`}
                  >
                     <img
                        src={feature.image}
                        alt={feature.title}
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 ${feature.align || 'object-center'}`}
                        style={feature.position ? { objectPosition: feature.position } : {}}
                     />
                     {/* Overlay: Intense bottom-to-top gradient */}
                     <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700" />

                     {/* Content Container */}
                     <div className="absolute inset-x-0 bottom-0 p-6 lg:p-12 flex flex-col justify-end">
                        {/* Number Indicator */}
                        <div className="text-stone-500 font-mono text-xs mb-2 lg:mb-4">
                           {i.toString().padStart(2, '0')}
                        </div>

                        <h3 className="font-serif text-xl lg:text-4xl text-white mb-4 whitespace-nowrap group-hover:text-nobel-gold transition-colors duration-300">
                           {feature.title}
                        </h3>

                        <div className={`transition-all duration-700 overflow-hidden ${selectedFeature?.id === feature.id ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                           }`}>
                           <p className="text-stone-300 text-sm lg:text-lg leading-relaxed max-w-xl mb-6 font-light">
                              {feature.desc}
                           </p>
                           <div className="flex flex-wrap gap-2 lg:gap-3">
                              {feature.details.map((detail, idx) => (
                                 <span key={idx} className="px-3 py-1.5 rounded-full bg-white text-stone-900 font-bold text-[10px] lg:text-xs backdrop-blur-sm whitespace-nowrap shadow-sm">
                                    {detail}
                                 </span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>


         {/* --- DOCUMENTS SECTION (Moved Up) --- */}
         {/* <section id="documents" className="py-24 px-6 md:px-12 bg-stone-900 border-t border-stone-800">
            <div className="max-w-7xl mx-auto">
               <div
                  onClick={onLogin}
                  className="rounded-2xl bg-stone-900 shadow-xl overflow-hidden border border-nobel-gold flex flex-col md:flex-row relative group cursor-pointer transform hover:scale-[1.01] transition-all duration-300"
               >
                  <div className="p-8 md:p-12 flex-1 flex flex-col justify-center relative z-10">
                     <h3 className="font-serif text-3xl md:text-4xl text-white mb-4">Human-AI Cooperation</h3>
                     <p className="text-stone-400 mb-8 max-w-xl leading-relaxed">
                        We believe the future of entrepreneurship is <strong>Human-Centered AI</strong>. Our platform doesn't just generate content; it audits the synergy between machine intelligence and founder intuition.
                     </p>

                     <div className="space-y-6 mb-10">
                        <div className="flex items-start gap-4">
                           <AttributionBadge type="AI Assisted" size="sm" className="mt-1 shrink-0" />
                           <p className="text-sm text-stone-300 leading-relaxed">
                              <strong>Foundational Speed:</strong> Represents the high-velocity intelligence of our AI Engine. AI handles the heavy lifting by researching markets, drafting models, and analyzing patterns to give you an immediate head start.
                           </p>
                        </div>
                        <div className="flex items-start gap-4">
                           <AttributionBadge type="Human Edited" size="sm" className="mt-1 shrink-0" />
                           <p className="text-sm text-stone-300 leading-relaxed">
                              <strong>Venture Integrity:</strong> The seal of founder authority. This represents your critical oversight where you refine, verify, and inject your unique strategic edge to ensure the output is authentically yours.
                           </p>
                        </div>
                     </div>

                  </div>
                  <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-auto overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-l from-transparent to-stone-900/90 z-10"></div>
                     <img
                        src="/images/hero-carousel-5.png"
                        alt="Documents"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                     />
                     <div className="absolute inset-0 bg-nobel-gold/10 mix-blend-overlay"></div>
                  </div>
               </div>
            </div>
         </section> */}

         {/* --- AI CHAT SECTION --- */}
         <section className="py-24 px-6 md:px-12 bg-[#F9F8F4] border-t border-stone-200">
            <div className="max-w-7xl mx-auto">
               <div className="flex flex-col lg:flex-row items-center gap-16">
                  {/* Left: Image */}
                  <div className="lg:w-1/2 w-full order-2 lg:order-1">
                     <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-nobel-gold to-stone-400 rounded-2xl blur opacity-20"></div>
                        <div className="relative bg-white p-2 rounded-2xl shadow-2xl border border-stone-200 transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500">
                           <img
                              src="/images/nobel-chat.png"
                              alt="Nobel AI Chat Interface"
                              className="w-full h-auto rounded-xl"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Right: Content */}
                  <div className="lg:w-1/2 space-y-8 order-1 lg:order-2">
                     <div className="inline-block px-3 py-1 rounded-full bg-stone-900 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
                        Adaptive AI Engine
                     </div>
                     <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight">
                        AI that speaks <br />
                        <span className="text-nobel-gold">Your Venture.</span>
                     </h2>
                     <p className="text-lg text-stone-600 leading-relaxed font-light">
                        Generic AI tools lack the one thing a founder needs most: <strong>Context.</strong> The Adaptive Engine lives inside your project, connecting every document, canvas update, and market insight into a unified intelligence core.
                     </p>

                     <div className="grid grid-cols-1 gap-4">
                        <div className="group relative p-6 bg-stone-900 rounded-2xl border border-stone-800 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-nobel-gold/50">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-nobel-gold/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-nobel-gold/20 transition-colors"></div>

                           <div className="relative z-10 flex items-start gap-5">
                              <div className="p-3 bg-nobel-gold/10 rounded-xl border border-nobel-gold/20 shrink-0 group-hover:bg-nobel-gold/20 transition-colors">
                                 <ShieldCheck className="w-6 h-6 text-nobel-gold" />
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-serif font-bold text-white text-lg">Cryptographic Audit Trail</h4>
                                    <div className="w-1.5 h-1.5 rounded-full bg-nobel-gold animate-pulse"></div>
                                 </div>
                                 <p className="text-sm text-stone-400 leading-relaxed font-light">
                                    Every strategic action requires your <strong>cryptographic sign-off</strong>. We maintain an immutable audit trail of human-driven decisions, ensuring institutional compliance from Day One.
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="group relative p-6 bg-white rounded-2xl border border-stone-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-nobel-gold/30 overflow-hidden">
                           <div className="absolute bottom-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-8 -mb-8"></div>

                           <div className="relative z-10 flex items-start gap-5">
                              <div className="p-3 bg-stone-900 rounded-xl shrink-0 group-hover:bg-nobel-gold transition-colors duration-300">
                                 <Activity className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                 <h4 className="font-serif font-bold text-stone-900 text-lg mb-2">Human-AI Integrity Compliance</h4>
                                 <p className="text-sm text-stone-500 leading-relaxed font-light">
                                    Our engine monitors for <strong>strategic drift</strong>, but only you can pull the trigger. We blend machine intelligence with human oversight to meet the rigorous standards of institutional due diligence.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4">
                        <button
                           onClick={onLogin}
                           className="flex items-center gap-2 text-stone-900 font-bold uppercase tracking-widest text-xs group"
                        >
                           Explore Intelligence Core
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <div className="mt-6 text-[10px] font-mono text-stone-400 uppercase tracking-widest opacity-70">
                           Powered by <span className="text-nobel-gold font-bold">Tekimax Adaptive Engine</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* --- FEATURES GRID --- */}
         {/* <section id="features" className="py-24 px-6 md:px-12 bg-white border-t border-stone-100">
            <div className="max-w-7xl mx-auto">
               <div className="text-center mb-20">
                  <h2 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6">AI-Powered Tools for Every Stage</h2>
                  <p className="text-lg text-stone-500 max-w-2xl mx-auto">From scattered ideas to clear execution. Organization is valuable, but real-time adaptability is the game-changer. A complete suite where AI augments your journey. These are just some of the tools for market research, competitor analysis, and financial modeling - <span className="text-nobel-gold font-semibold">so you can focus on building.</span></p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                     {
                        icon: <MessageSquare />,
                        title: "AI Business Consultant",
                        desc: "Navigate complex business challenges with an AI that understands your project context. From financial modeling to document generation, expert help is just a message away.",
                        image: "/images/chat.png"
                     },
                     {
                        icon: <FileText />,
                        title: "Business Plan Builder",
                        desc: "A comprehensive starting template to start yoru business plan. Generate a professional structure to organize your vision.",
                        image: "/images/businessplan.png"
                     },
                     {
                        icon: <Presentation />,
                        title: "Pitch Deck Generator",
                        desc: "Turn your business plan into an investor-ready pitch deck. Automatically generate slides that tell your story.",
                        image: "/images/pitchDeck.png"
                     },
                     {
                        icon: <Globe />,
                        title: "Market Deep Dive",
                        desc: "Instant, AI-powered analysis of your TAM, SAM, and SOM. Validate your market opportunity in minutes, not weeks.",
                        image: "/images/marketresearch.png"
                     },
                     {
                        icon: <Layout />,
                        title: "Lean Canvas 2.0",
                        desc: "The living blueprint of your business. Iterate on your business model with version control and team collaboration.",
                        image: "/images/canvas.png"
                     },
                     {
                        icon: <LineChart />,
                        title: "Financial Forecast",
                        desc: "Visualise your financial runway and revenue growth. Automatically project burn rate, MRR, and break-even points without complex spreadsheets.",
                        image: "/images/financial-forecast.png"
                     },
                  ].map((feature, i) => (
                     <FeatureCard
                        key={i}
                        icon={feature.icon}
                        title={feature.title}
                        desc={feature.desc}
                        image={feature.image}
                     />
                  ))}
               </div>

               <div className="mt-16 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100/50 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider mb-4">
                     <span className="w-2 h-2 rounded-full bg-nobel-gold animate-pulse"></span>
                     Comprehensive Suite
                  </div>
                  <p className="text-stone-500 max-w-lg mx-auto text-sm leading-relaxed">
                     Plus many more features not listed here available in the <span className="text-nobel-gold font-semibold">Pro</span> platform.
                  </p>
               </div>
            </div>
         </section> */}

         {/* --- IDEATION TEASER SECTION --- */}
         {/* <section id="ideation" className="relative w-full  border-t border-b border-stone-200">
            <IdeationTeaser hideButton={true} />
         </section> */}

         {/* --- MISSION / OUR WHY SECTION (New) --- */}
         <section id="mission" className="py-24 px-6 md:px-12 bg-[#0c0a09] text-white border-b border-stone-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a09] via-transparent to-[#0c0a09]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="text-left">
                     <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full bg-stone-800 border border-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        <span className="text-xs font-bold tracking-widest text-stone-300 uppercase">Our Mission</span>
                     </div>

                     <h2 className="text-3xl md:text-5xl font-serif text-white mb-8 leading-tight">
                        <span className="block text-stone-500 text-sm md:text-lg font-sans font-bold uppercase tracking-[0.2em] mb-4">The New Industrial Revolution</span>
                        Empowering the <br /> <span className="text-nobel-gold italic">Founders.</span>
                     </h2>

                     <div className="space-y-6 text-lg md:text-xl text-stone-400 font-light leading-relaxed">
                        <p>
                           True economic power doesn't come from "users." It comes from <strong className="text-white">builders.</strong>
                        </p>
                        <p>
                           We exist to bridge the gap between raw ambition and market reality. Our mission is to arm the next generation of founders with the tools to master rigorous hypothesis validation, accelerating the translation of "what if" into "what is."
                        </p>
                        <p>
                           In the age of AI, velocity is our greatest competitive advantage. We are building the operating system for the next tier of American industry.
                        </p>
                     </div>
                  </div>

                  <div className="relative">
                     <div className="absolute -inset-1 bg-gradient-to-r from-nobel-gold to-stone-600 rounded-2xl blur opacity-25"></div>
                     <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
                        <img
                           src="/images/us_founder_mission_group.png"
                           alt="Reindustrializing America: Diverse group of founders working with AI"
                           className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-nobel-gold/10 mix-blend-overlay"></div>
                     </div>
                  </div>
               </div>
            </div>
         </section>





         {/* --- COMING SOON SECTION --- */}
         <section className="relative py-24 px-6 md:px-12 bg-[#F9F8F4] overflow-hidden border-b border-stone-200">
            {/* Background Globe Visualization - Right Aligned */}
            <div className="absolute top-[60%] -right-24 -translate-y-1/2 w-[90rem] h-[90rem] z-0 opacity-40 mix-blend-multiply pointer-events-none transform scale-75 md:scale-100">
               <GlobeViz />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#F9F8F4] via-[#F9F8F4]/80 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
               <div className="max-w-xl">
                  <PaymentComingSoon />
               </div>
            </div>
         </section>




         {/* --- FOOTER --- */}
         < footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800" >
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
               {/* Column 1: Brand & Copyright */}
               <div className="flex flex-col justify-between">
                  <div>
                     <Logo className="flex items-center gap-3 mb-4" imageClassName="h-40 w-auto rounded" textClassName="font-serif font-bold text-lg tracking-wide text-white" src="/images/hero-logo.png" />
                     <p className="text-sm">Structure for the uncertainty of Day One.</p>
                  </div>
                  <div className="mt-8 md:mt-0 text-xs">
                     <p>© {new Date().getFullYear()} Adaptive Startup.<br />All rights reserved.</p>
                  </div>
               </div>

               {/* Column 2: Product */}
               <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6">Product</h4>
                  <ul className="space-y-4 text-sm">
                     <li><a href="#ideation" className="hover:text-nobel-gold transition-colors">Ideation</a></li>
                     <li><a href="#documents" className="hover:text-nobel-gold transition-colors">Philosophy</a></li>
                     <li><a href="#features" className="hover:text-nobel-gold transition-colors">Features</a></li>
                     <li><a href="#pricing" className="hover:text-nobel-gold transition-colors">Pricing</a></li>
                  </ul>
               </div>

               {/* Column 3: Legal */}
               <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6">Legal</h4>
                  <ul className="space-y-4 text-sm">
                     <li><a href="/privacy" className="hover:text-nobel-gold transition-colors">Privacy Policy</a></li>
                     <li><a href="/terms" className="hover:text-nobel-gold transition-colors">Terms of Service</a></li>
                  </ul>
               </div>

               {/* Column 4: Account */}
               <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6">Account</h4>
                  <ul className="space-y-4 text-sm">
                     <li>
                        <button onClick={onLogin} className="hover:text-nobel-gold transition-colors text-left">
                           Beta V1
                        </button>
                     </li>
                  </ul>
               </div>
            </div>
         </footer >

         {/* --- TRIAL REQUEST DIALOG --- */}
         {
            showTrialDialog && (
               <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div
                     className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm animate-in fade-in duration-300"
                     onClick={() => !isSubmitting && setShowTrialDialog(false)}
                  />

                  {/* Dialog */}
                  <div className="relative bg-[#F9F8F4] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-stone-200">
                     {/* Header */}
                     <div className="bg-stone-900 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-nobel-gold/20 via-transparent to-nobel-gold/10"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-nobel-gold/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                        <button
                           onClick={() => !isSubmitting && setShowTrialDialog(false)}
                           className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                        <div className="relative z-10">
                           <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-nobel-gold/20 border border-nobel-gold/30">
                              <Rocket className="w-3 h-3 text-nobel-gold" />
                              <span className="text-xs font-bold tracking-widest text-nobel-gold uppercase">Early Access</span>
                           </div>
                           <h3 className="font-serif text-3xl text-white mb-2">Request a Trial</h3>
                           <p className="text-stone-400 text-sm">Join the waitlist and be among the first to experience Adaptive Startup.</p>
                        </div>
                     </div>

                     {/* Form */}
                     <div className="p-8">
                        {submitSuccess ? (
                           <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <Check className="w-8 h-8 text-green-600" />
                              </div>
                              <h4 className="font-serif text-2xl text-stone-900 mb-2">Thank You!</h4>
                              <p className="text-stone-500">We'll be in touch soon with your trial access.</p>
                           </div>
                        ) : (
                           <form onSubmit={handleTrialSubmit} className="space-y-5">
                              <div>
                                 <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Full Name *</label>
                                 <input
                                    type="text"
                                    required
                                    value={trialForm.name}
                                    onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-nobel-gold focus:ring-2 focus:ring-nobel-gold/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                                    placeholder="John Doe"
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Email Address *</label>
                                 <input
                                    type="email"
                                    required
                                    value={trialForm.email}
                                    onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-nobel-gold focus:ring-2 focus:ring-nobel-gold/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                                    placeholder="john@startup.com"
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Company / Project Name</label>
                                 <input
                                    type="text"
                                    value={trialForm.company}
                                    onChange={(e) => setTrialForm({ ...trialForm, company: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-nobel-gold focus:ring-2 focus:ring-nobel-gold/20 outline-none transition-all text-stone-900 placeholder-stone-400"
                                    placeholder="Acme Inc."
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Tell us about your startup</label>
                                 <textarea
                                    value={trialForm.message}
                                    onChange={(e) => setTrialForm({ ...trialForm, message: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-nobel-gold focus:ring-2 focus:ring-nobel-gold/20 outline-none transition-all text-stone-900 placeholder-stone-400 resize-none"
                                    placeholder="What stage is your startup? What are you building?"
                                 />
                              </div>
                              <button
                                 type="submit"
                                 disabled={isSubmitting}
                                 className="w-full py-4 rounded-xl bg-stone-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-nobel-gold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                 {isSubmitting ? (
                                    <>
                                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                       Submitting...
                                    </>
                                 ) : (
                                    <>
                                       <Rocket className="w-4 h-4" />
                                       Request Trial Access
                                    </>
                                 )}
                              </button>
                              <p className="text-center text-xs text-stone-400">
                                 By submitting, you agree to receive updates about Adaptive Startup.
                              </p>
                           </form>
                        )}
                     </div>
                  </div>
               </div>
            )
         }

      </div >
   );
};

interface FeatureCardProps {
   icon: React.ReactNode;
   title: string;
   desc: string;
   badge?: string;
   image: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, badge, image }) => (
   <div className="rounded-2xl bg-stone-900 border border-stone-800 hover:border-nobel-gold/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden flex flex-col">
      {badge && (
         <div className="absolute top-4 right-4 z-10 bg-white text-stone-900 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {badge}
         </div>
      )}

      {/* Image Area */}
      <div className="h-48 overflow-hidden relative border-b-2 border-nobel-gold">
         <div className="absolute inset-0 bg-stone-800 animate-pulse group-hover:bg-none transition-all"></div>
         <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
         />
      </div>

      <div className="p-8 relative">
         <div className="w-12 h-12 bg-stone-800 rounded-xl border border-stone-700 flex items-center justify-center text-white mb-6 group-hover:bg-nobel-gold group-hover:text-white group-hover:border-nobel-gold transition-colors shadow-sm relative -mt-14">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
         </div>
         <h3 className="font-serif text-xl font-bold text-white mb-3">{title}</h3>
         <p className="text-stone-400 leading-relaxed text-sm">{desc}</p>
      </div>
   </div>
);

export default LandingPage;
