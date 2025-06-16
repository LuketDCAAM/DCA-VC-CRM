
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal';

export async function fetchDeals(userId: string): Promise<Deal[]> {
  console.log('=== FETCH DEALS DEBUG ===');
  console.log('Fetching deals for user:', userId);
  
  // First, let's check the total count in the database for this user
  const { count: totalCount, error: countError } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId);

  if (countError) {
    console.error("Error getting total count:", countError);
  } else {
    console.log('🔍 TOTAL DEALS IN DATABASE for user:', totalCount);
  }

  // Now fetch the actual data with increased limit
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(10000); // Add limit to prevent hitting default 1000-row limit

  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error(error.message);
  }
  
  console.log('📊 FETCHED DEALS COUNT:', data?.length || 0);
  console.log('📊 DATABASE TOTAL COUNT:', totalCount);
  
  if (data && totalCount && data.length !== totalCount) {
    console.warn('⚠️ MISMATCH: Fetched', data.length, 'but database reports', totalCount, 'total');
  }
  
  console.log('Pipeline stage distribution:', data?.reduce((acc, deal) => {
    acc[deal.pipeline_stage] = (acc[deal.pipeline_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));
  
  // Let's also check if there are deals for other users to understand the total scope
  const { count: globalCount, error: globalError } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
    
  if (!globalError) {
    console.log('🌍 TOTAL DEALS IN ENTIRE DATABASE:', globalCount);
  }
  
  console.log('=== END FETCH DEALS DEBUG ===');
  
  return data || [];
}
