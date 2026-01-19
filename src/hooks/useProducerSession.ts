/**
 * useProducerSession - Cached session validation hook
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * Uses React Query for caching and automatic revalidation.
 * Provides a consistent way to check producer session across components.
 * 
 * ARCHITECTURE (REFACTORED V4):
 * - Uses httpOnly cookies for token transport (XSS protection)
 * - Uses TokenManager for auth state tracking
 * - Validates session via cookies sent automatically
 * - NO Supabase Auth dependency (eliminated dual-auth)
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { producerTokenManager } from "@/lib/token-manager";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseProducerSession");

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

async function validateProducerSession(): Promise<SessionData> {
  // Use TokenManager to check auth state (auto-refresh if needed)
  const token = await producerTokenManager.getValidAccessToken();
  
  if (!token) {
    return { valid: false, producer: null };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
      method: "POST",
      credentials: "include", // Send httpOnly cookies
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (data.valid && data.producer) {
      return { valid: true, producer: data.producer };
    }

    // Invalid session - clear auth state
    producerTokenManager.clearTokens();
    return { valid: false, producer: null };
  } catch (error: unknown) {
    log.error("Error validating session:", error);
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
    producerTokenManager.clearTokens();
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
