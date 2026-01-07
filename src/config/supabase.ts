/**
 * Supabase Configuration
 * 
 * Central config file for Supabase URL and keys.
 * Uses environment variables for security.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wivbtmtgpsxupfjwwovf.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdmJ0bXRncHN4dXBmand3b3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mjg2NzIsImV4cCI6MjA4MTA4ODY3Mn0.h8HDRdHaVTZpZLqBxj7bODaUPCox2h6HF_3U1xfbSXY";
