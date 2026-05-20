ALTER TABLE public.agent_actions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'agent_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;
  END IF;
END $$;