
import React, { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
}

interface NavigationProps {
  onContactClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onContactClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: NavItem[] = [
    { label: 'Home', href: 'https://tekimax.com' },
    { label: 'The Engine', href: '#engine' },
    { label: 'Solutions', href: '#platforms' },
    { label: 'Developers', href: '#developers' },
    { label: 'Research', href: '#exoskeleton' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-tekimax-navy/90 backdrop-blur-xl py-4 border-b border-white/5 shadow-xl' : 'bg-transparent py-8'}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="flex justify-between items-center">
          <div
            className="flex-shrink-0 flex items-center cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img src="/images/tekimax-logo-white-RGB-2.png" alt="Tekimax Logo" className="h-10 w-auto group-hover:opacity-90 transition-opacity" />
          </div>

          <div className="hidden lg:block">
            <div className="flex items-center space-x-12">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/60 hover:text-white transition-all text-[11px] font-bold tracking-[0.25em] uppercase"
                >
                  {link.label}
                </a>
              ))}
              <div className="pl-6 border-l border-white/10">
                <button
                  onClick={onContactClick}
                  className="bg-white text-tekimax-navy px-8 py-3 rounded-sm text-[11px] font-bold tracking-widest uppercase hover:bg-tekimax-orange hover:text-white transition-all shadow-lg hover:shadow-tekimax-orange/20"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-tekimax-navy border-b border-white/10 px-8 py-10 space-y-6 shadow-2xl animate-fade-in-up">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-white/80 font-bold py-3 text-sm uppercase tracking-widest border-b border-white/5"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-6">
            <button
              onClick={() => { setIsOpen(false); onContactClick?.(); }}
              className="w-full bg-white text-tekimax-navy py-5 rounded-sm font-bold uppercase text-[11px] tracking-widest"
            >
              Contact Us
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
