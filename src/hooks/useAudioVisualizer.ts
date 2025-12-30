import { useEffect, useRef } from 'react';

export function useAudioVisualizer(audioRef: React.RefObject<HTMLAudioElement | null>) {
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        if (!audioRef.current) return;

        // One-time visualization setup
        const setupAudio = () => {
            if (sourceRef.current) return; // Already connected

            // Initialize AudioContext
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            // Create Analyser
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128; // Balance between resolution and performance
            analyserRef.current = analyser;

            // Create Data Array
            const bufferLength = analyser.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // Connect Source -> Analyser -> Destination
            try {
                const source = ctx.createMediaElementSource(audioRef.current!);
                source.connect(analyser);
                analyser.connect(ctx.destination);
                sourceRef.current = source;
            } catch (e) {
                console.error("Audio Context connection failed", e);
            }
        };

        // We can't immediately create the source if the audio element isn't active or ready sometimes?
        // Actually, createMediaElementSource works on the element.
        // But we must handle the user interaction requirement for AudioContext.resume().

        const handleInteraction = () => {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
            setupAudio();
        };

        const audioEl = audioRef.current;
        audioEl.addEventListener('play', handleInteraction);

        return () => {
            audioEl.removeEventListener('play', handleInteraction);
            // We typically don't close the context fully or disconnect extensively if we expect reuse,
            // but for a clean cleanup:
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                // audioContextRef.current.close(); 
                // Closing context might break if we unmount/remount quickly? 
                // Better to let it persist or manage it carefully. 
                // If this is a global hook, we might want a singleton context.
                // For now, let's just leave it connected.
            }
        };
    }, [audioRef]);

    return { analyserRef, dataArrayRef };
}
