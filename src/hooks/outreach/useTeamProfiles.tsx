import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamProfile {
  id: string;
  email: string | null;
  name: string | null;
}

/** Team members available as follow-up owners. */
export function useTeamProfiles() {
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_user_profiles');
      if (!cancelled) {
        if (error) console.error('Error loading team profiles:', error);
        setProfiles((data as TeamProfile[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const label = (id: string | null | undefined) => {
    if (!id) return 'Unassigned';
    const p = profiles.find((x) => x.id === id);
    return p?.name || p?.email || 'Teammate';
  };

  return { profiles, loading, label };
}
