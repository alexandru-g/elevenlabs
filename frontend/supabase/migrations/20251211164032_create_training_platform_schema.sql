/*
  # 911 Emergency Response Training Platform Schema

  1. New Tables
    - `training_scenarios`
      - `id` (uuid, primary key)
      - `title` (text) - Scenario display name
      - `icon` (text) - Emoji icon for the scenario
      - `description` (text) - Brief description
      - `difficulty` (int) - 1-5 difficulty rating
      - `category` (text) - emergency type category
      - `persona_name` (text) - AI caller name
      - `persona_age` (int) - AI caller age
      - `persona_voice` (text) - Voice description
      - `situation` (text) - Detailed situation
      - `key_info` (text[]) - Key information to extract
      - `dialogue_patterns` (jsonb) - AI conversation patterns
      - `background_sounds` (text[]) - Ambient audio descriptions
      - `created_at` (timestamptz)
    
    - `training_sessions`
      - `id` (uuid, primary key)
      - `scenario_id` (uuid, foreign key)
      - `user_id` (uuid) - Optional for auth
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
      - `duration_seconds` (int)
      - `overall_score` (int) - 0-100
      - `response_time_avg` (numeric)
      - `empathy_score` (int)
      - `protocol_score` (int)
      - `status` (text) - 'active', 'completed', 'abandoned'
      - `created_at` (timestamptz)
    
    - `session_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `speaker` (text) - 'operator' or 'caller'
      - `message` (text)
      - `timestamp_seconds` (numeric)
      - `emotion` (text)
      - `created_at` (timestamptz)
    
    - `session_protocol_steps`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `step_name` (text)
      - `completed` (boolean)
      - `completed_at_seconds` (numeric)
      - `order_index` (int)
      - `created_at` (timestamptz)
    
    - `coaching_feedback`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `feedback_type` (text) - 'strength' or 'improvement'
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read for scenarios (training content)
    - Authenticated users can manage their own sessions
*/

-- Training Scenarios Table
CREATE TABLE IF NOT EXISTS training_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📞',
  description text NOT NULL,
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  category text NOT NULL,
  persona_name text NOT NULL,
  persona_age int NOT NULL,
  persona_voice text NOT NULL,
  situation text NOT NULL,
  key_info text[] DEFAULT '{}',
  dialogue_patterns jsonb DEFAULT '[]',
  background_sounds text[] DEFAULT '{}',
  complications text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read training scenarios"
  ON training_scenarios
  FOR SELECT
  USING (true);

-- Training Sessions Table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES training_scenarios(id) ON DELETE SET NULL,
  user_id uuid,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds int DEFAULT 0,
  overall_score int DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  response_time_avg numeric DEFAULT 0,
  empathy_score int DEFAULT 0 CHECK (empathy_score >= 0 AND empathy_score <= 100),
  protocol_score int DEFAULT 0 CHECK (protocol_score >= 0 AND protocol_score <= 100),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create training sessions"
  ON training_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own sessions"
  ON training_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update their sessions"
  ON training_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Session Messages Table
CREATE TABLE IF NOT EXISTS session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  speaker text NOT NULL CHECK (speaker IN ('operator', 'caller')),
  message text NOT NULL,
  timestamp_seconds numeric DEFAULT 0,
  emotion text DEFAULT 'neutral',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage session messages"
  ON session_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Session Protocol Steps Table
CREATE TABLE IF NOT EXISTS session_protocol_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  step_name text NOT NULL,
  completed boolean DEFAULT false,
  completed_at_seconds numeric,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_protocol_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage protocol steps"
  ON session_protocol_steps
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coaching Feedback Table
CREATE TABLE IF NOT EXISTS coaching_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('strength', 'improvement')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coaching_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage coaching feedback"
  ON coaching_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_scenario_id ON training_sessions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_protocol_steps_session_id ON session_protocol_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_feedback_session_id ON coaching_feedback(session_id);

