import { useRef, useEffect } from 'react';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';

interface VisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function Visualizer({ audioRef }: VisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // For sizing
    const { analyserRef, dataArrayRef } = useAudioVisualizer(audioRef);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            const { width, height } = container.getBoundingClientRect();
            // High DPI scaling
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            ctx.scale(dpr, dpr);
            // Store logical size for drawing calculations
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };

        // Initial resize
        resize();
        window.addEventListener('resize', resize);

        let animationId: number;

        const render = () => {
            animationId = requestAnimationFrame(render);

            const analyser = analyserRef.current;
            const dataArray = dataArrayRef.current;

            if (!analyser || !dataArray) return;

            analyser.getByteFrequencyData(dataArray as any);

            // Use container logical dimensions for drawing logic
            const width = parseFloat(canvas.style.width);
            const height = parseFloat(canvas.style.height);

            // Clear
            ctx.clearRect(0, 0, width, height);

            const usableBins = Math.floor(dataArray.length / 2); // ~32 bins

            // Mirror Logic:
            // We draw usableBins * 2 bars.
            // Center is the anchor.

            const totalBars = usableBins * 2;
            const centerX = width / 2;
            // Calculate bar width based on container width
            const barWidth = (width / totalBars) * 0.8;

            for (let i = 0; i < usableBins; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                // Height scaling - make bass kick hard but not clip too much
                const barHeight = Math.max(percent * height * 0.9, 4);

                // Multichromatic Color Cycle
                // Bass (i=0) -> Treble (i=max)
                // Let's do a nice gradient cycle
                const hue = (i / usableBins) * 300 + 190; // Cyan -> Purple -> Red

                const color = `hsla(${hue}, 100%, 65%, 0.9)`;
                const glow = `hsla(${hue}, 100%, 65%, 0.5)`;

                ctx.shadowBlur = 15;
                ctx.shadowColor = glow;
                ctx.fillStyle = color;

                const y = height - barHeight;
                // Offset from center
                const xOffset = i * (barWidth + 2); // 2px gap per bar

                // Draw Right
                ctx.fillRect(centerX + xOffset, y, barWidth, barHeight);

                // Draw Left (Mirror)
                ctx.fillRect(centerX - xOffset - barWidth, y, barWidth, barHeight);
            }
        };

        render();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [analyserRef, dataArrayRef]);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />
        </div>
    );
}
