import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ icon: Icon, label, value, subtext, trend }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-status-success' : trend === 'down' ? 'text-status-critical' : 'text-text-tertiary';

  return (
    <div className="flex items-center gap-3 p-3 bg-bg-tertiary/50 rounded-md">
      <div className="p-2 bg-bg-hover rounded">
        <Icon className="w-4 h-4 text-accent-blue" />
      </div>
      <div>
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="text-lg font-semibold text-text-primary">{value}</p>
        {subtext && <p className={`text-xs ${trendColor}`}>{subtext}</p>}
      </div>
    </div>
  );
}
