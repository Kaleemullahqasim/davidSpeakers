-- Create coach_profiles table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  specializations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for accessing coach_profiles
CREATE POLICY "Coaches can view their own profiles"
  ON public.coach_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coach profiles"
  ON public.coach_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admins can update coach profiles"
  ON public.coach_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER handle_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 