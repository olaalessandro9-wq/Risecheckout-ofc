/**
 * Supabase Configuration
 * 
 * Central config file for Supabase URL and keys.
 * SECURITY: No fallback values - requires proper environment configuration.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error(
    '[SUPABASE CONFIG] Missing required environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.'
  );
}

export const SUPABASE_URL: string = url;
export const SUPABASE_ANON_KEY: string = anonKey;
