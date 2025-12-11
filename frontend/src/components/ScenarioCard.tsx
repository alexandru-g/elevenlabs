import { ArrowRight } from 'lucide-react';
import { DifficultyIndicator } from './DifficultyIndicator';
import type { TrainingScenario } from '../types';

interface ScenarioCardProps {
  scenario: TrainingScenario;
  onStart: (scenario: TrainingScenario) => void;
}

export function ScenarioCard({ scenario, onStart }: ScenarioCardProps) {
  return (
    <div className="card p-5 hover:border-white/10 transition-all duration-200 group">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{scenario.icon}</div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-text-primary mb-1">{scenario.title}</h3>
          <p className="text-sm text-text-secondary line-clamp-2">{scenario.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <DifficultyIndicator level={scenario.difficulty} />

        <button
          onClick={() => onStart(scenario)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-accent-blue hover:bg-accent-blue/10 rounded transition-all duration-200 group-hover:translate-x-1"
        >
          Start Training
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