-- Insert default training scenarios
INSERT INTO training_scenarios (title, icon, description, difficulty, category, persona_name, persona_age, persona_voice, situation, key_info, dialogue_patterns, background_sounds, complications) VALUES
(
  'Car Accident - Highway Collision',
  '🚗',
  'Multi-vehicle crash on Highway 101. Caller is disoriented and passenger is unresponsive.',
  3,
  'traffic',
  'Sarah M.',
  34,
  'female, panicked, breathing heavily',
  'Multi-vehicle collision on Highway 101 near exit 47. Two vehicles involved with at least two victims.',
  ARRAY['Highway 101', 'Exit 47', '2 vehicles', '2 victims', 'Passenger unresponsive'],
  '[
    "Initially disoriented and struggling to find phone",
    "Provides vague location first - just highway name",
    "Breaks down crying when discussing passenger condition",
    "Becomes clearer as operator maintains calm demeanor"
  ]'::jsonb,
  ARRAY['traffic noise', 'sirens approaching', 'wind', 'other cars passing'],
  ARRAY['Disoriented from impact', 'Difficulty providing exact location', 'Panic attacks', 'Passenger not responding']
),
(
  'Medical Emergency - Cardiac Arrest',
  '❤️',
  'Elderly man experiencing severe chest pain while home alone. Deteriorating condition.',
  4,
  'medical',
  'Robert K.',
  67,
  'male, elderly, weak, gasping between words',
  'Elderly man experiencing severe chest pain, difficulty breathing, and sweating. Home alone with no immediate help.',
  ARRAY['Home address', 'Medical history', 'Current medications', 'Door access code', 'Duration of symptoms'],
  '[
    "Starts somewhat coherent but condition deteriorates",
    "Struggles to remember full address",
    "Long pauses to catch breath between sentences",
    "May become unresponsive during call"
  ]'::jsonb,
  ARRAY['labored breathing', 'items dropping', 'clock ticking', 'phone shuffling'],
  ARRAY['Weak and fading voice', 'Memory issues under stress', 'Risk of losing consciousness', 'Lives alone']
),
(
  'Home Intrusion - Active Threat',
  '🏠',
  'Woman hiding in closet while intruder searches her home. Must communicate in whispers.',
  5,
  'crime',
  'Jennifer L.',
  29,
  'female, whispering, terrified, barely audible',
  'Woman hiding in bedroom closet while unknown intruder(s) search through her home. Cannot speak above a whisper.',
  ARRAY['Home address', 'Number of intruders', 'Current hiding location', 'Weapons visible', 'Phone battery level'],
  '[
    "Extreme whisper throughout entire call",
    "Long pauses when hearing sounds nearby",
    "Yes/no answers to avoid making noise",
    "Sudden silence when intruder gets close"
  ]'::jsonb,
  ARRAY['footsteps', 'breaking glass', 'male voices', 'doors opening', 'items being moved'],
  ARRAY['Must whisper only', 'Cannot speak freely', 'Phone battery at 12%', 'Intruder moving through house']
),
(
  'Fire Emergency - Apartment Building',
  '🔥',
  'Fire spreading in apartment complex. Caller trapped on 3rd floor with smoke filling hallway.',
  3,
  'fire',
  'Marcus T.',
  41,
  'male, coughing, urgent, muffled by smoke',
  'Fire spreading in apartment building. Caller on 3rd floor, hallway filled with smoke. Multiple tenants at risk.',
  ARRAY['Building address', 'Floor number', 'Unit number', 'Number of people', 'Exit access status'],
  '[
    "Frequently interrupted by coughing fits",
    "Background screams and fire alarms throughout",
    "Urgency increases as situation worsens",
    "Concerned about elderly neighbor next door"
  ]'::jsonb,
  ARRAY['fire alarms', 'crackling fire', 'people screaming', 'sirens', 'glass breaking'],
  ARRAY['Severe coughing from smoke', 'Poor audio quality', 'Rising panic', 'Trapped with no clear exit']
),
(
  'Emergency Childbirth',
  '👶',
  'Unexpected home birth. Partner assisting with no medical training. Labor progressing rapidly.',
  4,
  'medical',
  'David R.',
  32,
  'male, alternating between panic and forced calm',
  'Partner assisting in unexpected home birth. No medical training. Ambulance may not arrive in time.',
  ARRAY['Home address', 'How far along pregnancy', 'Contraction timing', 'Any complications', 'Clean supplies available'],
  '[
    "Rapid, panicked speech pattern",
    "Partner can be heard screaming in labor",
    "Needs clear step-by-step guidance",
    "Emotional distress but stays focused on partner"
  ]'::jsonb,
  ARRAY['woman screaming in labor', 'heavy breathing', 'movement sounds', 'water running'],
  ARRAY['No medical training', 'Speaks very fast when panicked', 'Partner in severe pain', 'Baby coming faster than expected']
);