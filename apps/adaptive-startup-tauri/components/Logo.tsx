import React from 'react';

interface LogoProps {
    className?: string;
    textClassName?: string;
    imageClassName?: string;
    src?: string;
}

export const Logo: React.FC<LogoProps> = ({
    className = "flex items-center gap-2",
    textClassName = "font-serif font-bold text-xl tracking-wide text-stone-900",
    imageClassName = "h-20 w-auto rounded-lg",
    src = "/images/adaptive-startup.png"
}) => {
    return (
        <div className={className}>
            <img src={src} alt="Adaptive Startup Logo" className={imageClassName} />

        </div>
    );
};
