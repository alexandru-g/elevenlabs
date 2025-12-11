import { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Clock,
  Heart,
  ClipboardCheck,
  Check,
  AlertCircle,
  Headphones,
  Download,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { ProgressBar, Message } from '../components';
import type { TrainingScenario, ConversationMessage, ProtocolStepUI } from '../types';

interface SessionReviewProps {
  scenario: TrainingScenario;
  sessionData: {
    duration: number;
    messages: ConversationMessage[];
    protocolSteps: ProtocolStepUI[];
    overallScore: number;
    responseTimeAvg: number;
    empathyScore: number;
    protocolScore: number;
  };
  onBackToDashboard: () => void;
  onRetryScenario: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getScoreRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Satisfactory';
  if (score >= 60) return 'Needs Improvement';
  return 'Requires Practice';
}

function getScoreVariant(score: number): 'success' | 'warning' | 'critical' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'critical';
}

function generateFeedback(
  protocolSteps: ProtocolStepUI[],
  responseTimeAvg: number,
  empathyScore: number
): { strengths: string[]; improvements: string[] } {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (empathyScore >= 85) {
    strengths.push('Excellent calm and reassuring tone throughout the call');
  } else if (empathyScore >= 70) {
    strengths.push('Good emotional support provided to the caller');
  } else {
    improvements.push('Work on maintaining a calmer, more reassuring tone');
  }

  const completedSteps = protocolSteps.filter((s) => s.completed);
  const identifyStep = protocolSteps.find((s) => s.name === 'Identify emergency type');
  const locationStep = protocolSteps.find((s) => s.name === 'Get exact location');
  const dispatchStep = protocolSteps.find((s) => s.name === 'Dispatch appropriate units');

  if (identifyStep?.completed && identifyStep.completedAt && identifyStep.completedAt < 20) {
    strengths.push('Quick identification of emergency type');
  }

  if (locationStep?.completed) {
    if (locationStep.completedAt && locationStep.completedAt < 60) {
      strengths.push('Efficiently obtained location information');
    } else {
      improvements.push('Get specific location details earlier in the conversation');
    }
  } else {
    improvements.push('Always confirm exact location before dispatching units');
  }

  if (dispatchStep?.completed) {
    strengths.push('Successfully dispatched appropriate emergency units');
  } else {
    improvements.push('Remember to dispatch units promptly once location is confirmed');
  }

  if (responseTimeAvg < 10) {
    strengths.push('Excellent response time between messages');
  } else if (responseTimeAvg > 20) {
    improvements.push('Try to respond more quickly to maintain caller confidence');
  }

  if (completedSteps.length >= 5) {
    strengths.push('Good job maintaining caller focus during panic');
  }

  if (strengths.length === 0) {
    strengths.push('Completed the training scenario');
  }

  if (improvements.length === 0) {
    improvements.push('Continue practicing to maintain skills');
  }

  return { strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 4) };
}

export function SessionReview({
  scenario,
  sessionData,
  onBackToDashboard,
  onRetryScenario,
}: SessionReviewProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const { strengths, improvements } = generateFeedback(
    sessionData.protocolSteps,
    sessionData.responseTimeAvg,
    sessionData.empathyScore
  );

  const starCount = Math.ceil(sessionData.overallScore / 25);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-text-primary mb-1">
                Training Session Review
              </h1>
              <p className="text-text-secondary">
                {scenario.icon} {scenario.title} - {formatDuration(sessionData.duration)} duration
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-text-primary">{sessionData.overallScore}%</p>
              <div className="flex items-center gap-1 justify-end">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < starCount
                        ? 'text-status-warning fill-status-warning'
                        : 'text-bg-hover'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-bg-tertiary rounded-md p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-accent-blue" />
                <span className="text-sm text-text-secondary">Response Time</span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">
                {sessionData.responseTimeAvg.toFixed(1)}s
              </p>
              <ProgressBar
                value={Math.max(0, 100 - sessionData.responseTimeAvg * 3)}
                variant={sessionData.responseTimeAvg < 15 ? 'success' : 'warning'}
                size="sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                {sessionData.responseTimeAvg < 15 ? 'Good' : 'Needs Work'}
              </p>
            </div>

            <div className="bg-bg-tertiary rounded-md p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-accent-red" />
                <span className="text-sm text-text-secondary">Empathy Score</span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">
                {sessionData.empathyScore}%
              </p>
              <ProgressBar
                value={sessionData.empathyScore}
                variant={getScoreVariant(sessionData.empathyScore)}
                size="sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                {getScoreRating(sessionData.empathyScore)}
              </p>
            </div>

            <div className="bg-bg-tertiary rounded-md p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ClipboardCheck className="w-4 h-4 text-status-success" />
                <span className="text-sm text-text-secondary">Protocol Score</span>
              </div>
              <p className="text-2xl font-semibold text-text-primary">
                {sessionData.protocolScore}%
              </p>
              <ProgressBar
                value={sessionData.protocolScore}
                variant={getScoreVariant(sessionData.protocolScore)}
                size="sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                {getScoreRating(sessionData.protocolScore)}
              </p>
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-md p-4 mb-6">
            <h3 className="text-base font-medium text-text-primary mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-accent-blue" />
              Protocol Adherence Checklist
            </h3>
            <div className="space-y-2">
              {sessionData.protocolSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {step.completed ? (
                      <div className="w-5 h-5 rounded-full bg-status-success flex items-center justify-center">
                        <Check className="w-3 h-3 text-bg-primary" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-status-warning/20 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-status-warning" />
                      </div>
                    )}
                    <span
                      className={`text-sm ${
                        step.completed ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {step.completedAt !== undefined && (
                    <span className="text-xs text-text-tertiary font-mono">
                      {formatDuration(step.completedAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-tertiary rounded-md p-4 mb-6">
            <h3 className="text-base font-medium text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-cyan" />
              Coaching Feedback
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-status-success mb-3">Strengths</h4>
                <ul className="space-y-2">
                  {strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-status-warning mb-3">
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <AlertCircle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {showTranscript && (
            <div className="bg-bg-tertiary rounded-md p-4 mb-6 animate-fade-in">
              <h3 className="text-base font-medium text-text-primary mb-4">Call Transcript</h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {sessionData.messages.map((msg) => (
                  <Message key={msg.id} message={msg} />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="btn-secondary flex items-center gap-2"
            >
              <Headphones className="w-4 h-4" />
              {showTranscript ? 'Hide Transcript' : 'View Transcript'}
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Report
            </button>
            <button
              onClick={onRetryScenario}
              className="btn-primary flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Scenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
