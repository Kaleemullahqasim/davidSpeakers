-- Enable public read access for all tables (for testing purposes)
-- In production, you would want more restrictive policies

-- For users table
DROP POLICY IF EXISTS "Public can view users" ON users;
CREATE POLICY "Public can view users" ON users
  FOR SELECT USING (true);

-- For evaluations table
DROP POLICY IF EXISTS "Public can view evaluations" ON evaluations;
CREATE POLICY "Public can view evaluations" ON evaluations
  FOR SELECT USING (true);

-- For skills table
-- Already has "Everyone can read skills" policy, should be working

-- For scoring_rules table
-- Already has "Everyone can read scoring rules" policy, should be working

-- Make sure tables have RLS enabled but with proper public access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
