
-- Add Outlook integration fields to reminders table
ALTER TABLE public.reminders 
ADD COLUMN outlook_task_id text,
ADD COLUMN outlook_last_sync timestamp with time zone,
ADD COLUMN sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
ADD COLUMN outlook_created_date timestamp with time zone,
ADD COLUMN outlook_modified_date timestamp with time zone;

-- Create table for storing user's Microsoft Graph tokens
CREATE TABLE public.microsoft_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  scope text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on microsoft_tokens
ALTER TABLE public.microsoft_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for microsoft_tokens
CREATE POLICY "Users can manage their own tokens" 
  ON public.microsoft_tokens 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create table for sync logs
CREATE TABLE public.outlook_sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type text NOT NULL CHECK (sync_type IN ('full', 'incremental', 'push')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  items_processed integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on outlook_sync_logs
ALTER TABLE public.outlook_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for outlook_sync_logs
CREATE POLICY "Users can view their own sync logs" 
  ON public.outlook_sync_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create sync logs" 
  ON public.outlook_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update sync logs" 
  ON public.outlook_sync_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_reminders_outlook_task_id ON public.reminders(outlook_task_id) WHERE outlook_task_id IS NOT NULL;
CREATE INDEX idx_reminders_sync_status ON public.reminders(sync_status);
CREATE INDEX idx_microsoft_tokens_user_id ON public.microsoft_tokens(user_id);
CREATE INDEX idx_outlook_sync_logs_user_id ON public.outlook_sync_logs(user_id);
