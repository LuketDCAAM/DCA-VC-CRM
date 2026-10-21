import { supabase } from '@/integrations/supabase/client';

export interface PerformanceValues {
  last_round_post_money_valuation: number | null;
  last_round_price_per_share: number | null;
  current_ownership_percentage: number | null;
}

export async function savePerformance(companyId: string, values: PerformanceValues, refresh: () => Promise<unknown>) {
  const { data, error } = await supabase.from('current_valuations').upsert({
    portfolio_company_id: companyId,
    last_round_post_money_valuation: values.last_round_post_money_valuation == null ? null : Math.round(values.last_round_post_money_valuation * 100),
    last_round_price_per_share: values.last_round_price_per_share == null ? null : Math.round(values.last_round_price_per_share * 100),
    current_ownership_percentage: values.current_ownership_percentage,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'portfolio_company_id', ignoreDuplicates: false }).select('id').single();
  if (error) throw error;
  if (!data) throw new Error('Performance could not be saved. Refresh the company and try again.');
  await refresh();
}