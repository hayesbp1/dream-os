import { Sliders, Image, Monitor, Sun, Moon } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import type { SystemSettings } from '../../types';

interface SettingsProps {
    settings: SystemSettings;
    onUpdateSettings: (newSettings: SystemSettings) => void;
}

const WALLPAPERS = [
    {
        id: 'dream-teal',
        name: 'Dream Teal',
        value: `radial-gradient(at 0% 0%, rgba(103, 232, 249, 0.7) 0, transparent 50%),
                radial-gradient(at 50% 100%, rgba(15, 118, 110, 1) 0, transparent 50%),
                radial-gradient(at 100% 0%, rgba(45, 212, 191, 0.6) 0, transparent 50%)`
    },
    {
        id: 'deep-space',
        name: 'Deep Space',
        value: `radial-gradient(at 80% 0%, rgba(124, 58, 237, 0.4) 0, transparent 50%),
                radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.4) 0, transparent 50%),
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.5) 0, transparent 50%),
                linear-gradient(to bottom, #0f172a, #020617)`
    },
    {
        id: 'sunset-bliss',
        name: 'Sunset Bliss',
        value: `linear-gradient(to bottom, #f43f5e, #fb923c, #fef08a)`
    },
    {
        id: 'midnight-glass',
        name: 'Midnight Glass',
        value: `conic-gradient(from 0deg at 50% 50%, #1e293b, #0f172a, #334155, #1e293b)`
    }
];

export function Settings({ settings, onUpdateSettings }: SettingsProps) {
    const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateSettings({ ...settings, glassBlur: parseInt(e.target.value) });
    };

    const handleWallpaperChange = (wallpaper: string) => {
        onUpdateSettings({ ...settings, wallpaper });
    };

    const handleThemeChange = (theme: 'day' | 'night') => {
        onUpdateSettings({ ...settings, theme });
    };

    return (
        <section className="h-full flex flex-col gap-6 overflow-hidden p-2">
            <header className="flex flex-col gap-2 shrink-0">
                <h1 className="text-4xl font-light text-white tracking-tight flex items-center gap-3">
                    <Sliders weight="duotone" className="w-10 h-10 opacity-80" />
                    System Settings
                </h1>
                <p className="text-white/60 font-medium ml-1">Customize your Dream OS experience.</p>
            </header>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">

                {/* Glass Intensity Section */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white/90">
                        <Monitor weight="duotone" className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Glass Intensity</h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-white/60 font-medium uppercase tracking-wider">
                            <span>Clear</span>
                            <span>Frosted</span>
                            <span>Opaque</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="40"
                            value={settings.glassBlur}
                            onChange={handleBlurChange}
                            className="w-full h-2 rounded-full appearance-none bg-white/20 cursor-pointer accent-cyan-400 hover:bg-white/30 transition-colors"
                        />
                        <div className="text-right text-white/50 text-sm">{settings.glassBlur}px blur</div>
                    </div>
                </div>

                {/* Wallpaper Section */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white/90">
                        <Image weight="duotone" className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Wallpaper</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {WALLPAPERS.map((wp) => (
                            <button
                                key={wp.id}
                                onClick={() => handleWallpaperChange(wp.value)}
                                className={cn(
                                    "relative h-32 rounded-xl border-2 transition-all overflow-hidden group",
                                    settings.wallpaper === wp.value
                                        ? "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-[1.02]"
                                        : "border-transparent hover:border-white/40 hover:scale-[1.01]"
                                )}
                            >
                                <div
                                    className="absolute inset-0 z-0"
                                    style={{ background: wp.value }}
                                />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-center justify-between">
                                    <span className="text-white text-sm font-medium">{wp.name}</span>
                                    {settings.wallpaper === wp.value && (
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Toggle Section */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white/90">
                        {settings.theme === 'day' ? <Sun weight="duotone" className="w-6 h-6" /> : <Moon weight="duotone" className="w-6 h-6" />}
                        <h3 className="text-lg font-bold">Theme Mode</h3>
                    </div>

                    <div className="flex bg-black/20 p-1 rounded-xl">
                        <button
                            onClick={() => handleThemeChange('day')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium",
                                settings.theme === 'day'
                                    ? "bg-white/90 text-teal-900 shadow-md"
                                    : "text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Sun weight="bold" />
                            Day
                        </button>
                        <button
                            onClick={() => handleThemeChange('night')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium",
                                settings.theme === 'night'
                                    ? "bg-indigo-900/80 text-white shadow-md border border-white/10"
                                    : "text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Moon weight="bold" />
                            Night
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}
