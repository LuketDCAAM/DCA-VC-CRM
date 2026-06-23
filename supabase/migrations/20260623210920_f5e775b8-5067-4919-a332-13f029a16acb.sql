
CREATE TABLE public.user_ai_credentials (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'anthropic' CHECK (provider IN ('anthropic')),
  encrypted_api_key text NOT NULL,
  last_4 text NOT NULL,
  default_model text NOT NULL DEFAULT 'claude-sonnet-4-5',
  last_used_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

-- Explicit column-level grants: authenticated users can read everything EXCEPT the api key.
GRANT SELECT (user_id, provider, last_4, default_model, last_used_at, last_status, last_error, created_at, updated_at)
  ON public.user_ai_credentials TO authenticated;
GRANT ALL ON public.user_ai_credentials TO service_role;

ALTER TABLE public.user_ai_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own ai credentials"
  ON public.user_ai_credentials FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER user_ai_credentials_set_updated_at
BEFORE UPDATE ON public.user_ai_credentials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
