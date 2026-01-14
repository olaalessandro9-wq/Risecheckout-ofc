import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Supabase Client - RISE Protocol V2 Compliant
 * 
 * Security: Uses environment variables instead of hardcoded keys.
 * Note: anon key is public by design - security is enforced by RLS policies.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "[Supabase] Environment variables not configured. " +
    "Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env"
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
