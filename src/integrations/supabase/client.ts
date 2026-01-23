/**
 * Supabase Client - RISE Protocol V3 Compliant
 * 
 * ARCHITECTURE NOTE:
 * - anon key is public by design - security is enforced by RLS policies
 * - Secret keys (service_role) are stored in Supabase Secrets for edge functions
 * - Authentication uses httpOnly cookies (__Host-rise_access, __Host-rise_refresh)
 * - Frontend MUST use api.call() or rpcProxy for all backend operations
 * - Edge Functions receive cookies via credentials: 'include'
 * - This client is used ONLY for Supabase Auth operations
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpdmj0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMTQ5MDksImV4cCI6MjA1NDY5MDkwOX0.WLxE7K3Rb4n4qv8RzkkgJtE5RlC11cBW_Qe5uMZjYtw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
