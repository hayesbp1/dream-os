import { useRef, type ChangeEvent } from 'react';
import { Play, Pause, SkipForward, SkipBack, SpeakerHigh, SpeakerX, MusicNotes, UploadSimple, VinylRecord } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Track } from '../../types';

interface SonicScapesProps {
    playlist: Track[];
    currentTrackIndex: number;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    setVolume: (vol: number) => void;
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    handleSeek: (time: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTrackIndex: (index: number) => void;
}

export function SonicScapes({
    playlist,
    currentTrackIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    setVolume,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleFileUpload,
    handleSeek,
    setIsPlaying,
    setCurrentTrackIndex
}: SonicScapesProps) {

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentTrack = playlist[currentTrackIndex];

    return (
        <div className="flex flex-col md:flex-row h-full gap-6 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-40 glossy-overlay opacity-30 pointer-events-none rounded-t-3xl z-0" />

            {/* Playlist Sidebar */}
            <div className="w-full md:w-1/3 flex flex-col gap-4 relative z-10 h-1/3 md:h-auto shrink-0">
                <div className="glass-panel p-4 rounded-2xl flex-1 flex flex-col overflow-hidden bg-black/20 border border-white/10">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-white/90">
                            <MusicNotes weight="duotone" className="w-5 h-5 text-purple-400" />
                            Library
                        </h2>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title="Add Songs"
                        >
                            <UploadSimple weight="bold" className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            accept="audio/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-1 scrollbar-thin scrollbar-thumb-white/20 pr-2">
                        {playlist.length === 0 ? (
                            <div className="text-center text-white/30 text-sm mt-10 italic">
                                No tracks loaded.<br />Upload local files to dream.
                            </div>
                        ) : (
                            playlist.map((track, index) => (
                                <button
                                    key={track.id}
                                    onClick={() => {
                                        setCurrentTrackIndex(index);
                                        setIsPlaying(true);
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all",
                                        index === currentTrackIndex
                                            ? "bg-white/10 border border-white/20 shadow-inner"
                                            : "hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <div className="flex flex-col overflow-hidden">
                                        <span className={cn(
                                            "truncate font-medium text-sm",
                                            index === currentTrackIndex ? "text-white" : "text-white/70 group-hover:text-white"
                                        )}>{track.title}</span>
                                        <span className="text-xs text-white/40 truncate">{track.artist}</span>
                                    </div>
                                    {index === currentTrackIndex && isPlaying && (
                                        <div className="flex gap-0.5 items-end h-3 ml-2">
                                            <motion.div
                                                animate={{ height: [4, 12, 6] }}
                                                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                                                className="w-1 bg-green-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ height: [8, 4, 10] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.1, ease: "linear" }}
                                                className="w-1 bg-blue-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ height: [6, 12, 5] }}
                                                transition={{ repeat: Infinity, duration: 0.4, delay: 0.2, ease: "linear" }}
                                                className="w-1 bg-purple-400 rounded-full"
                                            />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="flex-1 flex flex-col relative z-10 glass-panel p-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                {/* Visualizer Background (Abstract) */}
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-[80px] animate-pulse-slow" />
                </div>

                {/* Now Playing Info */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-8 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={currentTrack?.id || 'empty'}
                        className="mb-8 relative"
                    >
                        {/* Album Art Placeholder */}
                        <div className={cn(
                            "w-48 h-48 rounded-2xl bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden",
                            isPlaying && "animate-pulse"
                        )}>
                            <VinylRecord weight="duotone" className={cn("w-24 h-24 text-white/20", isPlaying && "animate-spin-slow")} />

                            {/* Glass Shine */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>

                    <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2 max-w-md truncate">
                        {currentTrack?.title || "Sonic Scapes"}
                    </h1>
                    <p className="text-white/60 text-lg font-medium tracking-wide">
                        {currentTrack?.artist || "Choose a track to dream"}
                    </p>
                </div>

                {/* Controls Bar */}
                <div className="h-32 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 flex flex-col gap-2 relative z-20">
                    {/* Progress Bar */}
                    <div className="w-full flex items-center gap-3 text-xs font-mono text-white/50">
                        <span>{formatTime(currentTime)}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-100"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            />
                            {/* Scrubber handle */}
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => handleSeek(Number(e.target.value))}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Main Actions */}
                    <div className="flex items-center justify-center gap-8 mt-2">
                        <button onClick={handlePrev} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <SkipBack weight="fill" className="w-6 h-6" />
                        </button>

                        <button
                            onClick={handlePlayPause}
                            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            {isPlaying ? (
                                <Pause weight="fill" className="w-6 h-6" />
                            ) : (
                                <Play weight="fill" className="w-6 h-6 ml-1" />
                            )}
                        </button>

                        <button onClick={handleNext} className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <SkipForward weight="fill" className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="absolute right-6 bottom-8 flex items-center gap-2 w-32">
                        {volume === 0 ? <SpeakerX className="w-4 h-4 text-white/50" /> : <SpeakerHigh className="w-4 h-4 text-white/50" />}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
