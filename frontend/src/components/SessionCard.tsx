import { Star } from 'lucide-react';

interface SessionCardProps {
  icon: string;
  title: string;
  score: number;
  date: string;
  onClick?: () => void;
}

export function SessionCard({ icon, title, score, date, onClick }: SessionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 hover:bg-bg-hover rounded transition-colors text-left"
    >
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-tertiary">{date}</p>
      </div>
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 text-status-warning fill-status-warning" />
        <span className="text-sm font-medium text-text-primary">{score}%</span>
      </div>
    </button>
  );
}
