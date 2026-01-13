import { useState } from 'react';
import { useAuth } from '@workos-inc/authkit-react';
import { Redirect, useLocation } from 'wouter';

export default function CreateOrg() {
    const { user, isLoading } = useAuth();
    const [orgName, setOrgName] = useState('');
    const [domains, setDomains] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [response, setResponse] = useState<string>('');
    const [, setLocation] = useLocation();

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <Redirect to="/" />;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setResponse('');

        try {
            const domainList = domains
                .split(',')
                .map(d => d.trim())
                .filter(d => d.length > 0);

            const res = await fetch('http://localhost:3000/v1/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: orgName,
                    domains: domainList.length > 0 ? domainList : undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                // Redirect to the new Org Details page
                if (data.id) {
                    setLocation(`/org/${data.id}`);
                } else {
                    setResponse(JSON.stringify(data, null, 2));
                }
            } else {
                setStatus('error');
                setResponse(JSON.stringify(data, null, 2));
            }
        } catch (err: any) {
            setStatus('error');
            setResponse(err.message || 'Network Error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Organization</h1>
                    <a href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
                        &larr; Back to Dashboard
                    </a>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                        <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Domains (Optional)</label>
                        <p className="mb-1 text-xs text-gray-500">Comma separated, e.g. example.com, foo.com</p>
                        <input
                            type="text"
                            value={domains}
                            onChange={(e) => setDomains(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            placeholder="example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Creating...' : 'Create Organization'}
                    </button>
                </form>

                {response && (
                    <div className={`mt-6 rounded p-4 ${status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <h3 className={`text-sm font-medium ${status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {status === 'success' ? 'Success' : 'Error'}
                        </h3>
                        <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">
                            {response}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
