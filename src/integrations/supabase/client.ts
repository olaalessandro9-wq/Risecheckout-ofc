import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

/**
 * Get producer session token from localStorage
 * Used to send custom session token in headers for RLS
 */
function getProducerSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('producer_session_token');
}

/**
 * Supabase Client - RISE Protocol V3 Compliant
 * 
 * Note: anon key is public by design - security is enforced by RLS policies.
 * Secret keys (service_role) are stored in Supabase Secrets for edge functions.
 * 
 * Custom session token is sent in headers for RLS compatibility with
 * get_producer_id_from_session() SQL function.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-producer-session-token': getProducerSessionToken() || '',
    },
  },
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
