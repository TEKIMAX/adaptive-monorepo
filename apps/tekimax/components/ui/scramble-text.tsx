import React, { useEffect, useState, useRef } from 'react';

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

interface ScrambleTextProps {
    text: string;
    className?: string;
    hover?: boolean;
    duration?: number;
    delay?: number;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
    text,
    className = "",
    hover = false,
    duration = 2000,
    delay = 0
}) => {
    const [displayText, setDisplayText] = useState(text);
    const [isAnimating, setIsAnimating] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const originalText = text;

    const animate = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        let iteration = 0;
        const totalIterations = text.length * 3; // Number of scrambles per char approximation
        const intervalDuration = duration / totalIterations;

        const interval = setInterval(() => {
            setDisplayText(prev =>
                originalText
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return originalText[index];
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );

            if (iteration >= originalText.length) {
                clearInterval(interval);
                setIsAnimating(false);
                setDisplayText(originalText);
            }

            iteration += 1 / 3;
        }, 50); // Fixed speed feels more "hackery"
    };

    useEffect(() => {
        if (!hover) {
            const timeout = setTimeout(() => {
                const observer = new IntersectionObserver(
                    (entries) => {
                        if (entries[0].isIntersecting) {
                            animate();
                        }
                    },
                    { threshold: 0.1 }
                );

                if (elementRef.current) {
                    observer.observe(elementRef.current);
                }

                return () => observer.disconnect();
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [hover, delay]);

    return (
        <span
            ref={elementRef}
            className={`cursor-default ${className}`}
            onMouseEnter={hover ? animate : undefined}
        >
            {displayText}
        </span>
    );
};
