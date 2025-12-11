import { Waveform } from './Waveform';
import type { ConversationMessage } from '../types';

interface MessageProps {
  message: ConversationMessage;
  isLatest?: boolean;
  showWaveform?: boolean;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function Message({ message, isLatest, showWaveform }: MessageProps) {
  const isCaller = message.speaker === 'caller';

  return (
    <div className={`animate-slide-up ${isCaller ? '' : 'flex justify-end'}`}>
      <div className={`max-w-[85%] ${isCaller ? '' : 'text-right'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-medium ${
              isCaller ? 'text-accent-amber' : 'text-accent-cyan'
            }`}
          >
            {isCaller ? 'AI CALLER' : 'OPERATOR'}
          </span>
          <span className="text-xs text-text-tertiary font-mono">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <div
          className={`p-3 rounded-md ${
            isCaller
              ? 'bg-bg-tertiary border-l-2 border-accent-amber'
              : 'bg-accent-blue/10 border-r-2 border-accent-cyan'
          }`}
        >
          <p className="text-sm text-text-primary leading-relaxed">{message.message}</p>
        </div>

        {showWaveform && isLatest && isCaller && (
          <div className="flex items-center gap-2 mt-2">
            <Waveform isActive variant="small" color="bg-accent-amber" />
          </div>
        )}
      </div>
    </div>
  );
}
