/**
 * useBuyerAuth - Custom authentication hook for buyers
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * ARCHITECTURE (REFACTORED V3):
 * - Uses TokenManager for centralized token management
 * - Supports refresh tokens for seamless session renewal
 * - All backend calls use buyer_session_token
 */

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";
import { buyerTokenManager } from "@/lib/token-manager";
import { buyerQueryKeys } from "./useBuyerOrders";
import { buyerSessionQueryKey } from "./useBuyerSession";

const log = createLogger("BuyerAuth");

interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
}

interface LoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  needsPasswordSetup?: boolean;
  buyer?: BuyerProfile;
}

interface UseBuyerAuthReturn {
  buyer: BuyerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordSetup?: boolean }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkEmail: (email: string) => Promise<{ exists: boolean; needsPasswordSetup: boolean }>;
}

export function useBuyerAuth(): UseBuyerAuthReturn {
  const queryClient = useQueryClient();
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = await buyerTokenManager.getValidAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });

        const data = await response.json();
        if (data.valid && data.buyer) {
          setBuyer(data.buyer);
          queryClient.setQueryData(buyerSessionQueryKey, { valid: true, buyer: data.buyer });
        } else {
          buyerTokenManager.clearTokens();
          queryClient.setQueryData(buyerSessionQueryKey, { valid: false, buyer: null });
        }
      } catch (error: unknown) {
        log.error("Error validating session", error);
        buyerTokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || "Erro ao fazer login",
          needsPasswordSetup: data.needsPasswordSetup
        };
      }

      // Store tokens using TokenManager
      if (data.accessToken && data.refreshToken && data.expiresIn) {
        buyerTokenManager.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      }
      
      if (data.buyer) {
        setBuyer(data.buyer);
        queryClient.setQueryData(buyerSessionQueryKey, { valid: true, buyer: data.buyer });
        queryClient.invalidateQueries({ queryKey: buyerQueryKeys.all });
      }
      
      log.info("Login successful - tokens stored via TokenManager");
      return { success: true };
    } catch (error: unknown) {
      log.error("Login error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, [queryClient]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao criar conta" };
      }

      return { success: true };
    } catch (error: unknown) {
      log.error("Register error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = buyerTokenManager.getAccessTokenSync();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });
      } catch (error: unknown) {
        log.error("Logout error", error);
      }
    }
    
    // Clear tokens via TokenManager
    buyerTokenManager.clearTokens();
    setBuyer(null);
    
    // Clear caches
    queryClient.setQueryData(buyerSessionQueryKey, { valid: false, buyer: null });
    queryClient.removeQueries({ queryKey: buyerQueryKeys.all });
    
    log.info("Logout successful");
  }, [queryClient]);

  const checkEmail = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        exists: data.exists || false,
        needsPasswordSetup: data.needsPasswordSetup || false,
      };
    } catch (error: unknown) {
      log.error("Check email error", error);
      return { exists: false, needsPasswordSetup: false };
    }
  }, []);

  return {
    buyer,
    isLoading,
    isAuthenticated: !!buyer,
    login,
    register,
    logout,
    checkEmail,
  };
}

// Helper to get session token for API calls (uses TokenManager)
export function getBuyerSessionToken(): string | null {
  return buyerTokenManager.getAccessTokenSync();
}
