
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

  // Fetch all data in batches to avoid any limits
  let allDeals: Deal[] = [];
  let hasMore = true;
  let offset = 0;
  const batchSize = 1000;
  
  while (hasMore) {
    console.log(`Fetching batch starting at offset: ${offset}`);
    
    const { data: batchData, error } = await supabase
      .from('deals')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error("Error fetching deals batch:", error);
      throw new Error(error.message);
    }
    
    if (batchData && batchData.length > 0) {
      allDeals = [...allDeals, ...batchData];
      console.log(`Fetched ${batchData.length} deals in this batch. Total so far: ${allDeals.length}`);
      
      // If we got less than the batch size, we've reached the end
      if (batchData.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log('📊 FINAL FETCHED DEALS COUNT:', allDeals.length);
  console.log('📊 DATABASE TOTAL COUNT:', totalCount);
  
  if (totalCount && allDeals.length !== totalCount) {
    console.warn('⚠️ MISMATCH: Fetched', allDeals.length, 'but database reports', totalCount, 'total');
  } else {
    console.log('✅ SUCCESS: Fetched count matches database count');
  }
  
  console.log('Pipeline stage distribution:', allDeals.reduce((acc, deal) => {
    acc[deal.pipeline_stage] = (acc[deal.pipeline_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));
  
  console.log('=== END FETCH DEALS DEBUG ===');
  
  return allDeals;
}
