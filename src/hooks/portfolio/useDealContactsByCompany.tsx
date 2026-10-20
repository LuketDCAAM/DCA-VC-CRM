import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DealContact = { name: string | null; email: string | null };

export const normalizeCompanyName = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ');

/** Founder contact from the Deals table, keyed by normalized company name. */
export function useDealContactsByCompany() {
  const { data } = useQuery({
    queryKey: ['deal-contacts-by-company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('company_name, contact_name, contact_email, updated_at')
        .or('contact_name.not.is.null,contact_email.not.is.null')
        .order('updated_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const map = new Map<string, DealContact>();
      (data || []).forEach((d) => {
        const key = normalizeCompanyName(d.company_name || '');
        if (!key || map.has(key)) return;
        map.set(key, { name: d.contact_name || null, email: d.contact_email || null });
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
  const map = data ?? new Map<string, DealContact>();
  const lookup = (companyName: string | null | undefined): DealContact | null =>
    companyName ? map.get(normalizeCompanyName(companyName)) ?? null : null;
  return { lookup };
}
