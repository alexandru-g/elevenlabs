import { useState, useCallback } from 'react';
import { Header } from './components';
import { Dashboard, TrainingCall, SessionReview } from './views';
import { supabase } from './lib/supabase';
import type { TrainingScenario, AppView, ConversationMessage, ProtocolStepUI } from './types';

interface SessionData {
  duration: number;
  messages: ConversationMessage[];
  protocolSteps: ProtocolStepUI[];
  overallScore: number;
  responseTimeAvg: number;
  empathyScore: number;
  protocolScore: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:00`;
}

function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [activeScenario, setActiveScenario] = useState<TrainingScenario | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const handleStartTraining = useCallback((scenario: TrainingScenario) => {
    setActiveScenario(scenario);
    setView('training');
    setCallDuration(0);

    const timer = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleEndCall = useCallback(async (data: SessionData) => {
    setSessionData(data);
    setView('review');

    if (activeScenario) {
      try {
        const { data: sessionResult, error: sessionError } = await supabase
          .from('training_sessions')
          .insert({
            scenario_id: activeScenario.id,
            started_at: new Date(Date.now() - data.duration * 1000).toISOString(),
            ended_at: new Date().toISOString(),
            duration_seconds: data.duration,
            overall_score: data.overallScore,
            response_time_avg: data.responseTimeAvg,
            empathy_score: data.empathyScore,
            protocol_score: data.protocolScore,
            status: 'completed',
          })
          .select()
          .maybeSingle();

        const session = sessionResult as { id: string } | null;

        if (session && !sessionError) {
          const messagesToInsert = data.messages.map((msg) => ({
            session_id: session.id,
            speaker: msg.speaker,
            message: msg.message,
            timestamp_seconds: msg.timestamp,
            emotion: msg.emotion || 'neutral',
          }));

          await supabase.from('session_messages').insert(messagesToInsert);

          const stepsToInsert = data.protocolSteps.map((step) => ({
            session_id: session.id,
            step_name: step.name,
            completed: step.completed,
            completed_at_seconds: step.completedAt ?? null,
            order_index: step.order,
          }));

          await supabase.from('session_protocol_steps').insert(stepsToInsert);
        }
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    }
  }, [activeScenario]);

  const handleBackToDashboard = useCallback(() => {
    setView('dashboard');
    setActiveScenario(null);
    setSessionData(null);
    setCallDuration(0);
  }, []);

  const handleRetryScenario = useCallback(() => {
    if (activeScenario) {
      setSessionData(null);
      setView('training');
      setCallDuration(0);
    }
  }, [activeScenario]);

  const handleViewSession = useCallback(async (sessionId: string) => {
    const { data: sessionResult } = await supabase
      .from('training_sessions')
      .select('*, training_scenarios(*)')
      .eq('id', sessionId)
      .maybeSingle();

    interface SessionRow {
      duration_seconds: number;
      overall_score: number;
      response_time_avg: number;
      empathy_score: number;
      protocol_score: number;
      training_scenarios: TrainingScenario | null;
    }

    interface MessageRow {
      id: string;
      speaker: string;
      message: string;
      timestamp_seconds: number;
      emotion: string;
    }

    interface StepRow {
      id: string;
      step_name: string;
      completed: boolean;
      completed_at_seconds: number | null;
      order_index: number;
    }

    const session = sessionResult as SessionRow | null;

    if (session && session.training_scenarios) {
      const { data: messagesData } = await supabase
        .from('session_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp_seconds');

      const { data: stepsData } = await supabase
        .from('session_protocol_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      const messages = (messagesData || []) as MessageRow[];
      const steps = (stepsData || []) as StepRow[];

      setActiveScenario(session.training_scenarios);
      setSessionData({
        duration: session.duration_seconds,
        messages: messages.map((m) => ({
          id: m.id,
          speaker: m.speaker as 'operator' | 'caller',
          message: m.message,
          timestamp: m.timestamp_seconds,
          emotion: m.emotion,
        })),
        protocolSteps: steps.map((s) => ({
          id: s.id,
          name: s.step_name,
          completed: s.completed,
          completedAt: s.completed_at_seconds ?? undefined,
          order: s.order_index,
        })),
        overallScore: session.overall_score,
        responseTimeAvg: session.response_time_avg,
        empathyScore: session.empathy_score,
        protocolScore: session.protocol_score,
      });
      setView('review');
    }
  }, []);

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      <Header
        isTraining={view === 'training'}
        callDuration={view === 'training' ? formatTime(callDuration) : undefined}
      />

      <main className="flex-1 flex overflow-hidden">
        {view === 'dashboard' && (
          <Dashboard
            onStartTraining={handleStartTraining}
            onViewSession={handleViewSession}
          />
        )}

        {view === 'training' && activeScenario && (
          <TrainingCall scenario={activeScenario} onEndCall={handleEndCall} />
        )}

        {view === 'review' && activeScenario && sessionData && (
          <SessionReview
            scenario={activeScenario}
            sessionData={sessionData}
            onBackToDashboard={handleBackToDashboard}
            onRetryScenario={handleRetryScenario}
          />
        )}
      </main>

      {view === 'training' && (
        <div className="h-10 bg-bg-secondary border-t border-white/5 flex items-center px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-accent-cyan">Coaching Tip:</span>
            <span className="text-xs text-text-secondary">
              Good job staying calm. Try to get exact location first.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
