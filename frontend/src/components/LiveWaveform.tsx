import { useEffect, useRef } from 'react';

interface LiveWaveformProps {
  audioLevel: number;
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export function LiveWaveform({
  audioLevel,
  isActive,
  color = '#4ECDC4',
  barCount = 7,
  height = 32,
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>(Array(barCount).fill(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const canvasHeight = canvas.height;
      const barWidth = (width / barCount) * 0.6;
      const gap = (width / barCount) * 0.4;

      ctx.clearRect(0, 0, width, canvasHeight);

      barsRef.current = barsRef.current.map((bar, i) => {
        if (isActive && audioLevel > 0) {
          const centerDistance = Math.abs(i - barCount / 2);
          const centerFactor = 1 - centerDistance / (barCount / 2);
          const targetHeight = (audioLevel / 100) * (0.3 + centerFactor * 0.7);
          const randomFactor = 0.8 + Math.random() * 0.4;
          return bar + (targetHeight * randomFactor - bar) * 0.3;
        } else {
          return bar + (0.1 - bar) * 0.1;
        }
      });

      barsRef.current.forEach((barHeight, i) => {
        const x = i * (barWidth + gap) + gap / 2;
        const normalizedHeight = Math.max(0.05, Math.min(1, barHeight));
        const h = normalizedHeight * canvasHeight;
        const y = (canvasHeight - h) / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isActive, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 10}
      height={height}
      className="block"
      style={{ width: barCount * 10, height }}
    />
  );
}
