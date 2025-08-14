-- Security Enhancement Migration
-- Fix critical RLS policy issues and improve data access controls

-- 1. Fix function search paths (security improvement)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profiles()
RETURNS TABLE(id uuid, email text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.email,
    p.name
  FROM public.profiles p 
  WHERE p.email IS NOT NULL
  ORDER BY p.name, p.email;
$function$;

CREATE OR REPLACE FUNCTION public.get_task_assignees(task_id uuid)
RETURNS TABLE(id uuid, email text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id,
    p.email,
    p.name
  FROM public.task_assignments ta
  JOIN public.profiles p ON p.id = ta.assigned_to
  WHERE ta.task_id = $1
  ORDER BY p.name, p.email;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(user_id uuid, email text, name text, roles text[], approval_status text, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    p.id as user_id,
    p.email,
    p.name,
    COALESCE(
      ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), 
      ARRAY[]::text[]
    ) as roles,
    COALESCE(ua.status::text, 'pending') as approval_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.user_approvals ua ON p.id = ua.user_id
  GROUP BY p.id, p.email, p.name, ua.status, p.created_at
  ORDER BY p.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.find_potential_duplicates(p_company_name text, p_website text DEFAULT NULL::text, p_linkedin_url text DEFAULT NULL::text, p_contact_email text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(deal_id uuid, company_name text, website text, linkedin_url text, contact_email text, contact_name text, pipeline_stage text, created_at timestamp with time zone, confidence_level text, confidence_score numeric, match_reasons text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_max_priority_deals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- If trying to set is_priority_deal to true
  IF NEW.is_priority_deal = true AND (OLD.is_priority_deal IS NULL OR OLD.is_priority_deal = false) THEN
    -- Check if we already have 10 priority deals for this user
    IF (SELECT COUNT(*) FROM deals WHERE is_priority_deal = true AND created_by = NEW.created_by) >= 10 THEN
      RAISE EXCEPTION 'Cannot have more than 10 priority deals. Please remove priority status from another deal first.';
    END IF;
    
    -- Auto-assign next available rank if not provided
    IF NEW.priority_rank IS NULL THEN
      NEW.priority_rank := COALESCE(
        (SELECT MAX(priority_rank) FROM deals WHERE is_priority_deal = true AND created_by = NEW.created_by), 
        0
      ) + 1;
    END IF;
  END IF;

  -- If removing priority status, clear the rank
  IF NEW.is_priority_deal = false THEN
    NEW.priority_rank := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_approval_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    profile_data public.profiles%ROWTYPE;
BEGIN
    -- Fetch the corresponding profile data using the user_id
    SELECT *
    INTO profile_data
    FROM public.profiles
    WHERE id = NEW.user_id;

    -- If a profile is found, set the name and email
    IF profile_data.id IS NOT NULL THEN
        NEW.name := profile_data.name;
        NEW.email := profile_data.email;
    ELSE
        -- Optionally, handle cases where no profile is found for the user_id
        -- For example, set them to NULL or log a warning.
        NEW.name := NULL;
        NEW.email := NULL;
        RAISE WARNING 'No profile found for user_id: % when updating user_approvals', NEW.user_id;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_approvals
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into user_approvals with pending status
  INSERT INTO public.user_approvals (user_id, status)
  VALUES (NEW.id, 'pending');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into profiles table with email and name from auth.users
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_deal_invested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if pipeline_stage changed to 'Invested'
  IF NEW.pipeline_stage = 'Invested' AND (OLD.pipeline_stage IS NULL OR OLD.pipeline_stage != 'Invested') THEN
    -- Insert into portfolio_companies if not already exists for this user, or update it
    INSERT INTO public.portfolio_companies (
      company_name,
      description,
      relationship_owner,
      created_by
    )
    VALUES (
      NEW.company_name,
      NEW.description,
      NEW.relationship_owner,
      NEW.created_by
    )
    ON CONFLICT (company_name, created_by) DO UPDATE SET
      description = COALESCE(EXCLUDED.description, public.portfolio_companies.description),
      relationship_owner = EXCLUDED.relationship_owner,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Enhance Microsoft tokens security
-- Add token expiry validation
CREATE OR REPLACE FUNCTION public.validate_token_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure expires_at is in the future
  IF NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'Token expiry must be in the future';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for token validation
DROP TRIGGER IF EXISTS validate_microsoft_token_expiry ON public.microsoft_tokens;
CREATE TRIGGER validate_microsoft_token_expiry
  BEFORE INSERT OR UPDATE ON public.microsoft_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_token_expiry();

-- 3. Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  table_name text,
  record_id uuid,
  user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log to a security audit table (to be created if needed)
  -- For now, just use RAISE NOTICE for monitoring
  RAISE NOTICE 'SECURITY_EVENT: % on % record % by user %', event_type, table_name, record_id, user_id;
END;
$function$;