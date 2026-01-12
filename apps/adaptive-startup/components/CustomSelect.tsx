
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
    value: string | number;
    onChange: (val: any) => void;
    options: { label: string; value: string | number; color?: string }[];
    className?: string;
    placeholder?: string;
    align?: 'left' | 'right';
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, className = "", placeholder = "Select...", align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-stone-200 rounded-full font-sans text-sm font-medium text-stone-700 focus:border-nobel-gold outline-none transition-colors hover:bg-stone-50 shadow-sm"
            >
                <span className={`truncate ${!selectedOption && !value ? 'text-stone-400' : 'text-stone-900'}`}>
                    {selectedOption ? (
                        selectedOption.color ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedOption.color}`}>
                                {selectedOption.label}
                            </span>
                        ) : selectedOption.label
                    ) : (value || placeholder)}
                </span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1 min-w-[100%] w-max bg-white border border-stone-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100`}>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-stone-50 transition-colors flex items-center justify-between gap-4 ${opt.value === value ? 'bg-stone-50' : ''
                                }`}
                        >
                            {opt.color ? (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${opt.color}`}>
                                    {opt.label}
                                </span>
                            ) : (
                                <span className={`truncate ${opt.value === value ? 'font-bold text-nobel-gold' : 'text-stone-600'}`}>{opt.label}</span>
                            )}
                            {opt.value === value && <Check className="w-3.5 h-3.5 flex-shrink-0 text-nobel-gold" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
