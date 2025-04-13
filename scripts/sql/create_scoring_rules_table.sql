-- Create the scoring_rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID REFERENCES skills(id) NOT NULL,
  min_occurrences INTEGER NOT NULL,
  max_occurrences INTEGER,
  score INTEGER NOT NULL
);

-- Create Row Level Security (RLS) policies
-- Everyone can read scoring rules
CREATE POLICY "Everyone can read scoring rules" ON scoring_rules
  FOR SELECT USING (true);

-- Only admins can modify scoring rules
CREATE POLICY "Admins can insert scoring rules" ON scoring_rules
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admins can update scoring rules" ON scoring_rules
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admins can delete scoring rules" ON scoring_rules
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Apply RLS to the scoring_rules table
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
