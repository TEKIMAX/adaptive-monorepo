import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, Receipt } from 'lucide-react';
import { StartupData, CostItem, ViewState, RolePermissions } from '../types';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from "../convex/_generated/api";
import DotPatternBackground from './DotPatternBackground';
import { Logo } from './Logo';
import TabNavigation from './TabNavigation';
import CustomSelect from './CustomSelect';

interface ExpensesPageProps {
    data: StartupData;
    onUpdateProject: (updater: (project: StartupData) => StartupData) => void;
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    allowedPages?: string[];
    permissions?: RolePermissions;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
    data,
    onUpdateProject,
    currentView,
    onNavigate,
    allowedPages,
    // permissions - unused
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New Item State
    const [newItem, setNewItem] = useState<Partial<CostItem>>({
        name: '',
        amount: 0,
        frequency: 'Monthly',
        category: 'General'
    });

    const [editValues, setEditValues] = useState<Partial<CostItem>>({});

    const expenses = data.expenseLibrary || [];

    const updateProject = useMutation(api.projects.update);

    const filteredExpenses = expenses.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddWrapper = () => {
        if (!newItem.name || !newItem.amount) {
            toast.error("Please enter a name and amount");
            return;
        }

        const item: CostItem = {
            id: Date.now().toString(),
            name: newItem.name,
            amount: Number(newItem.amount),
            frequency: newItem.frequency as 'Monthly' | 'One-time' | 'Yearly' || 'Monthly',
            category: newItem.category || 'General',
            growthRate: 0,
            source: 'Human'
        };

        const updatedLibrary = [...(data.expenseLibrary || []), item];

        onUpdateProject(project => ({
            ...project,
            expenseLibrary: updatedLibrary
        }));

        updateProject({
            id: data.id as any,
            updates: { expenseLibrary: updatedLibrary }
        });

        setNewItem({ name: '', amount: 0, frequency: 'Monthly', category: 'General' });
        setIsAdding(false);
        toast.success("Expense added to library");
    };

    const startEditing = (item: CostItem) => {
        setEditingId(item.id);
        setEditValues({
            name: item.name,
            amount: item.amount,
            category: item.category,
            frequency: item.frequency
        });
    };

    const handleUpdate = (id: string) => {
        const updatedLibrary = (data.expenseLibrary || []).map(item =>
            item.id === id ? { ...item, ...editValues } : item
        );

        onUpdateProject(project => ({
            ...project,
            expenseLibrary: updatedLibrary
        }));

        updateProject({
            id: data.id as any,
            updates: { expenseLibrary: updatedLibrary }
        });

        setEditingId(null);
        setEditValues({});
        toast.success("Expense updated");
    };

    const handleDelete = (id: string) => {
        const updatedLibrary = (data.expenseLibrary || []).filter(item => item.id !== id);

        onUpdateProject(project => ({
            ...project,
            expenseLibrary: updatedLibrary
        }));

        updateProject({
            id: data.id as any,
            updates: { expenseLibrary: updatedLibrary }
        });

        toast.success("Expense removed from library");
    };

