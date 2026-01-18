/**
 * useProducerAuth - Custom authentication hook for producers
 * 
 * RISE ARCHITECT PROTOCOL - Zero Technical Debt
 * 
 * ARCHITECTURE (REFACTORED V3):
 * - Uses TokenManager for centralized token management
 * - Supports refresh tokens for seamless session renewal
 * - All backend calls use X-Producer-Session-Token header
 * - Edge Functions use service_role (bypass RLS)
 */

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";
import { producerTokenManager } from "@/lib/token-manager";
import { producerSessionQueryKey } from "./useProducerSession";

const log = createLogger("ProducerAuth");

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

interface LoginResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  validation?: {
    score: number;
    errors: string[];
    suggestions: string[];
  };
  producer?: ProducerProfile;
}


export function useProducerAuth(): UseProducerAuthReturn {
  const queryClient = useQueryClient();
  const [producer, setProducer] = useState<ProducerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false on mount - useProducerSession handles validation
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/login`, {
        method: "POST",
        credentials: "include", // CRITICAL: Receive httpOnly cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Erro ao fazer login",
          passwordValidation: data.validation,
        };
      }

      // Mark as authenticated - tokens are in httpOnly cookies
      if (data.expiresIn) {
        producerTokenManager.setAuthenticated(data.expiresIn);
      }
      
      if (data.producer) {
        setProducer(data.producer);
        // Update React Query cache
        queryClient.setQueryData(producerSessionQueryKey, { valid: true, producer: data.producer });
      }

      log.info("Login successful - tokens stored in httpOnly cookies");
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
    // Logout - cookies are sent automatically
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/logout`, {
        method: "POST",
        credentials: "include", // Send httpOnly cookies for logout
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: unknown) {
      log.error("Logout error", error);
    }
    
    // Clear auth state
    producerTokenManager.clearTokens();
    setProducer(null);

    // Clear all producer-related caches
    queryClient.setQueryData(producerSessionQueryKey, { valid: false, producer: null });
    queryClient.removeQueries({ queryKey: ["producer"] });
    
    log.info("Logout successful");
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
    const token = await producerTokenManager.getValidAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/producer-auth/validate`, {
        method: "POST",
        credentials: "include", // Send httpOnly cookies
        headers: { "Content-Type": "application/json" },
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

// Helper to get session token for API calls (uses TokenManager)
export function getProducerSessionToken(): string | null {
  return producerTokenManager.getAccessTokenSync();
}
