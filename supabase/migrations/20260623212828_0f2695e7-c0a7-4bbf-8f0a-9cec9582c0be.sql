
ALTER TABLE public.user_ai_credentials
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- Enforce at most one default per user
CREATE UNIQUE INDEX IF NOT EXISTS user_ai_credentials_one_default_per_user
  ON public.user_ai_credentials (user_id) WHERE is_default;

-- Backfill: mark each user's most-recently-updated credential as default
WITH ranked AS (
  SELECT user_id, provider,
         row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC) AS rn
  FROM public.user_ai_credentials
)
UPDATE public.user_ai_credentials c
SET is_default = true
FROM ranked r
WHERE c.user_id = r.user_id AND c.provider = r.provider AND r.rn = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.user_ai_credentials d
    WHERE d.user_id = c.user_id AND d.is_default
  );

-- Allow authenticated users to read the new column
GRANT SELECT (is_default) ON public.user_ai_credentials TO authenticated;
