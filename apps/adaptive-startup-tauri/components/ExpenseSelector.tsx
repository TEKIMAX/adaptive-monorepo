import React, { useState } from 'react';
import { X, Search, Plus, Receipt } from 'lucide-react';
import { CostItem } from '../types';

interface ExpenseSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    expenses: CostItem[];
    onSelect: (item: CostItem) => void;
}

export const ExpenseSelector: React.FC<ExpenseSelectorProps> = ({ isOpen, onClose, expenses, onSelect }) => {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filtered = expenses.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900">Import Expense</h3>
                        <p className="text-xs text-stone-500">Select an item from your library</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-stone-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none"
                            placeholder="Search library..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-stone-400">
                            <Receipt className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No matching expenses found.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filtered.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { onSelect(item); onClose(); }}
                                    className="w-full p-3 flex items-center justify-between hover:bg-stone-50 rounded-xl group transition-all"
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-stone-900">{item.name}</div>
                                        <div className="text-xs text-stone-500 flex gap-2">
                                            <span className="bg-stone-100 px-1.5 rounded">{item.category || 'General'}</span>
                                            <span>{item.frequency}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-stone-600 font-bold">${item.amount.toLocaleString()}</span>
                                        <Plus className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-100 text-center">
                    <p className="text-xs text-stone-400">Use the <span className="font-bold">Operating Expenses</span> page to manage this list.</p>
                </div>
            </div>
        </div>
    );
};
