import React, { useState } from 'react';
import { Search, Plus, Loader2, TrendingUp, Calculator, Zap } from 'lucide-react';
import { StartupData, CostItem, ViewState, RolePermissions } from '../types';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from "../convex/_generated/api";
import { useAIGetModelPricing } from '../hooks/useAI';
import DotPatternBackground from './DotPatternBackground';
import { Logo } from './Logo';
import TabNavigation from './TabNavigation';
import CustomSelect from './CustomSelect';

interface TokenPricingCalculatorProps {
    currentProject?: StartupData;
    onUpdateProject?: (updater: (project: StartupData) => StartupData) => void;
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    allowedPages?: string[];
    permissions?: RolePermissions;
}

// Updated interface based on API documentation
interface ModelPricing {
    model_id: string;
    name: string; // "GPT-5 Codex"
    provider_name: string; // "ZenMux"
    cost_per_1m_input: number;
    cost_per_1m_output: number;
    context_window: number;
    capabilities: string[];
}

interface PricingApiResponse {
    models: ModelPricing[];
    total_matched: number;
}

export const TokenPricingCalculator: React.FC<TokenPricingCalculatorProps> = ({
    currentProject,
    onUpdateProject,
    currentView,
    onNavigate,
    allowedPages,
    permissions
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [providerFilter, setProviderFilter] = useState('');
    const [models, setModels] = useState<ModelPricing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Calculator State
    const [selectedModel, setSelectedModel] = useState<ModelPricing | null>(null);
    const [inputTokens, setInputTokens] = useState<number>(1000000); // Default 1M
    const [outputTokens, setOutputTokens] = useState<number>(100000);   // Default 100k
    const [estimatedCost, setEstimatedCost] = useState<number>(0);

    // Use the new backend action
    const getModelPricing = useAIGetModelPricing();
    const updateProject = useMutation(api.projects.update);

    const fetchModels = async (reset = false) => {
        setIsLoading(true);
        try {
            const result = await getModelPricing({
                provider: providerFilter || undefined,
                query: searchQuery || undefined,
                limit: 60,
                offset: reset ? 0 : offset
            }) as PricingApiResponse; // Type cast the return value

            const newModels = result.models || [];

            if (reset) {
                setModels(newModels);
                setOffset(newModels.length);
            } else {
                setModels(prev => [...prev, ...newModels]);
                setOffset(prev => prev + newModels.length);
            }

            setHasMore(newModels.length === 60);

        } catch (error) {
            console.error("Pricing API Error:", error);
            toast.error("Failed to load model pricing.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchModels(true);
    };

    const calculateCost = () => {
        if (!selectedModel) return;
        // Use correct field names: cost_per_1m_input / cost_per_1m_output
        const inputCost = (inputTokens / 1_000_000) * (selectedModel.cost_per_1m_input || 0);
        const outputCost = (outputTokens / 1_000_000) * (selectedModel.cost_per_1m_output || 0);
        setEstimatedCost(inputCost + outputCost);
    };

    React.useEffect(() => {
        calculateCost();
    }, [selectedModel, inputTokens, outputTokens]);

    const handleAddToExpenses = () => {
        if (!selectedModel || !currentProject || !onUpdateProject) return;

        const newCostItem: CostItem = {
            id: Date.now().toString(),
            name: `AI Inference: ${selectedModel.name}`,
            amount: parseFloat(estimatedCost.toFixed(2)),
            frequency: 'Monthly',
            category: 'AI Infrastructure',
            source: 'Human' // Or 'AI' depending on perspective, but user is adding it manually
        };

        const updatedLibrary = [...(currentProject.expenseLibrary || []), newCostItem];

        // Add to Expense Library (Local)
        onUpdateProject(project => ({
            ...project,
            expenseLibrary: updatedLibrary
        }));

        // Persist to Backend
        if (currentProject.id) {
            updateProject({
                id: currentProject.id as any,
                updates: { expenseLibrary: updatedLibrary }
            });
        }

        toast.success(`Added ${newCostItem.name} to Expense Library`);
    };

    return (
        <div className="h-screen flex bg-[#F9F8F4] relative overflow-hidden">
            {/* Left Side - Image (30% to match Hub) */}
            <div className="hidden md:flex w-[30%] h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20">
                <img
                    src="/images/Cozy.png"
                    alt="Token Intelligence"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-900/80" />

                {/* Top Logo */}
                <div className="absolute top-12 left-12 z-30">
                    <Logo imageClassName="h-10 w-auto brightness-0 invert" />
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute inset-x-0 bottom-0 p-12 space-y-6 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pt-32">
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl inline-block mb-2 border border-white/20">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-white text-4xl font-serif font-bold leading-tight">
                            Token <br />
                            <span className="text-nobel-gold italic underline underline-offset-8 decoration-white/20">Intelligence.</span>
                        </h2>
                        <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                        <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-medium">
                            Optimize your AI infrastructure costs. Compare model pricing, capabilities, and forecast token usage in real-time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Content (70%) */}
            <div className="w-[70%] h-full flex flex-col relative z-10">
                <DotPatternBackground color="#a8a29e" />

                <header className="px-10 py-6 flex items-center justify-between relative z-30">
                    <div className="flex items-center gap-6">
                        <TabNavigation currentView={currentView} onNavigate={onNavigate} allowedPages={allowedPages} mode="light" />
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-12 pt-0 relative z-10">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Title (Mobile only) */}
                        <div className="lg:hidden mb-8">
                            <h1 className="text-3xl font-serif text-stone-900 mb-2">Token Intelligence</h1>
                            <p className="text-stone-500">Compare models and forecast costs.</p>
                        </div>

                        {/* Calculator & Results Split */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Search & Results */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Search Bar */}
                                {/* Results Grid */}
                                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden h-[900px] flex flex-col">
                                    {/* Fixed Header with Search and Filter */}
                                    <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex gap-4 shrink-0">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search models..."
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-200 focus:border-nobel-gold focus:ring-1 focus:ring-nobel-gold outline-none bg-white text-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <CustomSelect
                                            value={providerFilter}
                                            onChange={(val) => setProviderFilter(val as string)}
                                            options={[
                                                { label: "All Providers", value: "" },
                                                { label: "OpenAI", value: "openai" },
                                                { label: "Anthropic", value: "anthropic" },
                                                { label: "Google", value: "google" },
                                                { label: "Mistral", value: "mistral" }
                                            ]}
                                            className="w-40"
                                            placeholder="Provider"
                                        />
                                        <button
                                            onClick={() => fetchModels(true)}
                                            className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium shadow-sm hover:shadow-md active:translate-y-0.5 flex items-center gap-2 text-sm"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                                            <span>Search</span>
                                        </button>
                                    </div>

                                    {/* Table Header - Fixed */}
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-stone-50 font-medium text-xs text-stone-500 uppercase tracking-wider shrink-0 border-b border-stone-100">
                                        <div className="col-span-5">Model</div>
                                        <div className="col-span-3 text-right">Input ($/1M)</div>
                                        <div className="col-span-3 text-right">Output ($/1M)</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        {models.length === 0 && !isLoading ? (
                                            <div className="h-full flex flex-col items-center justify-center text-stone-400 p-12">
                                                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                                                <p>Search to find model pricing models.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-stone-100">
                                                {models.map((model, idx) => (
                                                    <div
                                                        key={`${model.provider_name}-${model.name}-${idx}`}
                                                        className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-stone-50 transition-colors cursor-pointer ${selectedModel?.name === model.name ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}
                                                        onClick={() => setSelectedModel(model)}
                                                    >
                                                        <div className="col-span-5">
                                                            <div className="font-bold text-stone-800">{model.name}</div>
                                                            <div className="text-xs text-stone-500 capitalize">{model.provider_name}</div>
                                                        </div>
                                                        <div className="col-span-3 text-right font-mono text-stone-600">
                                                            ${(model.cost_per_1m_input || 0).toFixed(2)}
                                                        </div>
                                                        <div className="col-span-3 text-right font-mono text-stone-600">
                                                            ${(model.cost_per_1m_output || 0).toFixed(2)}
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            <button className="text-purple-600 hover:text-purple-700">
                                                                <Plus className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Load More Trigger inside scrollable area */}
                                                {hasMore && models.length > 0 && (
                                                    <div className="p-4 flex justify-center">
                                                        <button
                                                            onClick={() => fetchModels()}
                                                            disabled={isLoading}
                                                            className="text-sm text-stone-500 hover:text-stone-900 font-medium flex items-center gap-2"
                                                        >
                                                            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
                                                            Load More
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Calculator */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sticky top-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                            <Calculator className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold text-stone-900">Cost Estimator</h2>
                                    </div>

                                    {selectedModel ? (
                                        <div className="space-y-6">
                                            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">Selected Model</div>
                                                        <div className="font-bold text-stone-900 text-lg">{selectedModel.name}</div>
                                                    </div>
                                                    <div className="px-2 py-1 bg-white rounded border border-stone-200 text-xs font-semibold text-stone-600 capitalize shadow-sm">
                                                        {selectedModel.provider_name}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                                    <div className="bg-white p-3 rounded-lg border border-stone-100">
                                                        <span className="text-stone-500 block text-xs mb-1">Input Cost</span>
                                                        <span className="font-mono font-bold text-stone-900">${(selectedModel.cost_per_1m_input || 0).toFixed(2)}</span>
                                                        <span className="text-xs text-stone-400 ml-1">/1M</span>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border border-stone-100">
                                                        <span className="text-stone-500 block text-xs mb-1">Output Cost</span>
                                                        <span className="font-mono font-bold text-stone-900">${(selectedModel.cost_per_1m_output || 0).toFixed(2)}</span>
                                                        <span className="text-xs text-stone-400 ml-1">/1M</span>
                                                    </div>
                                                </div>
                                                {selectedModel.context_window > 0 && (
                                                    <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                        Context Window: {(selectedModel.context_window / 1000).toFixed(0)}k tokens
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-stone-100">
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                                        Input Tokens (Monthly)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                                        value={inputTokens}
                                                        onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                                                    />
                                                    <div className="text-xs text-stone-400 mt-1 text-right">
                                                        {(inputTokens / 1000000).toFixed(2)}M tokens
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                                        Output Tokens (Monthly)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                                        value={outputTokens}
                                                        onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                                                    />
                                                    <div className="text-xs text-stone-400 mt-1 text-right">
                                                        {(outputTokens / 1000000).toFixed(2)}M tokens
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-stone-100">
                                                <div className="flex justify-between items-end mb-6">
                                                    <span className="text-stone-500 font-medium">Estimated Monthly Cost</span>
                                                    <span className="text-3xl font-bold text-stone-900">
                                                        ${estimatedCost.toFixed(2)}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={handleAddToExpenses}
                                                    className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold shadow-lg hover:shadow-xl active:translate-y-0.5 flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Add to Expenses
                                                </button>
                                                <p className="text-xs text-stone-400 text-center mt-3">
                                                    Adds to your Financial Forecast expense list.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-stone-400">
                                            <p>Select a model from the left to calculate costs.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
