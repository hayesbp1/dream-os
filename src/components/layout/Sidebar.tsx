import { useState, useRef, useEffect } from 'react';
import { Cpu, Folder, Books, Brain, PaperPlaneRight, SpeakerHigh, Calendar, Gear } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { useGuardian } from '../../hooks/useGuardian';
import type { EnergyState } from '../modules/FlowDispatcher';

import type { Project } from '../../types';

type View = 'theory' | 'library' | 'projects' | 'sonic' | 'temporal' | 'settings';

export interface SidebarProps {
    activeView: View;
    onNavigate: (view: View) => void;
    guardianOpen: boolean;
    onToggleGuardian: () => void;
    energy: EnergyState;
    projects: Project[];
}

export function Sidebar({ activeView, onNavigate, guardianOpen, onToggleGuardian, energy, projects }: SidebarProps) {
    const navItems = [
        { id: 'projects', label: 'Projects', icon: Folder },
        { id: 'theory', label: 'Theory Lab', icon: Brain },
        { id: 'library', label: 'Library', icon: Books },
        { id: 'sonic', label: 'Sonic Scapes', icon: SpeakerHigh },

        { id: 'temporal', label: 'Temporal', icon: Calendar },
        { id: 'settings', label: 'Settings', icon: Gear },
    ] as const;

    const { messages, isThinking, sendMessage } = useGuardian({ activeView, energyLevel: energy, projects });
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input, { activeView, energyLevel: energy, projects });
        setInput('');
    };

    return (
        <>
            <aside className="hidden md:flex w-80 h-full flex-col gap-4 relative z-50">
                {/* Guardian Profile - Toggle Button */}
                <button
                    onClick={onToggleGuardian}
                    className="glass-panel rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden shrink-0 h-24 text-left transition-transform active:scale-95 group"
                >
                    <div className="absolute top-0 left-0 right-0 h-1/2 glossy-overlay opacity-60 pointer-events-none" />
                    <div className={cn(
                        "w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-green-400 shadow-inner flex items-center justify-center border-2 border-white/60 relative z-10 transition-all",
                        guardianOpen ? "box-shadow-glow" : "grayscale opacity-80",
                        isThinking && "animate-pulse shadow-[0_0_30px_rgba(72,187,120,0.6)]"
                    )}>
                        <Cpu weight="duotone" className={cn("text-white w-8 h-8 drop-shadow-md", isThinking && "animate-spin-slow")} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-white font-bold text-lg drop-shadow-sm font-sans tracking-wide">Guardian</h2>
                        <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full transition-colors",
                                isThinking ? "bg-blue-400 animate-ping" :
                                    guardianOpen ? "bg-green-400 animate-pulse box-shadow-glow" : "bg-gray-400"
                            )} />
                            <span className="text-white/80 text-xs font-medium">
                                {isThinking ? "Thinking..." : guardianOpen ? "Online" : "Standby"}
                            </span>
                        </div>
                    </div>
                </button>

                {/* Navigation Menu */}
                <nav className="glass-panel rounded-3xl p-4 flex flex-col gap-2 shrink-0">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as View)}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm",
                                activeView === item.id
                                    ? "bg-white/20 text-white shadow-inner border border-white/20"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <item.icon weight="duotone" className={cn("w-5 h-5", activeView === item.id ? "text-white" : "text-current")} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Chat Area - Only visible if Guardian is Open */}
                {guardianOpen && (
                    <div className="glass-panel rounded-3xl flex-1 relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="absolute top-0 left-0 right-0 h-20 glossy-overlay opacity-40 pointer-events-none" />

                        {/* Messages List */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 relative z-10 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "p-3 rounded-2xl text-sm shadow-sm border border-white/20 max-w-[90%]",
                                        msg.role === 'user'
                                            ? "bg-blue-500/20 text-white self-end rounded-br-sm ml-auto"
                                            : "bg-white/10 backdrop-blur-md text-white/90 self-start rounded-tl-sm"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            {isThinking && messages[messages.length - 1]?.role !== 'model' && (
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl rounded-tl-sm text-sm text-white/90 shadow-sm border border-white/20 self-start max-w-[90%] animate-pulse">
                                    ...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-gradient-to-t from-black/40 to-transparent shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Command..."
                                    className="w-full bg-black/20 backdrop-blur-md rounded-full px-4 py-3 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:bg-black/40 focus:border-white/40 transition-all shadow-inner pr-10"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                                >
                                    <PaperPlaneRight weight="duotone" className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Navigation - Bottom Dock */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
                {/* Guardian Toggle - Floating above nav */}
                <button
                    onClick={onToggleGuardian}
                    className={cn(
                        "absolute -top-16 right-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-green-400 shadow-lg flex items-center justify-center border-2 border-white/60 transition-all active:scale-95",
                        guardianOpen ? "box-shadow-glow" : "grayscale opacity-80",
                        isThinking && "animate-pulse shadow-[0_0_30px_rgba(72,187,120,0.6)]"
                    )}
                >
                    <Cpu weight="duotone" className={cn("text-white w-6 h-6", isThinking && "animate-spin-slow")} />
                </button>

                <nav className="glass-panel rounded-2xl p-2 flex justify-between items-center shadow-2xl">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as View)}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl transition-all w-full",
                                activeView === item.id
                                    ? "bg-white/20 text-white shadow-inner"
                                    : "text-white/60 hover:text-white"
                            )}
                        >
                            <item.icon weight="duotone" className={cn("w-6 h-6", activeView === item.id ? "text-white" : "text-current")} />
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
}


