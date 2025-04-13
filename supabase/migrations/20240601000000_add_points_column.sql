-- Add points column to skill_settings_and_scores table
ALTER TABLE public.skill_settings_and_scores 
ADD COLUMN IF NOT EXISTS points REAL;

-- Comment on the column
COMMENT ON COLUMN public.skill_settings_and_scores.points IS 'Calculated points based on score × weight';
