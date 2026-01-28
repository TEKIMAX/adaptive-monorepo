import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type DateRangeOption = '24h' | '7d' | '30d' | 'all' | 'custom';

interface DateRangeSelectorProps {
    value: DateRangeOption;
    onChange: (value: DateRangeOption) => void;
    className?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Default to today effectively

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days: (number | null)[] = [];

        // Empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear();
    };

    const handleApply = () => {
        onChange('custom'); // Signal that a custom date was picked
        setIsOpen(false);
    };

    const currentMonthName = MONTHS[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded text-xs font-medium text-white transition-all w-full md:w-auto justify-between group"
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-tekimax-blue opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="opacity-80 group-hover:opacity-100">
                        {value === 'custom' && selectedDate
                            ? selectedDate.toLocaleDateString()
                            : value === 'all' ? 'All Time' : value === '30d' ? 'Last 30 Days' : value === '7d' ? 'Last 7 Days' : 'Last 24 Hours'}
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full text-left right-0 mt-2 w-[300px] bg-[#0A0A0A] border border-white/10 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <h3 className="font-serif text-lg text-white tracking-wide">Select Date Range</h3>
                            </div>

                            {/* Month Nav */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={handlePrevMonth} className="p-1 text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/40">
                                    <ChevronLeft className="w-3 h-3" />
                                </button>
                                <span className="font-serif text-sm text-white/80">{currentMonthName} {currentYear}</span>
                                <button onClick={handleNextMonth} className="p-1 text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/40">
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-y-1 mb-4">
                                {/* Weekday Headers */}
                                {DAYS.map(day => (
                                    <div key={day} className="text-center text-[9px] uppercase font-bold text-white/40 tracking-widest mb-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Days */}
                                {generateCalendarDays().map((day, idx) => (
                                    <div key={idx} className="flex justify-center">
                                        {day ? (
                                            <button
                                                onClick={() => handleDateClick(day)}
                                                className={`w-7 h-7 flex items-center justify-center text-xs font-medium transition-all duration-200 rounded-full
                                                    ${isSelected(day)
                                                        ? 'bg-tekimax-blue text-white font-bold'
                                                        : 'text-white hover:text-tekimax-blue hover:bg-white/5'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ) : (
                                            <div className="w-7 h-7"></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-3 py-1.5 text-[10px] font-mono text-white/40 hover:text-white transition-colors uppercase tracking-widest border border-transparent hover:border-white/10 rounded-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-4 py-1.5 bg-tekimax-blue text-white text-[10px] font-bold uppercase tracking-widest hover:bg-tekimax-blue/80 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)] rounded-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
