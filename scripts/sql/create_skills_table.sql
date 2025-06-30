-- Create the skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  weight INTEGER NOT NULL DEFAULT 5
);

-- Create Row Level Security (RLS) policies
-- Everyone can read skills
CREATE POLICY "Everyone can read skills" ON skills
  FOR SELECT USING (true);

-- Only admins can modify skills
CREATE POLICY "Admins can insert skills" ON skills
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admins can update skills" ON skills
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admins can delete skills" ON skills
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Apply RLS to the skills table
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
