// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://arfyltduzmkrzdxjnodb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZnlsdGR1em1rcnpkeGpub2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDA3NjksImV4cCI6MjA2NTQxNjc2OX0.a9FTL1t9G8PN9DwjmuXHFYTCvmJmGOwGeFnhe5PEE2c";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);