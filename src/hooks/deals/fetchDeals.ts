import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal';

// Cap to a large-but-bounded value so we don't ask Postgres/PostgREST to stream
// the entire table — and so the JSON payload stays predictable.
const MAX_DEALS = 10000;

export async function fetchDeals(_userId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_DEALS);

  if (error) {
    console.error('Error fetching deals:', error);
    throw new Error(error.message);
  }

  return (data as Deal[] | null) ?? [];
}
