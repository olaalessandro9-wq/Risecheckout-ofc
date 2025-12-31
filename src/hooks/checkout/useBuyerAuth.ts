/**
 * Hook: useBuyerAuth
 * 
 * Responsabilidade: Gerenciar autenticação de compradores no checkout.
 * 
 * ✅ RISE ARCHITECT PROTOCOL:
 * - Comunicação segura via Edge Functions
 * - HttpOnly cookies para sessão (gerenciado pelo backend)
 * - Sem armazenamento de dados sensíveis no frontend
 * - Rate limiting e proteção contra brute force (backend)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  hasDocument: boolean; // Indica se tem documento salvo (não expõe o valor)
  emailVerified: boolean;
}

export interface BuyerSession {
  isAuthenticated: boolean;
  buyer: BuyerProfile | null;
  maskedDocument: string | null; // Ex: "***.***.***-89"
}

export interface SavedCard {
  id: string;
  brand: string | null;
  lastFour: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

export interface OrderHistory {
  id: string;
  productName: string;
  amountCents: number;
  status: string;
  createdAt: string;
}

interface UseBuyerAuthReturn {
  // Estado
  session: BuyerSession;
  isLoading: boolean;
  error: string | null;
  
  // Ações de autenticação
  register: (email: string, password: string, name?: string, phone?: string, document?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Dados do comprador
  savedCards: SavedCard[];
  orderHistory: OrderHistory[];
  
  // Ações de perfil
  updateProfile: (data: { name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  fetchSavedCards: () => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// ============================================================================
// HOOK
// ============================================================================

export function useBuyerAuth(): UseBuyerAuthReturn {
  const [session, setSession] = useState<BuyerSession>({
    isAuthenticated: false,
    buyer: null,
    maskedDocument: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  
  const initialCheckDone = useRef(false);

  // =========================================================================
  // VALIDAR SESSÃO EXISTENTE (ao montar)
  // =========================================================================
  
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para enviar cookies
        body: JSON.stringify({ action: "validate" }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setSession({
          isAuthenticated: true,
          buyer: {
            id: data.buyer.id,
            email: data.buyer.email,
            name: data.buyer.name,
            phone: data.buyer.phone,
            hasDocument: data.buyer.hasDocument,
            emailVerified: data.buyer.emailVerified,
          },
          maskedDocument: data.buyer.maskedDocument,
        });
      } else {
        setSession({
          isAuthenticated: false,
          buyer: null,
          maskedDocument: null,
        });
      }
    } catch (err) {
      console.warn("[useBuyerAuth] Erro ao validar sessão:", err);
      setSession({
        isAuthenticated: false,
        buyer: null,
        maskedDocument: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validar sessão ao montar (apenas uma vez)
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;
    refreshSession();
  }, [refreshSession]);

  // =========================================================================
  // REGISTRO
  // =========================================================================
  
  const register = useCallback(async (
    email: string,
    password: string,
    name?: string,
    phone?: string,
    document?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "register",
          email,
          password,
          name,
          phone,
          document,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Erro ao criar conta";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Registro bem-sucedido - atualiza sessão
      setSession({
        isAuthenticated: true,
        buyer: {
          id: data.buyer.id,
          email: data.buyer.email,
          name: data.buyer.name,
          phone: data.buyer.phone,
          hasDocument: data.buyer.hasDocument,
          emailVerified: false,
        },
        maskedDocument: data.buyer.maskedDocument,
      });

      return { success: true };
    } catch (err) {
      const errorMsg = "Erro de conexão. Tente novamente.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // LOGIN
  // =========================================================================
  
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Email ou senha incorretos";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Login bem-sucedido - atualiza sessão
      setSession({
        isAuthenticated: true,
        buyer: {
          id: data.buyer.id,
          email: data.buyer.email,
          name: data.buyer.name,
          phone: data.buyer.phone,
          hasDocument: data.buyer.hasDocument,
          emailVerified: data.buyer.emailVerified,
        },
        maskedDocument: data.buyer.maskedDocument,
      });

      return { success: true };
    } catch (err) {
      const errorMsg = "Erro de conexão. Tente novamente.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // LOGOUT
  // =========================================================================
  
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "logout" }),
      });

      // Limpa estado local independente da resposta
      setSession({
        isAuthenticated: false,
        buyer: null,
        maskedDocument: null,
      });
      setSavedCards([]);
      setOrderHistory([]);
    } catch (err) {
      console.warn("[useBuyerAuth] Erro ao fazer logout:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================================================================
  // BUSCAR CARTÕES SALVOS
  // =========================================================================
  
  const fetchSavedCards = useCallback(async () => {
    if (!session.isAuthenticated) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "getSavedCards" }),
      });

      const data = await response.json();

      if (response.ok && data.cards) {
        setSavedCards(data.cards.map((card: any) => ({
          id: card.id,
          brand: card.brand,
          lastFour: card.last_four,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          isDefault: card.is_default,
        })));
      }
    } catch (err) {
      console.warn("[useBuyerAuth] Erro ao buscar cartões:", err);
    }
  }, [session.isAuthenticated]);

  // =========================================================================
  // BUSCAR HISTÓRICO DE PEDIDOS
  // =========================================================================
  
  const fetchOrderHistory = useCallback(async () => {
    if (!session.isAuthenticated) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "getOrderHistory" }),
      });

      const data = await response.json();

      if (response.ok && data.orders) {
        setOrderHistory(data.orders.map((order: any) => ({
          id: order.id,
          productName: order.product_name,
          amountCents: order.amount_cents,
          status: order.status,
          createdAt: order.created_at,
        })));
      }
    } catch (err) {
      console.warn("[useBuyerAuth] Erro ao buscar histórico:", err);
    }
  }, [session.isAuthenticated]);

  // =========================================================================
  // ATUALIZAR PERFIL
  // =========================================================================
  
  const updateProfile = useCallback(async (
    data: { name?: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!session.isAuthenticated) {
      return { success: false, error: "Não autenticado" };
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/buyer-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "updateProfile",
          ...data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || "Erro ao atualizar perfil";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Atualiza sessão local com novos dados
      setSession((prev) => ({
        ...prev,
        buyer: prev.buyer ? {
          ...prev.buyer,
          name: data.name ?? prev.buyer.name,
          phone: data.phone ?? prev.buyer.phone,
        } : null,
      }));

      return { success: true };
    } catch (err) {
      const errorMsg = "Erro de conexão. Tente novamente.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [session.isAuthenticated]);

  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    isLoading,
    error,
    register,
    login,
    logout,
    savedCards,
    orderHistory,
    updateProfile,
    fetchSavedCards,
    fetchOrderHistory,
    clearError,
    refreshSession,
  };
}
