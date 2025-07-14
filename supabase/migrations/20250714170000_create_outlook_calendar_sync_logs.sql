
-- Create outlook_calendar_sync_logs table for tracking calendar sync operations
CREATE TABLE IF NOT EXISTS public.outlook_calendar_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'incremental',
  status TEXT NOT NULL DEFAULT 'started',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  events_processed INTEGER DEFAULT 0,
  deals_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outlook_calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar sync logs" 
  ON public.outlook_calendar_sync_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create calendar sync logs" 
  ON public.outlook_calendar_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update calendar sync logs" 
  ON public.outlook_calendar_sync_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);
