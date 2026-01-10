/**
 * useProducerAuth - Custom authentication hook for producers
 * 
 * Mirrors useBuyerAuth architecture for consistency.
 * Uses producer-auth edge function for all auth operations.
 */

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

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
}

export const producerSessionQueryKey = ["producer-session"];

export function useProducerAuth(): UseProducerAuthReturn {
  const queryClient = useQueryClient();
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getSessionToken = () => localStorage.getItem(SESSION_KEY);
  const setSessionToken = (token: string) => localStorage.setItem(SESSION_KEY, token);
  const clearSessionToken = () => localStorage.removeItem(SESSION_KEY);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = getSessionToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });

        const data = await response.json();
        if (data.valid && data.producer) {
          setProducer(data.producer);
          queryClient.setQueryData(producerSessionQueryKey, { valid: true, producer: data.producer });
        } else {
          clearSessionToken();
          queryClient.setQueryData(producerSessionQueryKey, { valid: false, producer: null });
        }
      } catch (error) {
        log.error("Error validating session", error);
        clearSessionToken();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, [queryClient]);

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

      // Update cache
      queryClient.setQueryData(producerSessionQueryKey, { valid: true, producer: data.producer });

      return { success: true };
    } catch (error) {
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
    } catch (error) {
      log.error("Register error", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getSessionToken();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });
      } catch (error) {
        log.error("Logout error", error);
      }
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
    } catch (error) {
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
