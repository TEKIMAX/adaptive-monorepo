import { useAuth } from '@workos-inc/authkit-react';
import { Redirect } from 'wouter';

export default function Login() {
    const { user, isLoading, signIn, signUp } = useAuth();

    console.log("Auth State:", { user, isLoading });

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (user) {
        return <Redirect to="/dashboard" />;
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Developer Portal</h1>
                <p className="mb-8 text-center text-gray-600">
                    Manage your API keys and access the Sovereign Gateway.
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => signUp()}
                        className="rounded bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700"
                    >
                        Sign Up
                    </button>
                    <button
                        onClick={() => signIn()}
                        className="rounded border border-gray-300 bg-white px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
                    >
                        Log In
                    </button>
                </div>
            </div>
        </div>
    );
}
