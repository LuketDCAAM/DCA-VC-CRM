-- 1) Make user_approvals insert idempotent to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert pending approval, but don't fail if it already exists
  INSERT INTO public.user_approvals (user_id, status)
  VALUES (NEW.id, 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2) Normalize triggers on auth.users to avoid double inserts and ensure order
-- Drop any existing triggers related to registration/profile we don't control
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;                 -- legacy duplicate
DROP TRIGGER IF EXISTS on_auth_user_created_approval ON auth.users;        -- previous name we created
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;         -- previous name we created
DROP TRIGGER IF EXISTS a_on_auth_user_created_profile ON auth.users;       -- cleanup if exists
DROP TRIGGER IF EXISTS z_on_auth_user_created_approval ON auth.users;      -- cleanup if exists

-- Recreate with explicit alphabetical order: profile first, approval second
CREATE TRIGGER a_on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER z_on_auth_user_created_approval
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();