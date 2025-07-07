
-- Add assigned_to column to reminders table for task assignments
ALTER TABLE public.reminders 
ADD COLUMN assigned_to uuid REFERENCES auth.users(id);

-- Add task_type column to distinguish between regular reminders and assigned tasks
ALTER TABLE public.reminders 
ADD COLUMN task_type text DEFAULT 'reminder' CHECK (task_type IN ('reminder', 'task'));

-- Add priority column for task prioritization
ALTER TABLE public.reminders 
ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add status column for task tracking
ALTER TABLE public.reminders 
ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Update RLS policies to allow users to see tasks assigned to them
CREATE POLICY "Users can view tasks assigned to them" 
  ON public.reminders 
  FOR SELECT 
  USING (auth.uid() = assigned_to);

-- Allow users to update tasks assigned to them
CREATE POLICY "Users can update tasks assigned to them" 
  ON public.reminders 
  FOR UPDATE 
  USING (auth.uid() = assigned_to);

-- Create a function to get user profiles for task assignment
CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.name
  FROM public.profiles p 
  WHERE p.email IS NOT NULL
  ORDER BY p.name, p.email;
$$;
