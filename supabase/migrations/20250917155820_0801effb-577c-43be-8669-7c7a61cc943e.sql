-- Fix the user registration flow by ensuring proper order of operations
-- First, let's drop the problematic foreign key constraint that references profiles
ALTER TABLE public.user_approvals DROP CONSTRAINT IF EXISTS user_approvals_user_id_fkey1;
ALTER TABLE public.user_approvals DROP CONSTRAINT IF EXISTS user_approvals_user_id_fkey2;

-- Keep only the constraint that references auth.users
-- The profiles table should be populated by the handle_new_user_profile() function

-- Update the user registration trigger to ensure it runs after profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_approval ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Recreate the triggers in the correct order
-- First create the profile (this should run first)
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Then create the user approval record (this should run second)
CREATE TRIGGER on_auth_user_created_approval
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();