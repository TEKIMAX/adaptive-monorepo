
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

import UnderConstruction from './UnderConstruction';

// Redirect component for /developers to handle legacy external link
const DevelopersRedirect = () => {
  React.useEffect(() => {
    window.location.href = 'http://localhost:5174';
  }, []);
  return null;
};

const App: React.FC = () => {
  const [isBlurred, setIsBlurred] = React.useState(false);

  React.useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable selection start
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Disable F12 and common DevTools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Elements)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }

      // Mac: Cmd+Opt+I (Inspect), Cmd+Opt+J (Console), Cmd+Opt+C (Elements)
      if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }

      // Mac: Cmd+Opt+U (View Source)
      if (e.metaKey && e.altKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
    };

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsBlurred(true);
      } else {
        setIsBlurred(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <BrowserRouter>
      {isBlurred && (
        <div
          className="fixed inset-0 z-[99999] bg-[#0B0F19] flex items-center justify-center p-8 text-center"
          style={{ pointerEvents: 'all' }}
        >
          <div className="max-w-md space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-tekimax-blue/30 border-t-tekimax-blue animate-spin mx-auto mb-6"></div>
            <h2 className="text-white font-display font-medium text-xl tracking-wider uppercase">Secure Session Paused</h2>
            <p className="text-white/40 text-sm font-light leading-relaxed">
              Visuals are hidden when the window is inactive to maintain security. Please focus the window to resume your session.
            </p>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<UnderConstruction />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/developers" element={<DevelopersRedirect />} />

        {/* Fallback route: Redirect unknown paths to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
