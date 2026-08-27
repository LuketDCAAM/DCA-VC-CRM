import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type PortfolioVehicle = Database['public']['Enums']['portfolio_vehicle'];
export type PositionStatus = Database['public']['Enums']['position_status'];

export const VEHICLES: PortfolioVehicle[] = [
  'Balance Sheet',
  'Fund I',
  'SPV - DCA Led',
  'SPV - Third Party',
  'Co-Invest',
];

export const POSITION_STATUSES: PositionStatus[] = [
  'Active',
  'Exited - Strategic',
  'Exited - Financial',
  'Exited - IPO',
  'Written Off',
  'Defunct',
  'On Hold',
];

export interface PortfolioPosition {
  id: string;
  portfolio_company_id: string;
  sector: string | null;
  stage: string | null;
  vehicle: PortfolioVehicle | null;
  position_status: PositionStatus;
  first_investment_date: string | null;
  last_investment_date: string | null;
  current_fmv: number | null;
  realized_proceeds: number;
  ownership_pct: number | null;
  notes: string | null;
  updated_at: string;
}

async function fetchPositions(): Promise<PortfolioPosition[]> {
  const { data, error } = await supabase
    .from('portfolio_positions')
    .select(
      'id, portfolio_company_id, sector, stage, vehicle, position_status, first_investment_date, last_investment_date, current_fmv, realized_proceeds, ownership_pct, notes, updated_at',
    );
  if (error) throw new Error(error.message);
  return (data ?? []) as PortfolioPosition[];
}

export function usePortfolioPositions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const queryKey = useMemo(() => ['portfolioPositions', user?.id], [user?.id]);

  const { data: positions = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: fetchPositions,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`portfolio_positions_${user.id}_${Math.random().toString(36).slice(2)}`);
    channelRef.current = channel;
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_positions' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, queryKey]);

  const byCompany = useMemo(() => {
    const map = new Map<string, PortfolioPosition>();
    positions.forEach((p) => map.set(p.portfolio_company_id, p));
    return map;
  }, [positions]);

  const savePosition = async (
    companyId: string,
    values: Partial<Omit<PortfolioPosition, 'id' | 'portfolio_company_id' | 'updated_at'>>,
  ) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('portfolio_positions')
        .upsert(
          { portfolio_company_id: companyId, ...values },
          { onConflict: 'portfolio_company_id' },
        );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Position saved' });
      return true;
    } catch (e) {
      toast({
        title: 'Could not save position',
        description: (e as Error).message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { positions, byCompany, loading: isLoading, saving, savePosition, refetch };
}
