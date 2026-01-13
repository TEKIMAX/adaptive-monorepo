import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthKitProvider } from '@workos-inc/authkit-react';
import App from './App.tsx';
import './index.css';

// Using environment variables for WorkOS config
const clientId = import.meta.env.VITE_WORKOS_CLIENT_ID || "client_placeholder";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthKitProvider clientId={clientId}>
      <App />
    </AuthKitProvider>
  </React.StrictMode>,
);
