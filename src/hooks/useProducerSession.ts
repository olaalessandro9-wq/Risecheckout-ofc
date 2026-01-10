/**
 * useProducerSession - Cached session validation hook
 * 
 * Uses React Query for caching and automatic revalidation.
 * Provides a consistent way to check producer session across components.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";

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

async function validateProducerSession(): Promise<SessionData> {
  const token = localStorage.getItem(SESSION_KEY);
  
  if (!token) {
    return { valid: false, producer: null };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token }),
    });

    const data = await response.json();

    if (data.valid && data.producer) {
      return { valid: true, producer: data.producer };
    }

    // Invalid session - clear token
    localStorage.removeItem(SESSION_KEY);
    return { valid: false, producer: null };
  } catch (error) {
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
    refetchOnWindowFocus: true,
    retry: 1,
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
