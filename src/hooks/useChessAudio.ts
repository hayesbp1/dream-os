import { useState, useCallback, useRef, useEffect } from 'react';

// Using standard Lichess sounds via a reliable CDN or direct raw GitHub links if needed.
// These are common placeholder URLs for chess sounds.
const SOUNDS = {
    move: '/sounds/Move.mp3',
    capture: '/sounds/Capture.mp3',
    castle: '/sounds/Move.mp3',
    notify: '/sounds/Victory.mp3',
    illegal: '/sounds/Explosion.mp3',
    game_over: '/sounds/GenericNotify.mp3'
};

export function useChessAudio() {
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5); // Default 50%
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

    useEffect(() => {
        // Preload sounds
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audioRefs.current[key] = audio;
        });
    }, []);

    const play = useCallback((soundName: keyof typeof SOUNDS) => {
        if (isMuted) return;

        const audio = audioRefs.current[soundName];
        if (audio) {
            audio.volume = volume;
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play failed", e));
        }
    }, [isMuted, volume]);

    return {
        isMuted,
        volume,
        setVolume,
        toggleMute: () => setIsMuted(prev => !prev),
        playMove: () => play('move'),
        playCapture: () => play('capture'),
        playCastle: () => play('castle'),
        playSuccess: () => play('notify'),
        playError: () => play('illegal'),
        playGameOver: () => play('game_over')
    };
}
