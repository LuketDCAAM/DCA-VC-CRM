import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal'; // Ensure this import is correct

export async function fetchDeals(userId: string): Promise<Deal[]> {
  console.log('=== FETCH DEALS DEBUG ===');
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
  
  // --- REMOVED USER APPROVAL CHECK ---
  // The following block has been removed to allow all authenticated users access:
  /*
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
  console.log('User is approved, proceeding with deals fetch...');
  */
  // --- END REMOVED BLOCK ---
  
  console.log('User authenticated, proceeding with deals fetch...'); // Adjusted log message
  
  // Test the RLS function directly
  console.log('Testing is_user_approved function...');
  const { data: functionTest, error: functionError } = await supabase
    .rpc('is_user_approved', { _user_id: user.id });
    
  console.log('Function test result:', functionTest);
  console.log('Function test error:', functionError);
  
  // Now try to fetch deals
  console.log('Attempting to fetch deals...');
  const { data, error, count } = await supabase
    .from('deals') 
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  console.log('Query result:');
  console.log('- Data:', data); 
  console.log('- Error:', error);
  console.log('- Count:', count);
  
  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error(error.message);
  }
  
  const deals = (data as Deal[] | null) || [];

  console.log('📊 DEALS FETCHED SUCCESSFULLY:', deals.length || 0);
  console.log('=== END FETCH DEALS DEBUG ===');
  
  return deals;
}
