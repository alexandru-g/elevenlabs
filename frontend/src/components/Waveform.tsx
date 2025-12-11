interface WaveformProps {
  isActive?: boolean;
  variant?: 'small' | 'medium' | 'large';
  color?: string;
}

export function Waveform({ isActive = true, variant = 'small', color = 'bg-accent-cyan' }: WaveformProps) {
  const heights = [2, 3, 5, 7, 5, 3, 1];
  const sizeClass = {
    small: 'h-4',
    medium: 'h-6',
    large: 'h-8',
  }[variant];

  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`}>
      {heights.map((height, i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full ${color} ${isActive ? 'waveform-bar' : ''}`}
          style={{
            height: isActive ? undefined : `${height * 10}%`,
            opacity: isActive ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}
