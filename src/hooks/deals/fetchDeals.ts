
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal'; 

export async function fetchDeals(userId: string): Promise<Deal[]> {
  console.log('=== FETCH ALL DEALS DEBUG ===');
  console.log('Fetching deals for user:', userId);
  
  // First, let's check the user's authentication status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Current authenticated user:', user?.id);
  console.log('Auth error:', authError);
  
  if (authError) {
    console.error('Authentication error:', authError);
    throw new Error('Authentication failed');
  }
  
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }
  
  // Check if user is approved
  console.log('Checking user approval status...');
  const { data: approvalData, error: approvalError } = await supabase
    .from('user_approvals')
    .select('status')
    .eq('user_id', user.id)
    .single();
    
  console.log('Approval data:', approvalData);
  console.log('Approval error:', approvalError);
  
  if (approvalError && approvalError.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error checking approval status:', approvalError);
  }
  
  if (!approvalData || approvalData.status !== 'approved') {
    console.warn('User is not approved. Status:', approvalData?.status || 'not found');
    return []; // Return empty array if not approved
  }
  
  console.log('User is approved, proceeding with chunked deals fetch...');
  
  // Test the RLS function directly
  console.log('Testing is_user_approved function...');
  const { data: functionTest, error: functionError } = await supabase
    .rpc('is_user_approved', { _user_id: user.id });
    
  console.log('Function test result:', functionTest);
  console.log('Function test error:', functionError);
  
  // Now fetch ALL deals using chunking approach
  console.log('🔄 Fetching ALL deals with proper chunking...');
  
  const CHUNK_SIZE = 1000;
  let allResults: Deal[] = [];
  let offset = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    console.log(`📥 Fetching chunk starting at offset ${offset}...`);
    
    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + CHUNK_SIZE - 1);

    console.log(`Chunk result - Data: ${data?.length || 0} rows, Error: ${error?.message || 'none'}, Total count: ${count}`);
    
    if (error) {
      console.error('Error fetching deals chunk:', error);
      throw new Error(error.message);
    }
    
    if (data && data.length > 0) {
      allResults = [...allResults, ...data];
      console.log(`✅ Fetched ${data.length} deals, total so far: ${allResults.length}`);
      
      // If we got less than CHUNK_SIZE results, we've reached the end
      if (data.length < CHUNK_SIZE) {
        console.log('🏁 Reached end of data (chunk smaller than expected)');
        hasMoreData = false;
      } else {
        offset += CHUNK_SIZE;
        console.log(`⏭️ Continuing to next chunk at offset ${offset}`);
      }
    } else {
      console.log('🏁 No more data found');
      hasMoreData = false;
    }
  }

  // Explicitly cast the data to Deal[] for type safety after fetching
  const deals = allResults as Deal[];

  console.log('🎉 DEALS FETCHED SUCCESSFULLY:', deals.length || 0);
  console.log('=== END FETCH ALL DEALS DEBUG ===');
  
  return deals;
}
