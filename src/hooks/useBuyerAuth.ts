import { useState, useCallback, useEffect } from "react";

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
const SESSION_KEY = "buyer_session_token";

interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
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
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
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
        const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });

        const data = await response.json();
        if (data.valid && data.buyer) {
          setBuyer(data.buyer);
        } else {
          clearSessionToken();
        }
      } catch (error) {
        console.error("[useBuyerAuth] Error validating session:", error);
        clearSessionToken();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || "Erro ao fazer login",
          needsPasswordSetup: data.needsPasswordSetup
        };
      }

      setSessionToken(data.sessionToken);
      setBuyer(data.buyer);
      return { success: true };
    } catch (error) {
      console.error("[useBuyerAuth] Login error:", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

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
    } catch (error) {
      console.error("[useBuyerAuth] Register error:", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getSessionToken();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token }),
        });
      } catch (error) {
        console.error("[useBuyerAuth] Logout error:", error);
      }
    }
    clearSessionToken();
    setBuyer(null);
  }, []);

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
    } catch (error) {
      console.error("[useBuyerAuth] Check email error:", error);
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

// Helper to get session token for API calls
export function getBuyerSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}