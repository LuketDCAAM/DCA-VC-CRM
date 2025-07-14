
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SyncRequest {
  dealId: string;
  providers: string[];
}

interface ExternalDataResult {
  success: boolean;
  provider: string;
  data?: any;
  error?: string;
  records_processed: number;
  records_updated: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { dealId, providers }: SyncRequest = await req.json()

    // Get deal information
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      throw new Error('Deal not found')
    }

    // Get API configurations for the user
    const { data: apiConfigs, error: configError } = await supabase
      .from('api_configurations')
      .select('*')
      .eq('created_by', user.id)
      .eq('is_active', true)
      .in('provider', providers)

    if (configError) {
      throw new Error('Failed to fetch API configurations')
    }

    const results: ExternalDataResult[] = []

    // Process each provider
    for (const config of apiConfigs) {
      const result = await syncWithProvider(config, deal, user.id, supabase)
      results.push(result)
    }

    // Update deal sync status
    const successCount = results.filter(r => r.success).length
    const syncStatus = successCount === results.length ? 'success' : 
                      successCount > 0 ? 'partial' : 'failed'

    await supabase
      .from('deals')
      .update({
        external_data_sync_status: syncStatus,
        external_data_last_synced: new Date().toISOString(),
      })
      .eq('id', dealId)

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function syncWithProvider(config: any, deal: any, userId: string, supabase: any): Promise<ExternalDataResult> {
  const logEntry = {
    deal_id: deal.id,
    api_provider: config.provider,
    sync_type: 'manual',
    status: 'pending',
    started_at: new Date().toISOString(),
    created_by: userId,
    records_processed: 0,
    records_updated: 0,
  }

  try {
    // Insert initial log entry
    const { data: logData } = await supabase
      .from('api_sync_logs')
      .insert(logEntry)
      .select()
      .single()

    let externalData: any = {}
    let recordsProcessed = 0
    let recordsUpdated = 0

    // Fetch data based on provider
    switch (config.provider) {
      case 'crunchbase':
        externalData = await fetchCrunchbaseData(deal.company_name, config.api_key_encrypted, config.base_url)
        break
      case 'linkedin':
        externalData = await fetchLinkedInData(deal.company_name, config.api_key_encrypted, config.base_url)
        break
      case 'apollo':
        externalData = await fetchApolloData(deal.company_name, config.api_key_encrypted, config.base_url)
        break
      case 'clearbit':
        externalData = await fetchClearbitData(deal.company_name, config.api_key_encrypted, config.base_url)
        break
      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }

    if (externalData) {
      recordsProcessed = 1
      
      // Update deal with external data
      const updateData: any = {}
      
      if (externalData.linkedin_url) updateData.linkedin_url = externalData.linkedin_url
      if (externalData.crunchbase_url) updateData.crunchbase_url = externalData.crunchbase_url
      if (externalData.total_funding_raised) updateData.total_funding_raised = externalData.total_funding_raised
      if (externalData.last_funding_date) updateData.last_funding_date = externalData.last_funding_date
      if (externalData.employee_count_range) updateData.employee_count_range = externalData.employee_count_range
      if (externalData.founded_year) updateData.founded_year = externalData.founded_year
      if (externalData.headquarters_location) updateData.headquarters_location = externalData.headquarters_location
      if (externalData.company_type) updateData.company_type = externalData.company_type

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('deals')
          .update(updateData)
          .eq('id', deal.id)
        
        recordsUpdated = 1
      }

      // Store funding rounds if available
      if (externalData.funding_rounds && externalData.funding_rounds.length > 0) {
        const fundingRounds = externalData.funding_rounds.map((round: any) => ({
          deal_id: deal.id,
          round_type: round.round_type,
          amount_raised: round.amount_raised,
          funding_date: round.funding_date,
          lead_investors: round.lead_investors,
          participating_investors: round.participating_investors,
          valuation_pre_money: round.valuation_pre_money,
          valuation_post_money: round.valuation_post_money,
          external_source: config.provider,
          external_id: round.external_id,
        }))

        await supabase
          .from('company_funding_rounds')
          .upsert(fundingRounds, { onConflict: 'deal_id,external_source,external_id' })
      }
    }

    // Update log entry
    await supabase
      .from('api_sync_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        data_fetched: externalData,
        records_processed: recordsProcessed,
        records_updated: recordsUpdated,
      })
      .eq('id', logData.id)

    return {
      success: true,
      provider: config.provider,
      data: externalData,
      records_processed: recordsProcessed,
      records_updated: recordsUpdated,
    }

  } catch (error) {
    console.error(`Error syncing with ${config.provider}:`, error)
    
    // Update log entry with error
    await supabase
      .from('api_sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('deal_id', deal.id)
      .eq('api_provider', config.provider)
      .eq('status', 'pending')

    return {
      success: false,
      provider: config.provider,
      error: error.message,
      records_processed: 0,
      records_updated: 0,
    }
  }
}

// Mock implementations for different providers
// In production, these would make actual API calls
async function fetchCrunchbaseData(companyName: string, apiKey: string, baseUrl: string) {
  // Mock Crunchbase API response
  return {
    crunchbase_url: `https://crunchbase.com/organization/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
    total_funding_raised: Math.floor(Math.random() * 50000000),
    founded_year: 2015 + Math.floor(Math.random() * 8),
    employee_count_range: '11-50',
    company_type: 'Private',
    funding_rounds: [
      {
        round_type: 'Series A',
        amount_raised: 5000000,
        funding_date: '2023-06-15',
        lead_investors: ['Sequoia Capital'],
        participating_investors: ['Accel', 'Index Ventures'],
        valuation_post_money: 25000000,
      }
    ]
  }
}

async function fetchLinkedInData(companyName: string, apiKey: string, baseUrl: string) {
  // Mock LinkedIn API response
  return {
    linkedin_url: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
    employee_count_range: '51-200',
    headquarters_location: 'San Francisco, CA',
  }
}

async function fetchApolloData(companyName: string, apiKey: string, baseUrl: string) {
  // Mock Apollo.io API response
  return {
    employee_count_range: '11-50',
    headquarters_location: 'New York, NY',
  }
}

async function fetchClearbitData(companyName: string, apiKey: string, baseUrl: string) {
  // Mock Clearbit API response
  return {
    company_type: 'Private',
    employee_count_range: '11-50',
    founded_year: 2018,
  }
}
