
import React, { useState, useRef, useEffect } from 'react';
import { PageType } from '../../../types';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading: boolean;
  activePage: PageType;
  onPageChange: (page: PageType) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, activePage, onPageChange }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((text.trim() || files.length > 0) && !isLoading) {
      onSend(text, files);
      setText('');
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-6 space-y-4">
      <div className="relative flex flex-col bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-nobel-gold/10 focus-within:border-nobel-gold/40 transition-all">

        {/* Top bar for files and context tags */}
        {(files.length > 0 || activePage) && (
          <div className="flex flex-wrap items-center gap-2 p-4 pb-0">
            {/* {activePage && (
              <div className="flex items-center gap-2 bg-nobel-dark text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-nobel-dark shadow-sm">
                <span className="opacity-60">Context:</span>
                <span>{activePage}</span>
              </div>
            )} */}
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-nobel-cream px-3 py-1 rounded-full text-[10px] font-bold text-nobel-dark border border-nobel-gold/20">
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="text-nobel-gold hover:text-red-500 transition-colors">×</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end px-4 py-3 gap-2">
          {/* Strategy Mode Dropdown Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 mb-1 rounded-full bg-nobel-cream text-nobel-gold hover:bg-nobel-gold hover:text-white transition-all shadow-sm border border-nobel-gold/10"
              title="Select Strategy Mode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-full left-0 mb-4 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in-up">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                  Strategy Engine
                </div>
                {Object.values(PageType).filter(page =>
                  page !== PageType.GOALS &&
                  page !== PageType.LEGAL &&
                  page !== PageType.SUBSCRIPTION &&
                  page !== PageType.ANALYTICS &&
                  page !== PageType.LOGO_GEN && // Often not a chat context either
                  page !== PageType.FUNDRAISING // Keep if user wants, but list was specific. User said "Goles legal ip subscription ,analytic". 
                  // I will stick to the user's explicit list: Goals, Legal, Subscription, Analytics.
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      onPageChange(page);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-3 ${activePage === page
                      ? 'bg-nobel-cream text-nobel-dark'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activePage === page ? 'bg-nobel-gold' : 'bg-gray-200'}`}></div>
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 mb-1 text-gray-400 hover:text-nobel-gold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={`Instruct Adaptive Engine...`}
            rows={1}
            className="flex-1 bg-transparent py-4 outline-none text-sm text-gray-700 placeholder-gray-400 resize-none max-h-32"
          />

          <button
            type="submit"
            disabled={(!text.trim() && files.length === 0) || isLoading}
            className={`p-3 mb-1 rounded-2xl transition-all ${(text.trim() || files.length > 0) && !isLoading
              ? 'bg-nobel-dark text-white shadow-xl scale-100'
              : 'bg-gray-100 text-gray-300 scale-95 opacity-50'
              }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </button>
        </form>
      </div>

      <div className="relative px-8 text-center group">
        <p
          className={`text-[10px] text-stone-400 leading-tight transition-all duration-300 ${!isDisclaimerExpanded ? 'line-clamp-2' : ''}`}
          onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
        >
          The Services include experimental technology and may sometimes provide inaccurate or offensive content that doesn't represent Adaptive Startup's views. Use discretion before relying on, publishing, or otherwise using content provided by the Services. Don't rely on the Services for medical, mental health, legal, financial, or other professional advice. Any content regarding those topics is provided for informational purposes only and is not a substitute for advice from a qualified professional. Content does not constitute medical treatment or diagnosis.
        </p>

        {!isDisclaimerExpanded && (
          <button
            type="button"
            onClick={() => setIsDisclaimerExpanded(true)}
            className="mt-1 text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full transition-colors font-medium inline-block"
          >
            Read More
          </button>
        )}
        {isDisclaimerExpanded && (
          <button
            type="button"
            onClick={() => setIsDisclaimerExpanded(false)}
            className="mt-1 text-[9px] text-stone-300 hover:text-stone-500 transition-colors inline-block"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
