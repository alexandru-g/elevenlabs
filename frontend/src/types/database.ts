export interface Database {
  public: {
    Tables: {
      training_scenarios: {
        Row: {
          id: string;
          title: string;
          icon: string;
          description: string;
          difficulty: number;
          category: string;
          persona_name: string;
          persona_age: number;
          persona_voice: string;
          situation: string;
          key_info: string[];
          dialogue_patterns: string[];
          background_sounds: string[];
          complications: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['training_scenarios']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['training_scenarios']['Insert']>;
      };
      training_sessions: {
        Row: {
          id: string;
          scenario_id: string | null;
          user_id: string | null;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number;
          overall_score: number;
          response_time_avg: number;
          empathy_score: number;
          protocol_score: number;
          status: 'active' | 'completed' | 'abandoned';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['training_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['training_sessions']['Insert']>;
      };
      session_messages: {
        Row: {
          id: string;
          session_id: string;
          speaker: 'operator' | 'caller';
          message: string;
          timestamp_seconds: number;
          emotion: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_messages']['Insert']>;
      };
      session_protocol_steps: {
        Row: {
          id: string;
          session_id: string;
          step_name: string;
          completed: boolean;
          completed_at_seconds: number | null;
          order_index: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_protocol_steps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_protocol_steps']['Insert']>;
      };
      coaching_feedback: {
        Row: {
          id: string;
          session_id: string;
          feedback_type: 'strength' | 'improvement';
          message: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coaching_feedback']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['coaching_feedback']['Insert']>;
      };
    };
  };
}

export type TrainingScenario = Database['public']['Tables']['training_scenarios']['Row'];
export type TrainingSession = Database['public']['Tables']['training_sessions']['Row'];
export type SessionMessage = Database['public']['Tables']['session_messages']['Row'];
export type ProtocolStep = Database['public']['Tables']['session_protocol_steps']['Row'];
export type CoachingFeedback = Database['public']['Tables']['coaching_feedback']['Row'];
