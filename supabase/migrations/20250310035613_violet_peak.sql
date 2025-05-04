/*
  # Authentication System Setup

  1. New Tables
    - coach_profiles
      - user_id (uuid, references auth.users)
      - status (enum: pending, approved, rejected)
      - specializations (text[])
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - admin_audit_log
      - id (uuid)
      - user_id (uuid, references auth.users)
      - action (text)
      - details (jsonb)
      - ip_address (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
    - Add triggers for audit logging
*/

-- Create enum type for coach status
CREATE TYPE coach_status AS ENUM ('pending', 'approved', 'rejected');

-- Create coach_profiles table
CREATE TABLE IF NOT EXISTS coach_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status coach_status NOT NULL DEFAULT 'pending',
  specializations TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for coach_profiles
CREATE POLICY "Coaches can view their own profile"
  ON coach_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coach profiles"
  ON coach_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies for admin_audit_log
CREATE POLICY "Only admins can view audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for coach_profiles
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_log (user_id, action, details, ip_address)
  VALUES (
    auth.uid(),
    TG_OP,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'old_data', row_to_json(OLD),
      'new_data', row_to_json(NEW)
    ),
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for logging admin actions on coach_profiles
CREATE TRIGGER log_coach_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_action();