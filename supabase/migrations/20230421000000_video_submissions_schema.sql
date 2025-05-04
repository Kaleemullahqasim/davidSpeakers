-- Create video_submissions table
CREATE TABLE IF NOT EXISTS public.video_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'evaluated')),
  evaluation_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coach_assignments table to track which coach is assigned to evaluate which video
CREATE TABLE IF NOT EXISTS public.coach_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.video_submissions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assignment_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (video_id, coach_id)
);

-- Create evaluations table for coach feedback
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.coach_assignments(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  video_id UUID NOT NULL REFERENCES public.video_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id),
  feedback TEXT NOT NULL,
  grammar_score INTEGER CHECK (grammar_score BETWEEN 1 AND 10),
  vocabulary_score INTEGER CHECK (vocabulary_score BETWEEN 1 AND 10),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 1 AND 10),
  structure_score INTEGER CHECK (structure_score BETWEEN 1 AND 10),
  delivery_score INTEGER CHECK (delivery_score BETWEEN 1 AND 10),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 1 AND 10),
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (assignment_id)
);

-- Create comments table for timestamped video comments
CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.video_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Video submissions policies
CREATE POLICY "Students can view their own video submissions"
  ON public.video_submissions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own video submissions"
  ON public.video_submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own pending video submissions"
  ON public.video_submissions FOR UPDATE
  USING (auth.uid() = student_id AND status = 'pending')
  WITH CHECK (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Coaches can view video submissions assigned to them"
  ON public.video_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.coach_assignments
    WHERE coach_assignments.video_id = video_submissions.id
    AND coach_assignments.coach_id = auth.uid()
  ));

CREATE POLICY "Admins can view all video submissions"
  ON public.video_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can update any video submission"
  ON public.video_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Coach assignments policies
CREATE POLICY "Coaches can view their own assignments"
  ON public.coach_assignments FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own assignments"
  ON public.coach_assignments FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid() AND (status = 'pending' OR status = 'in_progress'));

CREATE POLICY "Admins can manage all coach assignments"
  ON public.coach_assignments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Evaluations policies
CREATE POLICY "Students can view evaluations for their submissions"
  ON public.evaluations FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Coaches can view and manage evaluations they created"
  ON public.evaluations FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all evaluations"
  ON public.evaluations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Video comments policies
CREATE POLICY "Students can view comments on their evaluations"
  ON public.video_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = video_comments.evaluation_id
    AND evaluations.student_id = auth.uid()
  ));

CREATE POLICY "Coaches can manage comments they created"
  ON public.video_comments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = video_comments.evaluation_id
    AND evaluations.coach_id = auth.uid()
  ));

CREATE POLICY "Admins can view all comments"
  ON public.video_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_video_submissions_updated_at
BEFORE UPDATE ON public.video_submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_coach_assignments_updated_at
BEFORE UPDATE ON public.coach_assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_evaluations_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 