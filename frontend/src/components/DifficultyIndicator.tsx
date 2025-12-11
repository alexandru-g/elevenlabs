interface DifficultyIndicatorProps {
  level: number;
  maxLevel?: number;
}

export function DifficultyIndicator({ level, maxLevel = 5 }: DifficultyIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-text-tertiary mr-1">Difficulty:</span>
      <div className="flex gap-0.5">
        {Array.from({ length: maxLevel }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < level ? 'bg-accent-amber' : 'bg-bg-hover'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
