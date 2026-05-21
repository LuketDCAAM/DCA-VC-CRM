
CREATE TABLE public.user_notion_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  access_token text not null,
  bot_id text,
  workspace_id text,
  workspace_name text,
  workspace_icon text,
  source_config jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.user_notion_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notion connection"
  ON public.user_notion_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notion connection"
  ON public.user_notion_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notion connection"
  ON public.user_notion_connections FOR DELETE
  USING (auth.uid() = user_id);

-- inserts only via service role (edge function); no insert policy for authenticated users

CREATE TRIGGER trg_user_notion_connections_updated_at
  BEFORE UPDATE ON public.user_notion_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- OAuth state (CSRF) tracking
CREATE TABLE public.notion_oauth_states (
  state text primary key,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

ALTER TABLE public.notion_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies — service role only.
