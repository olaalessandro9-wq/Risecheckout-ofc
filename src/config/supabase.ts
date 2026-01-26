/**
 * Supabase Configuration
 * 
 * Central config file for Supabase URL and keys.
 * 
 * RISE V4: Uses api.risecheckout.com proxy (Cloudflare Worker) to enable
 * cross-subdomain cookie sharing via Domain=.risecheckout.com.
 * 
 * Note: anon key is public by design - security is enforced by RLS policies.
 * Secret keys (service_role) are stored in Supabase Secrets for edge functions.
 */

export const SUPABASE_URL = "https://api.risecheckout.com";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";