    return (
        <div className="h-screen flex bg-[#F9F8F4] relative overflow-hidden">
            {/* Left Side - Image (30% to match Hub) */}
            <div className="hidden md:flex w-[30%] h-full relative overflow-hidden bg-stone-900 border-r border-stone-200 shadow-2xl z-20">
                <img
                    src="/images/CozyRoom.png"
                    alt="Operating Expenses"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 via-transparent to-stone-900/80" />

                {/* Top Logo */}
                <div className="absolute top-12 left-12 z-30">
                    <Logo imageClassName="h-10 w-auto brightness-0 invert" />
                </div>

                {/* Bottom Overlay Content matching Hub style */}
                <div className="absolute inset-x-0 bottom-0 p-12 space-y-6 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent pt-32">
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl inline-block mb-2 border border-white/20">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-white text-4xl font-serif font-bold leading-tight">
                            Operating <br />
                            <span className="text-nobel-gold italic underline underline-offset-8 decoration-white/20">Expenses.</span>
                        </h2>
                        <div className="h-1 w-12 bg-nobel-gold/50 rounded-full" />
                        <p className="text-stone-300 text-sm leading-relaxed max-w-sm font-medium">
                            Centralize your recurring costs and overheads. Build a library of expenses to quickly model different financial scenarios.
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
                    <div className="max-w-3xl mx-auto space-y-8">

                        {/* Mobile Header (visible only on small screens) */}
                        <div className="lg:hidden mb-8">
                            <h1 className="text-3xl font-serif text-stone-900 mb-2">Operating Expenses</h1>
                            <p className="text-stone-500">Manage your cost library.</p>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-nobel-gold focus:ring-1 focus:ring-nobel-gold outline-none bg-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="px-6 py-3 bg-stone-900 text-white rounded-xl flex items-center gap-2 font-medium hover:bg-stone-800 transition-colors shadow-sm active:translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                Add Expense
                            </button>
                        </div>

                        {/* Add New Form */}
                        {isAdding && (
                            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-6 animate-in slide-in-from-top-4">
                                <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                                    New Expense Item
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Expense Name</label>
                                        <input
                                            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                                            placeholder="e.g. AWS Server Hosting"
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Amount ($)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                                            placeholder="0.00"
                                            value={newItem.amount}
                                            onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Frequency</label>
                                        <CustomSelect
                                            value={newItem.frequency || 'Monthly'}
                                            onChange={(val) => setNewItem({ ...newItem, frequency: val as any })}
                                            options={[
                                                { label: "Monthly", value: "Monthly" },
                                                { label: "Yearly", value: "Yearly" },
                                                { label: "One-time", value: "One-time" }
                                            ]}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Category</label>
                                        <input
                                            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                                            placeholder="e.g. Infrastructure, Marketing, Legal"
                                            value={newItem.category}
                                            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-stone-500 hover:bg-stone-100 rounded-lg font-medium transition-colors">Cancel</button>
                                    <button onClick={handleAddWrapper} className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 font-medium transition-colors shadow-sm">Save Expense</button>
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-visible">
                            <table className="w-full">
                                <thead className="bg-stone-50/80 backdrop-blur border-b border-stone-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-wider">Name</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-wider">Category</th>
                                        <th className="text-right py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-wider">Amount</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-wider">Freq</th>
                                        <th className="text-right py-4 px-6 text-xs font-bold text-stone-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center text-stone-300">
                                                    <Receipt className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-stone-500 font-medium">No expenses in library.</p>
                                                    <p className="text-sm">Add one manually or import from Token Pricing.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map(item => (
                                            <tr key={item.id} className="group hover:bg-stone-50/60 transition-colors">
                                                <td className="py-4 px-6">
                                                    {editingId === item.id ? (
                                                        <input
                                                            className="w-full border-stone-300 rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={editValues.name}
                                                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="font-semibold text-stone-800">{item.name}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {editingId === item.id ? (
                                                        <input
                                                            className="w-full border-stone-300 rounded-md px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={editValues.category}
                                                            onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                                                        />
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                                            {item.category || 'General'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {editingId === item.id ? (
                                                        <input
                                                            type="number"
                                                            className="w-24 border-stone-300 rounded-md px-2 py-1 text-right text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                            value={editValues.amount}
                                                            onChange={(e) => setEditValues({ ...editValues, amount: parseFloat(e.target.value) })}
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-stone-700 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm font-medium">
                                                            ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-stone-500 text-sm">
                                                    {editingId === item.id ? (
                                                        <CustomSelect
                                                            value={editValues.frequency}
                                                            onChange={(val) => setEditValues({ ...editValues, frequency: val as any })}
                                                            options={[
                                                                { label: "Monthly", value: "Monthly" },
                                                                { label: "Yearly", value: "Yearly" },
                                                                { label: "One-time", value: "One-time" }
                                                            ]}
                                                        />
                                                    ) : (
                                                        item.frequency
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {editingId === item.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdate(item.id)}
                                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 text-stone-400 hover:bg-stone-50 rounded-lg transition-colors">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEditing(item)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-all">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
