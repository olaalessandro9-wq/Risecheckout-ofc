// src/lib/auth.ts
// ============================================================
// DEPRECATED: This file is maintained for backward compatibility.
// Use useAuth() from @/hooks/useAuth instead.
// ============================================================

import { supabase } from "@/integrations/supabase/client";

// Re-export for backward compatibility
export { supabase };

/**
 * @deprecated Use useAuth().signOut() from @/hooks/useAuth instead
 * This function uses the legacy Supabase Auth system.
 * The new producer session system should be used for all auth operations.
 */
export async function signOut() {
  console.warn("[DEPRECATED] signOut from lib/auth is deprecated. Use useAuth().signOut() instead.");
  
  // Clear producer session token
  localStorage.removeItem("producer_session_token");
  
  // Also clear Supabase auth for legacy cleanup
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore errors - may not have Supabase session
  }
  
  window.location.href = "/auth";
}
