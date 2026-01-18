import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase';

/**
 * Supabase Client - RISE Protocol V3 Compliant
 * 
 * ARCHITECTURE NOTE:
 * - anon key is public by design - security is enforced by RLS policies
 * - Secret keys (service_role) are stored in Supabase Secrets for edge functions
 * - Custom session token (x-producer-session-token) is NOT injected here because:
 *   1. Supabase client doesn't support dynamic header evaluation
 *   2. Frontend MUST use api.call() or rpcProxy for all backend operations
 *   3. Edge Functions receive the token via request headers from api.call()
 *   4. RLS uses get_producer_id_from_session() which falls back to auth.uid()
 * - This client is used ONLY for Supabase Auth operations
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
