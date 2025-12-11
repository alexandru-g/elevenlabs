import { Check, Circle, Loader2 } from 'lucide-react';
import type { ProtocolStepUI } from '../types';

interface ProtocolTrackerProps {
  steps: ProtocolStepUI[];
  currentTime?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ProtocolTracker({ steps }: ProtocolTrackerProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
        Protocol Checklist
      </h4>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = !step.completed && steps.slice(0, index).every(s => s.completed);

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-2 rounded transition-colors ${
                isActive ? 'bg-accent-blue/10' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <div className="w-5 h-5 rounded-full bg-status-success flex items-center justify-center">
                    <Check className="w-3 h-3 text-bg-primary" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border-2 border-accent-blue flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-accent-blue animate-spin" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-text-tertiary flex items-center justify-center">
                    <Circle className="w-2 h-2 text-text-tertiary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    step.completed
                      ? 'text-text-secondary'
                      : isActive
                      ? 'text-text-primary font-medium'
                      : 'text-text-tertiary'
                  }`}
                >
                  {step.name}
                </p>
              </div>
              {step.completedAt !== undefined && (
                <span className="text-xs text-text-tertiary font-mono">
                  {formatTime(step.completedAt)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
