
import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    separator?: boolean;
    className?: string;
    decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    prefix = '',
    suffix = '',
    duration = 1200,
    separator = true,
    className = '',
    decimals = 0,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const prevValueRef = useRef(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;

        if (startValue === endValue) return;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for premium feel
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (endValue - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                prevValueRef.current = endValue;
            }
        };

        startTimeRef.current = null;
        rafRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(rafRef.current);
    }, [value, duration]);

    const formatted = separator
        ? displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : displayValue.toFixed(decimals);

    return (
        <span className={`tabular-nums ${className}`}>
            {prefix}{formatted}{suffix}
        </span>
    );
};

export default AnimatedCounter;
