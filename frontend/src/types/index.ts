export * from './database';

export type AppView = 'dashboard' | 'training' | 'review';

export interface ConversationMessage {
  id: string;
  speaker: 'operator' | 'caller';
  message: string;
  timestamp: number;
  emotion?: string;
}

export interface ProtocolStepUI {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: number;
  order: number;
}

export interface TrainingStats {
  totalCalls: number;
  avgDuration: string;
  successRate: number;
  improvement: number;
}

export interface SessionReviewData {
  session: {
    id: string;
    scenarioTitle: string;
    scenarioIcon: string;
    date: string;
    duration: string;
    overallScore: number;
    responseTimeAvg: number;
    empathyScore: number;
    protocolScore: number;
  };
  protocolSteps: ProtocolStepUI[];
  strengths: string[];
  improvements: string[];
  messages: ConversationMessage[];
}
