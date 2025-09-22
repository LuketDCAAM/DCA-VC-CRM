-- Create edge function for sending approval emails
CREATE OR REPLACE FUNCTION public.send_user_approval_email(
  user_email text,
  user_name text,
  approval_status text,
  rejection_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  response json;
BEGIN
  -- This function will be called by the frontend to trigger email sending
  -- The actual email sending will be handled by an edge function
  
  -- Log the approval action for audit purposes
  INSERT INTO public.user_approval_logs (
    user_email,
    user_name,
    approval_status,
    rejection_reason,
    created_at
  ) VALUES (
    user_email,
    user_name,
    approval_status,
    rejection_reason,
    now()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email notification queued'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Create table to log approval emails
CREATE TABLE IF NOT EXISTS public.user_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text,
  approval_status text NOT NULL,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_approval_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view approval logs
CREATE POLICY "Admins can view approval logs"
ON public.user_approval_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));