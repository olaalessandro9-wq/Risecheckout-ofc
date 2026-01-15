/**
 * useProducerAuth - Custom authentication hook for producers
 * 
 * Mirrors useBuyerAuth architecture for consistency.
 * Uses producer-auth edge function for all auth operations.
 * 
 * SYNC ARCHITECTURE:
 * - Uses producer_sessions for custom session management
 * - ALSO syncs with Supabase Auth for RLS compatibility (auth.uid())
 * - This dual-sync ensures both Edge Functions AND direct supabase.from() calls work
 */

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";
import { producerSessionQueryKey } from "./useProducerSession";

const log = createLogger("ProducerAuth");

const SESSION_KEY = "producer_session_token";

interface ProducerProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  avatar_url: string | null;
}

interface LoginResult {
  success: boolean;
  error?: string;
  passwordValidation?: {
    score: number;
    errors: string[];
    suggestions: string[];
  };
}

interface RegisterResult {
  success: boolean;
  error?: string;
  passwordValidation?: {
    score: number;
    errors: string[];
    suggestions: string[];
  };
}

interface UseProducerAuthReturn {
  producer: ProducerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  validateSession: () => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  cpfCnpj?: string;
  registrationSource?: "producer" | "affiliate";
}


export function useProducerAuth(): UseProducerAuthReturn {
  const queryClient = useQueryClient();
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem(SESSION_KEY);
  const setSessionToken = (token: string) => localStorage.setItem(SESSION_KEY, token);
  const clearSessionToken = () => localStorage.removeItem(SESSION_KEY);

  // REMOVED: Duplicate session validation - useProducerSession already handles this via React Query
  // This eliminates duplicate /validate calls that were causing performance issues
  useEffect(() => {
    // Just set loading to false - let useProducerSession handle validation
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Erro ao fazer login",
          passwordValidation: data.validation,
        };
      }

      setSessionToken(data.sessionToken);
      setProducer(data.producer);

      // ============================================
      // SYNC SUPABASE AUTH SESSION (for RLS compatibility)
      // ============================================
      // This ensures auth.uid() works when frontend makes direct supabase.from() calls
      if (data.supabaseSession) {
        try {
          await supabase.auth.setSession({
            access_token: data.supabaseSession.access_token,
            refresh_token: data.supabaseSession.refresh_token,
          });
          log.info("Supabase Auth session synced successfully");
        } catch (syncError) {
          // Non-blocking - producer_session still works for Edge Functions
          log.warn("Failed to sync Supabase Auth session (non-blocking)", syncError);
        }
      }

      // Update cache
      queryClient.setQueryData(producerSessionQueryKey, { valid: true, producer: data.producer });

      return { success: true };
    } catch (error: unknown) {
      log.error("Login error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, [queryClient]);

  const register = useCallback(async (data: RegisterData): Promise<RegisterResult> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          cpfCnpj: data.cpfCnpj,
          registration_source: data.registrationSource || "producer",
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || "Erro ao criar conta",
          passwordValidation: responseData.validation,
        };
      }

      return { success: true };
    } catch (error: unknown) {
      log.error("Register error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getSessionToken();
    
    // Logout from producer_sessions (custom system)
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });
      } catch (error: unknown) {
        log.error("Producer session logout error", error);
      }
    }
    
    // ============================================
    // ALSO LOGOUT FROM SUPABASE AUTH
    // ============================================
    // This clears the JWT used for RLS policies
    try {
      await supabase.auth.signOut();
      log.info("Supabase Auth session cleared");
    } catch (error: unknown) {
      log.warn("Failed to clear Supabase Auth session (non-blocking)", error);
    }
    
    clearSessionToken();
    setProducer(null);

    // Clear all producer-related caches
    queryClient.setQueryData(producerSessionQueryKey, { valid: false, producer: null });
    queryClient.removeQueries({ queryKey: ["producer"] });
  }, [queryClient]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Erro ao solicitar recuperação de senha",
        };
      }

      return { success: true };
    } catch (error: unknown) {
      log.error("Request password reset error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const validateSession = useCallback(async (): Promise<boolean> => {
    const token = getSessionToken();
    if (!token) return false;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token }),
      });

      const data = await response.json();
      return data.valid === true;
    } catch {
      return false;
    }
  }, []);

  return {
    producer,
    isLoading,
    isAuthenticated: !!producer,
    login,
    register,
    logout,
    requestPasswordReset,
    validateSession,
  };
}

// Helper to get session token for API calls
export function getProducerSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
