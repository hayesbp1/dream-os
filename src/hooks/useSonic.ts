import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import type { Track } from '../types';

export function useSonic() {
    const [playlist, setPlaylist] = useState<Track[]>([
        // Placeholder / Default track (could be a local asset or empty)
    ]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Element initialization
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        // Load persisted tracks from manifest
        fetch('/music/tracks.json')
            .then(res => {
                if (!res.ok) throw new Error("Manifest not found");
                return res.json();
            })
            .then((data: Track[]) => {
                console.log("Loaded tracks:", data);
                setPlaylist(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newTracks = data.filter(t => !existingIds.has(t.id));
                    return [...prev, ...newTracks];
                });
            })
            .catch(err => console.warn("Could not load tracks.json:", err));
    }, []);

    // Handle track changes
    useEffect(() => {
        if (playlist.length > 0 && playlist[currentTrackIndex]) {
            if (audioRef.current) {
                // Only update src if it changed to avoid reloading same track inappropriately
                // or check if src is empty
                const currentSrc = audioRef.current.src;
                // audio.src returns absolute path, playlist url might be blob or relative
                if (!currentSrc || !currentSrc.endsWith(playlist[currentTrackIndex].url)) {
                    audioRef.current.src = playlist[currentTrackIndex].url;
                }

                audioRef.current.volume = volume;
                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Play error:", e));
                }
            }
        }
    }, [currentTrackIndex, playlist]);

    // Handle Play/Pause
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Play failed", e);
                    setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Handle Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Update Progress
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => handleNext();

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []); // Empty dependency array to attach once? 
    // Actually, closures might be stale if we don't use functional updates or Refs for next/prev.
    // But handleEnded -> handleNext needs access to latest state.
    // Re-attaching listeners is fine, or we use a ref for the latest "next" function.
    // Simpler to rely on re-attaching for now as per original component logic.

    const handlePlayPause = () => {
        if (playlist.length === 0) return;
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (playlist.length === 0) return;
        setPlaylist(currentPlaylist => {
            // We need the index too. 
            // State updates are batched/async.
            // Better to use functional state for index update based on current index?
            // Actually, let's keep it simple. Accessing state directly in event handler (closure) 
            // works if we allow the effect to re-run and re-bind listeners when state changes.
            return currentPlaylist;
        });

        // Re-implementing logic with state access:
        setCurrentTrackIndex(prev => {
            let nextIndex = prev + 1;
            // calculated based on latest playlist length would be safer, 
            // but we can assume playlist doesn't shrink often.
            // Let's use playlist from closure, if effect re-runs on playlist change.
            if (nextIndex >= playlist.length) nextIndex = 0;
            return nextIndex;
        });
        setIsPlaying(true);
    };

    // Need to fix the stale closure in Effect
    // The previous implementation had [currentTrackIndex, playlist] as dependencies.
    // So listeners were re-attached every time track changed. That is safe.

    // Refined Re-binding effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => {
            // Logic for next track
            let nextIndex = currentTrackIndex + 1;
            if (nextIndex >= playlist.length) nextIndex = 0;
            setCurrentTrackIndex(nextIndex);
            setIsPlaying(true);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [currentTrackIndex, playlist]);


    const handlePrev = () => {
        if (playlist.length === 0) return;
        setCurrentTrackIndex(prev => {
            let prevIndex = prev - 1;
            if (prevIndex < 0) prevIndex = playlist.length - 1;
            return prevIndex;
        });
        setIsPlaying(true);
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newTracks: Track[] = Array.from(files).map((file) => ({
                id: crypto.randomUUID(),
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                artist: 'Local Upload',
                url: URL.createObjectURL(file), // Create blob URL
            }));

            setPlaylist(prev => {
                const updated = [...prev, ...newTracks];
                // If it was empty, auto-start first new track
                if (prev.length === 0) {
                    setCurrentTrackIndex(0);
                    // setIsPlaying(true); // Optional: auto-play upon upload
                }
                return updated;
            });
        }
    };

    // Seek
    const handleSeek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }

    return {
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
    };
}
