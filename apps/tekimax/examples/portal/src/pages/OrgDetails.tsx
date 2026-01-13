import { useEffect, useState } from 'react';
import { useAuth } from '@workos-inc/authkit-react';
import { useRoute } from 'wouter';
import { ApiKeys, WorkOsWidgets } from '@workos-inc/widgets';

export default function OrgDetails() {
    const { user, isLoading } = useAuth();
    const [match, params] = useRoute("/org/:id");
    const orgId = params?.id;

    const [widgetToken, setWidgetToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user && orgId) {
            fetchWidgetToken();
        }
    }, [user, orgId]);

    const fetchWidgetToken = async () => {
        try {
            const res = await fetch('http://localhost:3000/v1/portal/widget-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organization_id: orgId,
                    user_id: user?.id,
                    scopes: ["widgets:api-keys:manage"]
                })
            });
            const data = await res.json();
            if (res.ok) {
                setWidgetToken(data.token);
            } else {
                setError(data.error || "Failed to fetch widget token");
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (!match) return <div>Org not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
                    <a href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
                        &larr; Back to Dashboard
                    </a>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-bold text-gray-800">API Keys</h2>
                    {error && <div className="mb-4 text-red-600">{error}</div>}

                    {widgetToken ? (
                        <div className="h-[600px] w-full border rounded-md">
                            <WorkOsWidgets>
                                <ApiKeys authToken={widgetToken} />
                            </WorkOsWidgets>
                        </div>
                    ) : (
                        <div>Loading Widget...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
