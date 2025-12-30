import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false }: GlassCardProps) {
    return (
        <div className={cn(
            "glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300",
            hoverEffect && "hover:bg-white/30 hover:shadow-2xl hover:-translate-y-1 hover:border-white/50",
            className
        )}>
            {/* Glossy Top Highlight */}
            <div className="absolute top-0 left-0 right-0 h-20 glossy-overlay opacity-40 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
