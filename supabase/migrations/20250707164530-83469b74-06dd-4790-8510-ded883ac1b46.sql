
-- Create a junction table for task assignments to support multiple assignees
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, assigned_to)
);

-- Enable RLS on task_assignments
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_assignments
CREATE POLICY "Users can view task assignments for their tasks" 
  ON public.task_assignments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.reminders r 
      WHERE r.id = task_assignments.task_id 
      AND (r.created_by = auth.uid() OR r.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Task creators can manage assignments" 
  ON public.task_assignments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.reminders r 
      WHERE r.id = task_assignments.task_id 
      AND r.created_by = auth.uid()
    )
  );

-- Add email reminder fields to reminders table
ALTER TABLE public.reminders 
ADD COLUMN send_email_reminder BOOLEAN DEFAULT false,
ADD COLUMN email_sent BOOLEAN DEFAULT false,
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;

-- Update the existing assigned_to column to be nullable since we'll use task_assignments table
-- But keep it for backward compatibility with existing single assignments
ALTER TABLE public.reminders 
ALTER COLUMN assigned_to DROP NOT NULL;

-- Create a function to get all assignees for a task
CREATE OR REPLACE FUNCTION public.get_task_assignees(task_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.name
  FROM public.task_assignments ta
  JOIN public.profiles p ON p.id = ta.assigned_to
  WHERE ta.task_id = $1
  ORDER BY p.name, p.email;
$$;
