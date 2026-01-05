/**
 * Hook para vincular um produtor (Supabase Auth) ao seu perfil de buyer
 * Permite que produtores acessem o painel de aluno sem login separado
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";
const BUYER_SESSION_KEY = "buyer_session_token";

interface ProducerBuyerLinkState {
  hasBuyerProfile: boolean | null;
  buyerId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseProducerBuyerLinkReturn extends ProducerBuyerLinkState {
  /**
   * Gera uma sessão de buyer automaticamente usando o email do produtor
   * Retorna o token de sessão se bem-sucedido
   */
  generateBuyerSession: () => Promise<string | null>;
  /**
   * Navega para o painel do aluno, gerando sessão se necessário
   */
  goToStudentPanel: () => Promise<void>;
}

export function useProducerBuyerLink(): UseProducerBuyerLinkReturn {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ProducerBuyerLinkState>({
    hasBuyerProfile: null,
    buyerId: null,
    isLoading: true,
    error: null,
  });

  // Verifica se o produtor tem um perfil de buyer com o mesmo email
  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setState({
        hasBuyerProfile: false,
        buyerId: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    const checkBuyerProfile = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/buyer-auth/check-producer-buyer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao verificar perfil de buyer");
        }

        const data = await response.json();
        setState({
          hasBuyerProfile: data.hasBuyerProfile,
          buyerId: data.buyerId || null,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("[useProducerBuyerLink] Error:", err);
        setState({
          hasBuyerProfile: false,
          buyerId: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    };

    checkBuyerProfile();
  }, [user?.email, authLoading]);

  // Gera sessão de buyer automaticamente
  const generateBuyerSession = useCallback(async (): Promise<string | null> => {
    if (!user?.email || !state.hasBuyerProfile) {
      return null;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/buyer-auth/producer-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar sessão");
      }

      const data = await response.json();
      if (data.sessionToken) {
        localStorage.setItem(BUYER_SESSION_KEY, data.sessionToken);
        return data.sessionToken;
      }

      return null;
    } catch (err) {
      console.error("[useProducerBuyerLink] Error generating session:", err);
      return null;
    }
  }, [user?.email, state.hasBuyerProfile]);

  // Navega para o painel do aluno
  const goToStudentPanel = useCallback(async (): Promise<void> => {
    const token = await generateBuyerSession();
    if (token) {
      window.location.href = "/minha-conta/dashboard";
    }
  }, [generateBuyerSession]);

  return {
    ...state,
    generateBuyerSession,
    goToStudentPanel,
  };
}
