import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthKitProvider, useAuth } from '@workos-inc/authkit-react';
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import './index.css';
import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';
import { WorkOsWidgets } from '@workos-inc/widgets';
import { Theme } from '@radix-ui/themes';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { convex } from './convexClient';

function useWorkOSAuthAdapter() {
  const { isLoading, user, getAccessToken } = useAuth();

  // Track if we've failed to get a token, indicating the session is invalid despite `user` being present
  const [authError, setAuthError] = React.useState(false);

  // Debug log for adapter state - UNCOMMENTED FOR DEBUGGING
  React.useEffect(() => {
    console.log("ConvexAdapter State:", { isLoading, user: !!user, authError });
  }, [isLoading, user, authError]);

  // Reset error when user changes (e.g. re-login attempt)
  React.useEffect(() => {
    setAuthError(false);
  }, [user]);

  // Proactive Token Refresh (Heartbeat)
  // WorkOS tokens might expire, so we fetch a new one periodically to keep the session alive
  // and ensure synchronization between the local auth state and the backend.
  React.useEffect(() => {
    if (!user) return;

    const REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
    const intervalId = setInterval(async () => {
      try {
        // Just fetching it updates the internal cache/state usually
        const token = await getAccessToken();
        if (!token) {
          console.warn("Background refresh failed to get token");
          // We don't necessarily setAuthError here to avoid aggressive UI disruption 
          // unless we want to force the re-login flow immediately. 
          // Let's set it to true so the App.tsx auto-reconnect kicks in proactively
          // rather than waiting for a user action to fail.
          setAuthError(true);
        }
      } catch (e) {
        console.warn("Background refresh error:", e);
        setAuthError(true);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, getAccessToken]);

  return React.useMemo(() => ({
    isLoading,
    // Consider authenticated ONLY if we have a user and NO explicit auth error.
    // authError is set only during a terminal failure.
    isAuthenticated: !!user && !authError,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = await getAccessToken();

        if (token) {
          // Success: reset error if we got a valid token
          setAuthError(false);
          return token;
        }

        // If we have a user but no token returned, we might be in an inconsistent state or refresh failed.
        if (user) {
          console.warn("ConvexAdapter: User present but no token returned");
          // If forceRefreshToken is true, this is a terminal failure for a specific call.
          if (forceRefreshToken) {
            setAuthError(true);
          }
        }

        return null;
      } catch (e) {
        console.error("ConvexAdapter: Error fetching access token:", e);
        // Only mark as terminal error if we actually have a user but can't get a token.
        if (user) {
          setAuthError(true);
        }
        return null;
      }
    },
  }), [isLoading, user, getAccessToken, authError, setAuthError]);
}

function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={useWorkOSAuthAdapter}
    >
      {children}
    </ConvexProviderWithAuth>
  );
}

import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <AuthKitProvider
          clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
          redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI}
          devMode={true}
        >
          <ConvexClientProvider>
            <WorkOsWidgets>
              <Theme accentColor="gold" grayColor="sand" radius="large" scaling="100%">
                <App />
              </Theme>
            </WorkOsWidgets>
          </ConvexClientProvider>
        </AuthKitProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);