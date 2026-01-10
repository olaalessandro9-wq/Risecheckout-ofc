/**
 * useBuyerSession - Hook centralizado para validação de sessão de buyer
 * Usa React Query para cache inteligente, evitando validações repetidas
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";

const SESSION_KEY = "buyer_session_token";

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

// Helpers para token
export function getBuyerSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setBuyerSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearBuyerSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Função de validação de sessão
async function validateBuyerSession(): Promise<SessionValidation> {
  const token = getBuyerSessionToken();
  
  if (!token) {
    return { valid: false, buyer: null };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token }),
    });

    const data = await response.json();
    
    if (data.valid && data.buyer) {
      return { valid: true, buyer: data.buyer };
    }
    
    // Token inválido - limpar
    clearBuyerSessionToken();
    return { valid: false, buyer: null };
  } catch (error) {
    console.error("[useBuyerSession] Error validating session:", error);
    return { valid: false, buyer: null };
  }
}

// Query key para sessão
export const buyerSessionQueryKey = ["buyer-session"] as const;

/**
 * Hook principal para sessão de buyer com cache
 * Evita chamadas repetidas de validação
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
    clearBuyerSessionToken();
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
