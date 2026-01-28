import React, { useState, useRef, useEffect } from 'react';

interface ToolTipProps {
    children: React.ReactNode;
    content: string;
}

const ToolTip: React.FC<ToolTipProps> = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<'top' | 'bottom'>('top');

    // Simple position adjustment if close to top of viewport (optional but good for UX)
    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (rect.top < 100) {
                setPosition('bottom');
            } else {
                setPosition('top');
            }
        }
    }, [isVisible]);

    return (
        <div
            ref={triggerRef}
            className="relative inline-block cursor-help group"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 w-64 p-4 text-xs font-light tracking-wide text-white bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl transition-all duration-300 animate-fade-in left-1/2 -translate-x-1/2 ${position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'}`}
                >
                    {/* Arrow */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent ${position === 'top' ? 'border-t-black/90 -bottom-2' : 'border-b-black/90 -top-2'}`}
                    ></div>

                    {content}
                </div>
            )}
        </div>
    );
};

export default ToolTip;
