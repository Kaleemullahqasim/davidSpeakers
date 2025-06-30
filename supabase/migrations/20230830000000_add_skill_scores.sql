-- Create skill_settings_and_scores table
CREATE TABLE IF NOT EXISTS public.skill_settings_and_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  weight REAL NOT NULL,
  actual_score REAL,
  actual_score_ai REAL,
  adjusted_score REAL,
  is_automated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(evaluation_id, skill_id)
);

-- Add scores_updated_at column to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS scores_updated_at TIMESTAMP WITH TIME ZONE;

-- Add final_score column to evaluations table
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS final_score REAL;

-- Create RLS policies for skill_settings_and_scores
CREATE POLICY "Coaches can insert skill scores for their evaluations" ON public.skill_settings_and_scores
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_id
    AND e.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update skill scores for their evaluations" ON public.skill_settings_and_scores
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_id
    AND e.coach_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete skill scores for their evaluations" ON public.skill_settings_and_scores
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_id
    AND e.coach_id = auth.uid()
  )
);

CREATE POLICY "Everyone can view skill scores" ON public.skill_settings_and_scores
FOR SELECT USING (true);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skill_settings_and_scores_updated_at
BEFORE UPDATE ON public.skill_settings_and_scores
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
