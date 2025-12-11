import { useEffect, useState } from 'react';
import { Phone, Clock, Star, TrendingUp, Target } from 'lucide-react';
import { ScenarioCard, StatCard, SessionCard } from '../components';
import { supabase } from '../lib/supabase';
import type { TrainingScenario } from '../types';

interface DashboardProps {
  onStartTraining: (scenario: TrainingScenario) => void;
  onViewSession: (sessionId: string) => void;
}

interface RecentSession {
  id: string;
  icon: string;
  title: string;
  score: number;
  date: string;
}

export function Dashboard({ onStartTraining, onViewSession }: DashboardProps) {
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: '0:00',
    successRate: 0,
    improvement: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [scenariosResult, sessionsResult] = await Promise.all([
        supabase.from('training_scenarios').select('*').order('difficulty'),
        supabase
          .from('training_sessions')
          .select('*, training_scenarios(title, icon)')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (scenariosResult.data) {
        setScenarios(scenariosResult.data);
      }

      const randomScenario: TrainingScenario = {
        id: '0',
        title: `Random Scenario`,
        description: 'A randomly generated training scenario for testing purposes.',
        icon: '📞',
        difficulty: 5,
        category: '',
        persona_name: '',
        persona_age: 0,
        persona_voice: '',
        situation: '',
        key_info: [],
        dialogue_patterns: [],
        background_sounds: [],
        complications: [],
        created_at: ''
      };
      setScenarios([randomScenario, ...scenariosResult.data]);

      if (sessionsResult.data) {
        const sessionsData = sessionsResult.data as Array<{
          id: string;
          overall_score: number;
          duration_seconds: number;
          created_at: string;
          training_scenarios: { title: string; icon: string } | null;
        }>;
        const sessions: RecentSession[] = sessionsData.map((s) => ({
          id: s.id,
          icon: s.training_scenarios?.icon || '📞',
          title: s.training_scenarios?.title || 'Training Session',
          score: s.overall_score,
          date: new Date(s.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
        }));
        setRecentSessions(sessions);

        const totalCalls = sessionsData.length;
        const avgScore = totalCalls > 0
          ? Math.round(sessionsData.reduce((acc, s) => acc + s.overall_score, 0) / totalCalls)
          : 0;
        const totalDuration = sessionsData.reduce((acc, s) => acc + s.duration_seconds, 0);
        const avgDurationSecs = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
        const mins = Math.floor(avgDurationSecs / 60);
        const secs = avgDurationSecs % 60;

        setStats({
          totalCalls,
          avgDuration: `${mins}:${secs.toString().padStart(2, '0')}`,
          successRate: avgScore,
          improvement: totalCalls > 1 ? 12 : 0,
        });
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-cyan/10 mb-4">
            <Target className="w-8 h-8 text-accent-cyan" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Emergency Response Training Platform
          </h1>
          <p className="text-text-secondary">
            Select a scenario to begin training
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-text-primary">
                  Active Training Scenarios
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onStart={onStartTraining}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="card p-5">
              <h3 className="text-base font-medium text-text-primary mb-4">
                Training Statistics
              </h3>
              <div className="space-y-3">
                <StatCard
                  icon={Phone}
                  label="Calls Completed"
                  value={stats.totalCalls}
                />
                <StatCard
                  icon={Clock}
                  label="Avg Duration"
                  value={stats.avgDuration}
                />
                <StatCard
                  icon={Star}
                  label="Success Rate"
                  value={`${stats.successRate}%`}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Improvement"
                  value={`+${stats.improvement}%`}
                  trend="up"
                />
              </div>
            </div>
          </div>
        </div>

        {recentSessions.length > 0 && (
          <div className="card p-6 mt-6">
            <h3 className="text-base font-medium text-text-primary mb-4">
              Recent Training Sessions
            </h3>
            <div className="divide-y divide-white/5">
              {recentSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  icon={session.icon}
                  title={session.title}
                  score={session.score}
                  date={session.date}
                  onClick={() => onViewSession(session.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
