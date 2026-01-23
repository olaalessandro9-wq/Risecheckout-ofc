/**
 * useBuyerSession - Hook centralizado para validação de sessão de buyer
 * 
 * @deprecated Use `useUnifiedAuth` instead.
 * This file is maintained for backward compatibility only.
 * 
 * IMPORTANT: The token helpers (getBuyerSessionToken, etc.) are still used
 * by legacy code like useSetupAccess. Do NOT remove until full migration.
 * 
 * @see docs/UNIFIED_IDENTITY_ARCHITECTURE.md
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { buyerTokenService } from "@/lib/token-manager";
import { createLogger } from "@/lib/logger";

const log = createLogger("BuyerSession");

/**
 * Query key for buyer session - exported for cache invalidation
 */
export const buyerSessionQueryKey = ["buyer-session"] as const;

interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
}

interface SessionValidation {
  valid: boolean;
  buyer: BuyerProfile | null;
}

/**
 * Validate buyer session with Edge Function
 */
async function validateBuyerSession(): Promise<SessionValidation> {
  const token = await buyerTokenService.getValidAccessToken();
  if (!token) {
    return { valid: false, buyer: null };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      buyerTokenService.clearTokens();
      return { valid: false, buyer: null };
    }

    const data = await response.json();
    
    if (!data.valid) {
      buyerTokenService.clearTokens();
      return { valid: false, buyer: null };
    }

    return { valid: true, buyer: data.buyer };
  } catch (error) {
    log.error("Session validation failed", error);
    return { valid: false, buyer: null };
  }
}

/**
 * @deprecated Use `useUnifiedAuth` instead.
 * 
 * Maintained for backward compatibility with legacy code.
 * Auto-refresh de tokens quando necessário
 */
export function useBuyerSession() {
  const queryClient = useQueryClient();
  
  // Session cache times
  const SESSION_STALE_TIME = 5 * 60 * 1000; // 5 min
  const SESSION_CACHE_TIME = 10 * 60 * 1000; // 10 min

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
    buyerTokenService.clearTokens();
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

// Helpers para token - delegam para TokenService FSM
export function getBuyerSessionToken(): string | null {
  return buyerTokenService.getAccessTokenSync();
}

export function setBuyerSessionToken(token: string): void {
  // This is a compatibility function - prefer using login flow
  log.warn("setBuyerSessionToken is deprecated - use login flow instead");
}

export function clearBuyerSessionToken(): void {
  buyerTokenService.clearTokens();
}
