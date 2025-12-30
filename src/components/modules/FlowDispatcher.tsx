
import { BatteryFull, BatteryHigh, BatteryLow, Lightning } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export type EnergyState = 'high' | 'med' | 'low';


interface FlowDispatcherProps {
    energy: EnergyState;
    setEnergy: (energy: EnergyState) => void;
}

export function FlowDispatcher({ energy, setEnergy }: FlowDispatcherProps) {

    const states = [
        { id: 'high', label: 'High Energy', icon: BatteryFull, color: 'text-green-400', bg: 'bg-green-400/20', border: 'border-green-400/50' },
        { id: 'med', label: 'Med Energy', icon: BatteryHigh, color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/50' },
        { id: 'low', label: 'Low Energy', icon: BatteryLow, color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/50' },
    ] as const;

    return (
        <div className="glass-panel p-6 rounded-3xl h-full flex flex-col relative overflow-hidden group bg-black/20">
            <div className="absolute top-0 left-0 right-0 h-20 glossy-overlay opacity-40 pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <Lightning weight="duotone" className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg tracking-wide drop-shadow-md">Flow Dispatcher</h3>
            </div>

            <div className="flex flex-col gap-3 relative z-10 flex-1">
                {states.map((state) => (
                    <button
                        key={state.id}
                        onClick={() => setEnergy(state.id)}
                        className={cn(
                            "relative w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border backdrop-blur-sm group/btn",
                            energy === state.id
                                ? cn("bg-white/20", state.border, "shadow-[0_0_20px_rgba(255,255,255,0.1)]")
                                : "bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            energy === state.id ? state.bg : "bg-white/10"
                        )}>
                            <state.icon weight="duotone" className={cn("w-6 h-6", state.color)} />
                        </div>

                        <div className="flex flex-col items-start text-left">
                            <span className={cn(
                                "font-bold transition-colors text-base",
                                energy === state.id ? "text-white" : "text-white/80 group-hover/btn:text-white"
                            )}>
                                {state.label}
                            </span>
                            {energy === state.id && (
                                <span className="text-xs text-white/70 font-medium">Active State</span>
                            )}
                        </div>

                        {energy === state.id && (
                            <motion.div
                                layoutId="active-glow"
                                className={cn("absolute inset-0 rounded-2xl border-2 opacity-50", state.border)}
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
