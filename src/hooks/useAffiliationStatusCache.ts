/**
 * useAffiliationStatusCache - Cache de Status de Afiliação
 * 
 * Pré-carrega TODOS os status de afiliação do usuário em UMA única chamada.
 * Permite lookup O(1) instantâneo quando o modal de produto abre.
 * 
 * Features:
 * - Carregamento único ao montar
 * - Lookup instantâneo por productId
 * - Atualização local após nova afiliação (sem refetch)
 * - Invalidação ao deslogar
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";

interface AffiliationStatus {
  status: "pending" | "active" | "rejected" | "blocked";
  affiliationId: string;
}

interface UseAffiliationStatusCacheReturn {
  /** Indica se o cache está carregando */
  isLoading: boolean;
  /** Indica se o cache foi carregado com sucesso */
  isLoaded: boolean;
  /** Busca status de afiliação instantaneamente (O(1)) */
  getStatus: (productId: string) => AffiliationStatus | null;
  /** Carrega todos os status (chamado automaticamente) */
  loadStatuses: () => Promise<void>;
  /** Atualiza status localmente após nova afiliação */
  updateStatus: (productId: string, status: string, affiliationId?: string) => void;
  /** Invalida o cache (ao deslogar) */
  invalidate: () => void;
}

// Cache global para evitar múltiplas chamadas
const globalCache = {
  statuses: new Map<string, AffiliationStatus>(),
  isLoaded: false,
  isLoading: false,
  loadPromise: null as Promise<void> | null,
};

export function useAffiliationStatusCache(): UseAffiliationStatusCacheReturn {
  const [isLoading, setIsLoading] = useState(globalCache.isLoading);
  const [isLoaded, setIsLoaded] = useState(globalCache.isLoaded);
  const mountedRef = useRef(true);

  // Sincronizar estado local com cache global
  useEffect(() => {
    setIsLoaded(globalCache.isLoaded);
    setIsLoading(globalCache.isLoading);
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Carrega todos os status de afiliação do usuário
   * Usa deduplicação para evitar chamadas paralelas
   */
  const loadStatuses = useCallback(async () => {
    // Se já carregou ou está carregando, não faz nada
    if (globalCache.isLoaded) {
      setIsLoaded(true);
      return;
    }

    // Se já tem uma promise em andamento, aguarda ela
    if (globalCache.loadPromise) {
      await globalCache.loadPromise;
      if (mountedRef.current) {
        setIsLoaded(globalCache.isLoaded);
        setIsLoading(false);
      }
      return;
    }

    const sessionToken = getProducerSessionToken();
    if (!sessionToken) {
      // Usuário não logado, cache vazio mas "carregado"
      globalCache.isLoaded = true;
      setIsLoaded(true);
      return;
    }

    // Iniciar carregamento
    globalCache.isLoading = true;
    setIsLoading(true);

    globalCache.loadPromise = (async () => {
      try {
        console.log("[useAffiliationStatusCache] Carregando status de afiliação...");

        const { data, error } = await supabase.functions.invoke("get-all-affiliation-statuses", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        if (error) {
          console.error("[useAffiliationStatusCache] Erro ao carregar:", error);
          throw error;
        }

        // Popular cache com os status recebidos
        if (data?.statuses) {
          globalCache.statuses.clear();
          for (const [productId, status] of Object.entries(data.statuses)) {
            const typedStatus = status as { status: string; affiliationId: string };
            globalCache.statuses.set(productId, {
              status: typedStatus.status as AffiliationStatus["status"],
              affiliationId: typedStatus.affiliationId,
            });
          }
          console.log(`[useAffiliationStatusCache] Cache populado com ${globalCache.statuses.size} afiliações`);
        }

        globalCache.isLoaded = true;
      } catch (err) {
        console.error("[useAffiliationStatusCache] Erro ao carregar cache:", err);
        // Mesmo com erro, marcamos como carregado para não bloquear a UI
        globalCache.isLoaded = true;
      } finally {
        globalCache.isLoading = false;
        globalCache.loadPromise = null;
        
        if (mountedRef.current) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      }
    })();

    await globalCache.loadPromise;
  }, []);

  /**
   * Busca status de afiliação instantaneamente (O(1))
   */
  const getStatus = useCallback((productId: string): AffiliationStatus | null => {
    return globalCache.statuses.get(productId) || null;
  }, []);

  /**
   * Atualiza status localmente após nova afiliação (sem refetch)
   */
  const updateStatus = useCallback((productId: string, status: string, affiliationId?: string) => {
    console.log(`[useAffiliationStatusCache] Atualizando cache: ${productId} -> ${status}`);
    globalCache.statuses.set(productId, {
      status: status as AffiliationStatus["status"],
      affiliationId: affiliationId || "",
    });
  }, []);

  /**
   * Invalida o cache (ao deslogar)
   */
  const invalidate = useCallback(() => {
    console.log("[useAffiliationStatusCache] Invalidando cache");
    globalCache.statuses.clear();
    globalCache.isLoaded = false;
    globalCache.isLoading = false;
    globalCache.loadPromise = null;
    setIsLoaded(false);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    isLoaded,
    getStatus,
    loadStatuses,
    updateStatus,
    invalidate,
  };
}
