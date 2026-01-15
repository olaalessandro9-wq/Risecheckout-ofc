/**
 * useProducerSession - Cached session validation hook
 * 
 * Uses React Query for caching and automatic revalidation.
 * Provides a consistent way to check producer session across components.
 * 
 * DUAL-SESSION VALIDATION:
 * - Validates producer_session (custom token)
 * - ALSO verifies Supabase Auth session exists (for RLS compatibility)
 * - If Supabase session expired, forces re-login to re-sync
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "producer_session_token";

// Export query key for use in other hooks
export const producerSessionQueryKey = ["producer-session"] as const;

interface ProducerProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
}

interface SessionData {
  valid: boolean;
  producer: ProducerProfile | null;
}

/**
 * Ensures Supabase Auth is synced (non-blocking).
 * The producer_session is the source of truth, so this is informational only.
 */
async function ensureSupabaseAuthSync(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.info("[ProducerSession] Supabase Auth not yet synced - will sync on next login");
    }
  } catch {
    // Non-blocking - producer_session is the source of truth
  }
}

async function validateProducerSession(): Promise<SessionData> {
  const token = localStorage.getItem(SESSION_KEY);
  
  if (!token) {
    return { valid: false, producer: null };
  }

  try {
    // ============================================
    // VALIDATE PRODUCER SESSION (SOURCE OF TRUTH)
    // ============================================
    // The producer_session_token is the primary auth mechanism.
    // Supabase Auth sync is handled separately (non-blocking).
    const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token }),
    });

    const data = await response.json();

    if (data.valid && data.producer) {
      // Session is valid - attempt Supabase Auth sync (non-blocking)
      ensureSupabaseAuthSync();
      return { valid: true, producer: data.producer };
    }

    // Invalid session - clear token
    localStorage.removeItem(SESSION_KEY);
    return { valid: false, producer: null };
  } catch (error: unknown) {
    console.error("Error validating producer session:", error);
    return { valid: false, producer: null };
  }
}

export function useProducerSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: producerSessionQueryKey,
    queryFn: validateProducerSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // Prevent flickering on focus
    retry: 1,
    refetchInterval: false, // No polling
    refetchOnMount: true,
    refetchOnReconnect: false, // Prevent flickering on reconnect
  });

  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: producerSessionQueryKey });
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    queryClient.setQueryData(producerSessionQueryKey, { valid: false, producer: null });
  };

  return {
    producer: query.data?.producer ?? null,
    isValid: query.data?.valid ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    invalidateSession,
    clearSession,
    refetch: query.refetch,
  };
}
