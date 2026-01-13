import { useAuth } from '@workos-inc/authkit-react';
import { Redirect } from 'wouter';
import { ApiKeys, WorkOsWidgets } from '@workos-inc/widgets';

export default function Dashboard() {
    const { user, isLoading, signOut, getAccessToken } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Redirect to="/" />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="mx-auto flex max-w-7xl justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-bold text-gray-900">Sovereign Console</h1>
                    <div className="flex items-center gap-4">
                        <a href="/test" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            Test Lab
                        </a>
                        <a href="/create-org" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            Create Org
                        </a>
                        <span className="text-sm text-gray-500">{user.email}</span>
                        <button
                            onClick={() => signOut()}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl py-10 sm:px-6 lg:px-8">
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800">API Keys</h2>
                    <p className="mb-6 text-gray-600">
                        Manage your access keys for the Universal Gateway.
                    </p>

                    {/* WorkOS API Keys Widget */}
                    <div className="min-h-[500px] w-full">
                        <WorkOsWidgets>
                            <ApiKeys authToken={getAccessToken} />
                        </WorkOsWidgets>
                    </div>
                </div>
            </main>
        </div>
    );
}
