import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

/**
 * Supabase Client - RISE Protocol V2 Compliant
 * 
 * Note: anon key is public by design - security is enforced by RLS policies.
 * Secret keys (service_role) are stored in Supabase Secrets for edge functions.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
