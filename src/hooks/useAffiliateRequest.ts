import { useState, useCallback } from "react";
import { checkAffiliationStatus } from "@/services/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

interface UseAffiliateRequestReturn {
  requestAffiliate: (productId: string) => Promise<void>;
  checkStatus: (productId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  affiliationStatus: {
    isAffiliate: boolean;
    status?: "pending" | "active" | "rejected" | "blocked";
    affiliationId?: string;
  } | null;
}

/**
 * Hook para gerenciar solicitações de afiliação
 * 
 * Features:
 * - Solicita afiliação via Edge Function (com rate limiting, validação de pagamento, etc)
 * - Verifica status de afiliação
 * - Gerencia estados de loading/error/success
 * - Validação de autenticação
 * 
 * @see supabase/functions/request-affiliation/index.ts
 */
export function useAffiliateRequest(): UseAffiliateRequestReturn & { isCheckingStatus: boolean } {
  const { user, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [affiliationStatus, setAffiliationStatus] = useState<{
    isAffiliate: boolean;
    status?: "pending" | "active" | "rejected" | "blocked";
    affiliationId?: string;
  } | null>(null);

  /**
   * Solicita afiliação a um produto via Edge Function
   * 
   * Benefícios da Edge Function:
   * - Rate limiting automático (5 req/min)
   * - Validação de conta de pagamento conectada
   * - Proteção anti-auto-afiliação
   * - Código de afiliado criptograficamente seguro
   */
  const requestAffiliate = useCallback(
    async (productId: string) => {
      // Validar autenticação via token de sessão customizado
      const sessionToken = getProducerSessionToken();
      
      if (!sessionToken) {
        setError("Você precisa estar logado para solicitar afiliação");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        console.log("[useAffiliateRequest] Chamando Edge Function request-affiliation");
        
        const { data, error: fnError } = await supabase.functions.invoke("request-affiliation", {
          body: { product_id: productId },
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (fnError) {
          const errorMessage = fnError.message || "Erro ao solicitar afiliação. Tente novamente.";
          console.error("[useAffiliateRequest] Erro na Edge Function:", fnError);
          
          // Se o erro indica que já existe solicitação pendente, atualizar status ao invés de mostrar erro
          if (errorMessage.toLowerCase().includes("pendente") || errorMessage.toLowerCase().includes("pending")) {
            setAffiliationStatus({
              isAffiliate: false,
              status: "pending",
            });
            setSuccess("Você já possui uma solicitação pendente para este produto.");
            console.log("[useAffiliateRequest] Solicitação já pendente detectada via erro");
            return;
          }
          
          setError(errorMessage);
          return;
        }

        // Edge Function retorna { success, message, affiliate_code?, status? }
        if (data?.success) {
          setSuccess(data.message);
          
          // Determinar status baseado na resposta
          const newStatus = data.status || (data.affiliate_code ? "active" : "pending");
          setAffiliationStatus({
            isAffiliate: newStatus === "active",
            status: newStatus as "pending" | "active" | "rejected" | "blocked",
          });
          
          console.log("[useAffiliateRequest] Afiliação processada:", { 
            status: newStatus, 
            hasCode: !!data.affiliate_code 
          });
        } else {
          // Verificar se a mensagem de erro indica status pendente
          const errorMessage = data?.message || "";
          if (errorMessage.toLowerCase().includes("pendente") || errorMessage.toLowerCase().includes("pending")) {
            setAffiliationStatus({
              isAffiliate: false,
              status: "pending",
            });
            setSuccess("Você já possui uma solicitação pendente para este produto.");
            console.log("[useAffiliateRequest] Solicitação já pendente detectada via resposta");
            return;
          }
          
          setError(errorMessage || "Erro desconhecido ao solicitar afiliação.");
        }
      } catch (err: any) {
        console.error("[useAffiliateRequest] Erro ao solicitar afiliação:", err);
        setError(err.message || "Erro ao solicitar afiliação. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [user, session]
  );

  /**
   * Verifica status de afiliação
   */
  const checkStatus = useCallback(
    async (productId: string) => {
      // Indicar que está verificando status
      setIsCheckingStatus(true);
      
      if (!user) {
        setAffiliationStatus({ isAffiliate: false });
        setIsCheckingStatus(false);
        return;
      }

      try {
        const status = await checkAffiliationStatus(productId, user.id);
        setAffiliationStatus(status);
      } catch (err) {
        console.error("[useAffiliateRequest] Erro ao verificar status:", err);
        setAffiliationStatus({ isAffiliate: false });
      } finally {
        setIsCheckingStatus(false);
      }
    },
    [user]
  );

  return {
    requestAffiliate,
    checkStatus,
    isLoading,
    isCheckingStatus,
    error,
    success,
    affiliationStatus,
  };
}
