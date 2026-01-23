/**
 * Hook para vincular um produtor (Supabase Auth) ao seu perfil de buyer
 * Permite que produtores acessem o painel de aluno sem login separado
 * Inclui verificação de produtos próprios com área de membros ativa
 * 
 * @deprecated Use `useContextSwitcher` instead.
 * This hook is being replaced by the unified identity system.
 * Migration: Replace usages with `useContextSwitcher()` hook.
 * 
 * OTIMIZADO: Usa React Query para cache e navigate() ao invés de window.location.href
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SUPABASE_URL } from "@/config/supabase";
import { createLogger } from "@/lib/logger";

const log = createLogger("ProducerBuyerLink");

const BUYER_SESSION_KEY = "buyer_session_token";

// Cache de 10 minutos para evitar verificações repetidas
const LINK_STALE_TIME = 10 * 60 * 1000;
const LINK_CACHE_TIME = 15 * 60 * 1000;

interface ProducerBuyerLinkData {
  hasBuyerProfile: boolean;
  hasOwnProducts: boolean;
  buyerId: string | null;
}

// Função de verificação de perfil
async function checkProducerBuyerProfile(
  email: string,
  producerId: string
): Promise<ProducerBuyerLinkData> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/buyer-auth/check-producer-buyer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email,
        producerUserId: producerId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao verificar perfil de buyer");
  }

  const data = await response.json();
  return {
    hasBuyerProfile: data.hasBuyerProfile || false,
    hasOwnProducts: data.hasOwnProducts || false,
    buyerId: data.buyerId || null,
  };
}

// Query key para link produtor-buyer
const producerBuyerLinkQueryKey = (email: string) => 
  ["producer-buyer-link", email] as const;

export function useProducerBuyerLink() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  // Query com cache para verificação de perfil
  const query = useQuery({
    queryKey: user?.email ? producerBuyerLinkQueryKey(user.email) : ["disabled"],
    queryFn: () => checkProducerBuyerProfile(user!.email!, user!.id),
    enabled: !authLoading && !!user?.email && !!user?.id,
    staleTime: LINK_STALE_TIME,
    gcTime: LINK_CACHE_TIME,
    retry: 1,
  });

  // Gera sessão de buyer automaticamente (cria buyer_profile se necessário)
  const generateBuyerSession = useCallback(async (): Promise<string | null> => {
    if (!user?.email) {
      return null;
    }

    const data = query.data;

    // Se tem produtos próprios mas não tem buyer profile, criar primeiro
    if (data?.hasOwnProducts && !data?.buyerId) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/buyer-auth/ensure-producer-access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            productId: "placeholder",
            producerUserId: user.id,
          }),
        });
      } catch (err) {
        log.error("Error ensuring access", err);
      }
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

      const responseData = await response.json();
      if (responseData.sessionToken) {
        localStorage.setItem(BUYER_SESSION_KEY, responseData.sessionToken);
        return responseData.sessionToken;
      }

      return null;
    } catch (err) {
      log.error("Error generating session", err);
      return null;
    }
  }, [user?.email, user?.id, query.data]);

  // Navega para o painel do aluno - OTIMIZADO: usa navigate() ao invés de window.location.href
  const goToStudentPanel = useCallback(async (): Promise<void> => {
    const token = await generateBuyerSession();
    if (token) {
      // Invalidar queries de buyer para forçar refetch com nova sessão
      queryClient.invalidateQueries({ queryKey: ["buyer"] });
      // Usar navigate ao invés de reload completo
      navigate("/minha-conta/dashboard");
    }
  }, [generateBuyerSession, navigate, queryClient]);

  // Estado derivado
  const hasBuyerProfile = query.data?.hasBuyerProfile ?? null;
  const hasOwnProducts = query.data?.hasOwnProducts ?? false;
  const buyerId = query.data?.buyerId ?? null;
  
  // Pode acessar o painel do aluno se tem compras OU produtos próprios
  const canAccessStudentPanel = hasBuyerProfile || hasOwnProducts;

  return {
    hasBuyerProfile,
    hasOwnProducts,
    buyerId,
    isLoading: authLoading || query.isLoading,
    error: query.error?.message || null,
    generateBuyerSession,
    goToStudentPanel,
    canAccessStudentPanel,
  };
}
