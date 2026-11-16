import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DatedFlow } from '@/lib/portfolio/irr';

export function usePortfolioCashFlows() {
  return useQuery({
    queryKey: ['portfolio-cash-flows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_cash_flows')
        .select('portfolio_company_id, flow_date, amount, flow_type, description, date_is_estimated')
        .limit(10000);
      if (error) throw error;
      const map = new Map<string, DatedFlow[]>();
      for (const r of data ?? []) {
        const list = map.get(r.portfolio_company_id) ?? [];
        list.push({
          date: r.flow_date,
          amount: Number(r.amount),
          flowType: r.flow_type,
          description: r.description,
          dateIsEstimated: r.date_is_estimated,
        });
        map.set(r.portfolio_company_id, list);
      }
      return map;
    },
  });
}
