-- Create admin function to approve or reject coach registrations
CREATE OR REPLACE FUNCTION approve_coach(
  coach_user_id UUID,
  approval_status TEXT,
  admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user making the approval is an admin
  SELECT raw_user_meta_data->>'role'
  INTO admin_role
  FROM auth.users
  WHERE id = admin_user_id;
  
  IF admin_role IS NULL OR admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can approve coach accounts';
    RETURN FALSE;
  END IF;
  
  -- Update the coach profile status
  UPDATE public.coach_profiles
  SET status = approval_status
  WHERE user_id = coach_user_id;
  
  -- Log the action in admin_audit_log
  INSERT INTO public.admin_audit_log
  (user_id, action, details)
  VALUES
  (
    admin_user_id, 
    'coach_approval', 
    jsonb_build_object(
      'coach_id', coach_user_id,
      'status', approval_status,
      'timestamp', now()
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create view for pending coach approvals
CREATE OR REPLACE VIEW public.pending_coach_approvals AS
SELECT
  cp.user_id,
  cp.status,
  cp.specializations,
  cp.created_at,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name
FROM
  public.coach_profiles cp
JOIN
  auth.users u ON cp.user_id = u.id
WHERE
  cp.status = 'pending'
ORDER BY
  cp.created_at ASC;

-- Create RLS policy for the view to limit access to admins
CREATE POLICY "Only admins can view pending coach approvals"
  ON public.pending_coach_approvals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE users.id = auth.uid()
    AND users.raw_user_meta_data->>'role' = 'admin'
  ));

-- Create a view for students to check if coaches are approved
CREATE OR REPLACE VIEW public.approved_coaches AS
SELECT
  cp.user_id,
  cp.specializations,
  u.raw_user_meta_data->>'full_name' as full_name
FROM
  public.coach_profiles cp
JOIN
  auth.users u ON cp.user_id = u.id
WHERE
  cp.status = 'approved'
ORDER BY
  cp.created_at ASC;

-- Allow anyone to view approved coaches
CREATE POLICY "Anyone can view approved coaches"
  ON public.approved_coaches FOR SELECT
  USING (true);

-- Create a notification table for coach approval status changes
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Create a trigger to create a notification when coach status changes
CREATE OR REPLACE FUNCTION notify_coach_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications
    (user_id, title, message)
    VALUES
    (
      NEW.user_id,
      'Coach Status Updated',
      CASE
        WHEN NEW.status = 'approved' THEN 'Your coach account has been approved. You can now start evaluating student submissions.'
        WHEN NEW.status = 'rejected' THEN 'Your coach application has been rejected. Please contact the administrator for more information.'
        ELSE 'Your coach status has been updated to ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the coach_profiles table
CREATE TRIGGER coach_status_change_notification
AFTER UPDATE ON public.coach_profiles
FOR EACH ROW
EXECUTE FUNCTION notify_coach_status_change(); 