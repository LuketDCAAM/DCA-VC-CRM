-- Enable pg_trgm extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create function to find potential duplicate deals
CREATE OR REPLACE FUNCTION find_potential_duplicates(
  p_company_name TEXT,
  p_website TEXT DEFAULT NULL,
  p_linkedin_url TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  deal_id UUID,
  company_name TEXT,
  website TEXT,
  linkedin_url TEXT,
  contact_email TEXT,
  contact_name TEXT,
  pipeline_stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  confidence_level TEXT,
  confidence_score NUMERIC,
  match_reasons TEXT[]
) AS $$
DECLARE
  normalized_company_name TEXT;
  website_domain TEXT;
  linkedin_company TEXT;
BEGIN
  -- Normalize inputs
  normalized_company_name := LOWER(TRIM(p_company_name));
  
  -- Extract domain from website
  IF p_website IS NOT NULL THEN
    website_domain := LOWER(REGEXP_REPLACE(p_website, '^https?://(www\.)?', ''));
    website_domain := SPLIT_PART(website_domain, '/', 1);
  END IF;
  
  -- Extract company from LinkedIn URL
  IF p_linkedin_url IS NOT NULL THEN
    linkedin_company := LOWER(REGEXP_REPLACE(p_linkedin_url, '^https?://(www\.)?linkedin\.com/company/', ''));
    linkedin_company := SPLIT_PART(linkedin_company, '/', 1);
  END IF;

  RETURN QUERY
  SELECT 
    d.id as deal_id,
    d.company_name,
    d.website,
    d.linkedin_url,
    d.contact_email,
    d.contact_name,
    d.pipeline_stage::TEXT,
    d.created_at,
    CASE 
      -- High confidence matches
      WHEN LOWER(TRIM(d.company_name)) = normalized_company_name THEN 'high'
      WHEN p_website IS NOT NULL AND d.website IS NOT NULL AND 
           LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) = website_domain THEN 'high'
      WHEN p_linkedin_url IS NOT NULL AND d.linkedin_url IS NOT NULL AND 
           LOWER(d.linkedin_url) = LOWER(p_linkedin_url) THEN 'high'
      WHEN p_contact_email IS NOT NULL AND d.contact_email IS NOT NULL AND 
           LOWER(d.contact_email) = LOWER(p_contact_email) THEN 'high'
      
      -- Medium confidence matches
      WHEN similarity(LOWER(TRIM(d.company_name)), normalized_company_name) > 0.7 THEN 'medium'
      WHEN p_website IS NOT NULL AND d.website IS NOT NULL AND 
           website_domain = LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) AND
           similarity(LOWER(TRIM(d.company_name)), normalized_company_name) > 0.5 THEN 'medium'
      
      -- Low confidence matches
      WHEN similarity(LOWER(TRIM(d.company_name)), normalized_company_name) > 0.5 THEN 'low'
      ELSE 'low'
    END as confidence_level,
    
    CASE 
      WHEN LOWER(TRIM(d.company_name)) = normalized_company_name THEN 1.0
      WHEN p_website IS NOT NULL AND d.website IS NOT NULL AND 
           LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) = website_domain THEN 0.95
      WHEN p_linkedin_url IS NOT NULL AND d.linkedin_url IS NOT NULL AND 
           LOWER(d.linkedin_url) = LOWER(p_linkedin_url) THEN 0.9
      WHEN p_contact_email IS NOT NULL AND d.contact_email IS NOT NULL AND 
           LOWER(d.contact_email) = LOWER(p_contact_email) THEN 0.85
      ELSE similarity(LOWER(TRIM(d.company_name)), normalized_company_name)
    END as confidence_score,
    
    ARRAY[
      CASE WHEN LOWER(TRIM(d.company_name)) = normalized_company_name THEN 'Exact company name match' END,
      CASE WHEN p_website IS NOT NULL AND d.website IS NOT NULL AND 
                LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) = website_domain 
           THEN 'Same website domain' END,
      CASE WHEN p_linkedin_url IS NOT NULL AND d.linkedin_url IS NOT NULL AND 
                LOWER(d.linkedin_url) = LOWER(p_linkedin_url) 
           THEN 'Same LinkedIn URL' END,
      CASE WHEN p_contact_email IS NOT NULL AND d.contact_email IS NOT NULL AND 
                LOWER(d.contact_email) = LOWER(p_contact_email) 
           THEN 'Same contact email' END,
      CASE WHEN similarity(LOWER(TRIM(d.company_name)), normalized_company_name) > 0.5 
           THEN 'Similar company name' END
    ]::TEXT[] as match_reasons
    
  FROM deals d
  WHERE 
    (p_user_id IS NULL OR d.created_by = p_user_id) AND
    (
      -- Exact matches
      LOWER(TRIM(d.company_name)) = normalized_company_name OR
      
      -- Website domain matches
      (p_website IS NOT NULL AND d.website IS NOT NULL AND 
       LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) = website_domain) OR
      
      -- LinkedIn URL matches
      (p_linkedin_url IS NOT NULL AND d.linkedin_url IS NOT NULL AND 
       LOWER(d.linkedin_url) = LOWER(p_linkedin_url)) OR
      
      -- Contact email matches
      (p_contact_email IS NOT NULL AND d.contact_email IS NOT NULL AND 
       LOWER(d.contact_email) = LOWER(p_contact_email)) OR
      
      -- Fuzzy company name matching
      similarity(LOWER(TRIM(d.company_name)), normalized_company_name) > 0.5
    )
  ORDER BY 
    CASE 
      WHEN LOWER(TRIM(d.company_name)) = normalized_company_name THEN 1.0
      WHEN p_website IS NOT NULL AND d.website IS NOT NULL AND 
           LOWER(REGEXP_REPLACE(d.website, '^https?://(www\.)?', '')) = website_domain THEN 0.95
      WHEN p_linkedin_url IS NOT NULL AND d.linkedin_url IS NOT NULL AND 
           LOWER(d.linkedin_url) = LOWER(p_linkedin_url) THEN 0.9
      WHEN p_contact_email IS NOT NULL AND d.contact_email IS NOT NULL AND 
           LOWER(d.contact_email) = LOWER(p_contact_email) THEN 0.85
      ELSE similarity(LOWER(TRIM(d.company_name)), normalized_company_name)
    END DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;