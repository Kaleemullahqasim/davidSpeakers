-- Create the evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'review_requested', 'reviewed', 'error')),
  results JSONB,
  coach_feedback TEXT,
  coach_id UUID REFERENCES users(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create Row Level Security (RLS) policies
-- Students can read their own evaluations
CREATE POLICY "Students can read own evaluations" ON evaluations
  FOR SELECT USING (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  );

-- Students can update their own evaluations to request reviews
CREATE POLICY "Students can update own evaluations" ON evaluations
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  ) WITH CHECK (
    status = 'review_requested'
  );

-- Coaches can read evaluations that need review or they've reviewed
CREATE POLICY "Coaches can read evaluations" ON evaluations
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'coach' AND approved = true) AND 
    (status = 'review_requested' OR coach_id = auth.uid())
  );

-- Coaches can update evaluations to provide reviews
CREATE POLICY "Coaches can update evaluations" ON evaluations
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'coach' AND approved = true) AND 
    (status = 'review_requested' OR coach_id = auth.uid())
  ) WITH CHECK (
    status = 'reviewed'
  );

-- Admins can read all evaluations
CREATE POLICY "Admins can read all evaluations" ON evaluations
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Admins can update all evaluations
CREATE POLICY "Admins can update all evaluations" ON evaluations
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Apply RLS to the evaluations table
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
