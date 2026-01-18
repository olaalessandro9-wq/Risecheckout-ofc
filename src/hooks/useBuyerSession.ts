/**
 * useBuyerSession - Hook centralizado para validação de sessão de buyer
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * ARCHITECTURE (REFACTORED V4):
 * - Uses httpOnly cookies for token transport (XSS protection)
 * - Uses TokenManager for auth state tracking
 * - React Query for intelligent caching
 * - Seamless session renewal without user interaction
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";
import { buyerTokenManager } from "@/lib/token-manager";

const log = createLogger("BuyerSession");

// Cache de 10 minutos para sessão
const SESSION_STALE_TIME = 10 * 60 * 1000;
const SESSION_CACHE_TIME = 15 * 60 * 1000;

interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
}

interface SessionValidation {
  valid: boolean;
  buyer: BuyerProfile | null;
}

// Query key para sessão
export const buyerSessionQueryKey = ["buyer-session"] as const;

// Função de validação de sessão
async function validateBuyerSession(): Promise<SessionValidation> {
  // Use TokenManager to check auth state (auto-refresh if needed)
  const token = await buyerTokenManager.getValidAccessToken();
  
  if (!token) {
    return { valid: false, buyer: null };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/validate`, {
      method: "POST",
      credentials: "include", // Send httpOnly cookies
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    
    if (data.valid && data.buyer) {
      return { valid: true, buyer: data.buyer };
    }
    
    // Token inválido - limpar
    buyerTokenManager.clearTokens();
    return { valid: false, buyer: null };
  } catch (error: unknown) {
    log.error("Error validating session", error);
    return { valid: false, buyer: null };
  }
}

/**
 * Hook principal para sessão de buyer com cache
 * Evita chamadas repetidas de validação
 * Auto-refresh de tokens quando necessário
 */
export function useBuyerSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: buyerSessionQueryKey,
    queryFn: validateBuyerSession,
    staleTime: SESSION_STALE_TIME,
    gcTime: SESSION_CACHE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Invalidar sessão (após login/logout)
  const invalidateSession = () => {
    queryClient.invalidateQueries({ queryKey: buyerSessionQueryKey });
  };

  // Atualizar cache com novo buyer (após login)
  const setSessionData = (buyer: BuyerProfile | null) => {
    queryClient.setQueryData(buyerSessionQueryKey, {
      valid: !!buyer,
      buyer,
    });
  };

  // Limpar sessão completamente
  const clearSession = () => {
    buyerTokenManager.clearTokens();
    queryClient.setQueryData(buyerSessionQueryKey, { valid: false, buyer: null });
  };

  return {
    buyer: query.data?.buyer ?? null,
    isAuthenticated: query.data?.valid ?? false,
    isLoading: query.isLoading,
    invalidateSession,
    setSessionData,
    clearSession,
  };
}

// Helpers para token - delegam para TokenManager
export function getBuyerSessionToken(): string | null {
  return buyerTokenManager.getAccessTokenSync();
}

export function setBuyerSessionToken(token: string): void {
  // This is a compatibility function - prefer using login flow
  console.warn("setBuyerSessionToken is deprecated - use login flow instead");
}

export function clearBuyerSessionToken(): void {
  buyerTokenManager.clearTokens();
}
