import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        // Clear session-related URL params and force a hard reload
        // We append a timestamp to ensure it's not served from cache
        window.location.href = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
    };

    private getErrorMessage = () => {
        const msg = this.state.error?.message?.toLowerCase() || '';
        if (msg.includes('session') || msg.includes('auth') || msg.includes('token') || msg.includes('workos')) {
            return "We detected a synchronization error with your session. This often happens after an update or when multiple sessions conflict.";
        }
        return "Something went wrong while loading this part of your workspace. It might be due to a recent update or a temporary connectivity issue.";
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="relative min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center font-sans overflow-hidden">
                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />

                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500 px-6 relative z-10">
                        <div className="inline-flex bg-white p-4 rounded-3xl shadow-xl mb-4 border border-stone-100">
                            <AlertCircle className="w-12 h-12 text-stone-200" />
                        </div>
                        <h1 className="text-2xl font-serif text-stone-900">Workspace Sync Issue</h1>
                        <p className="text-stone-500 max-w-md mx-auto text-sm leading-relaxed">
                            {this.getErrorMessage()}
                        </p>
                        <div className="pt-4">
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Restore Workspace
                            </button>
                        </div>
                    </div>

                    {/* Corner Notification as requested */}
                    <div className="fixed bottom-6 left-6 z-[9999] animate-in slide-in-from-left-8 duration-700">
                        <div className="bg-white border border-red-50 shadow-2xl rounded-2xl p-4 max-w-[280px] flex items-start gap-3 ring-1 ring-black/[0.03]">
                            <div className="bg-red-50 p-2 rounded-xl shrink-0">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-bold text-stone-900 leading-tight">Sync Conflict Detected</h3>
                                <p className="text-[10px] text-stone-400 font-medium leading-normal">
                                    Automatic recovery ready. Captured technical state to prevent further workspace conflicts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
