
-- Add a name field to the profiles table if it doesn't exist (it already exists)
-- Update the trigger to handle name during registration
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with email and name from auth.users
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  RETURN NEW;
END;
$$;

-- Create a function to get all users with their profiles and roles (for admin use)
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(
  user_id uuid,
  email text,
  name text,
  roles text[],
  approval_status text,
  created_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id as user_id,
    p.email,
    p.name,
    COALESCE(
      ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::text[]
    ) as roles,
    COALESCE(ua.status::text, 'pending') as approval_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.user_approvals ua ON p.id = ua.user_id
  GROUP BY p.id, p.email, p.name, ua.status, p.created_at
  ORDER BY p.created_at DESC;
$$;

-- Create RLS policy for the new function (admins only)
CREATE POLICY "Admins can view all user profiles" ON public.profiles
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));
