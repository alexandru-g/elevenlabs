/*
  # Add ElevenLabs Voice IDs to Training Scenarios

  1. Changes
    - Add `voice_id` column to `training_scenarios` table for ElevenLabs voice mapping
    - Add `voice_stability` column for voice settings
    - Add `voice_similarity_boost` column for voice settings
    - Add `voice_style` column for emotional style
    - Update existing scenarios with appropriate voice IDs

  2. Voice Mappings
    - Sarah M. (Car Accident) - Female, panicked voice
    - Robert K. (Cardiac Arrest) - Male, elderly voice
    - Jennifer L. (Home Intrusion) - Female, whispering/terrified
    - Marcus T. (Fire) - Male, urgent/coughing
    - David R. (Childbirth) - Male, panicked voice

  Note: Using ElevenLabs pre-made voice IDs. Users can customize these.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_scenarios' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE training_scenarios ADD COLUMN voice_id text DEFAULT '21m00Tcm4TlvDq8ikWAM';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_scenarios' AND column_name = 'voice_stability'
  ) THEN
    ALTER TABLE training_scenarios ADD COLUMN voice_stability numeric DEFAULT 0.5;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_scenarios' AND column_name = 'voice_similarity_boost'
  ) THEN
    ALTER TABLE training_scenarios ADD COLUMN voice_similarity_boost numeric DEFAULT 0.75;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_scenarios' AND column_name = 'voice_style'
  ) THEN
    ALTER TABLE training_scenarios ADD COLUMN voice_style numeric DEFAULT 0.5;
  END IF;
END $$;

UPDATE training_scenarios
SET 
  voice_id = '21m00Tcm4TlvDq8ikWAM',
  voice_stability = 0.3,
  voice_similarity_boost = 0.8,
  voice_style = 0.8
WHERE title = 'Car Accident - Highway Collision';

UPDATE training_scenarios
SET 
  voice_id = 'TxGEqnHWrfWFTfGW9XjX',
  voice_stability = 0.6,
  voice_similarity_boost = 0.7,
  voice_style = 0.3
WHERE title = 'Medical Emergency - Cardiac Arrest';

UPDATE training_scenarios
SET 
  voice_id = 'EXAVITQu4vr4xnSDxMaL',
  voice_stability = 0.7,
  voice_similarity_boost = 0.85,
  voice_style = 0.2
WHERE title = 'Home Intrusion - Active Threat';

UPDATE training_scenarios
SET 
  voice_id = 'VR6AewLTigWG4xSOukaG',
  voice_stability = 0.4,
  voice_similarity_boost = 0.75,
  voice_style = 0.7
WHERE title = 'Fire Emergency - Apartment Building';

UPDATE training_scenarios
SET 
  voice_id = 'pNInz6obpgDQGcFmaJgB',
  voice_stability = 0.35,
  voice_similarity_boost = 0.8,
  voice_style = 0.9
WHERE title = 'Emergency Childbirth';