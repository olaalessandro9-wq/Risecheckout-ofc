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
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 * @see RISE Protocol V3 - Unified Identity
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger('AffiliationStatusCache');

interface AffiliationStatusesResponse {
  statuses?: Record<string, { status: string; affiliationId: string }>;
}

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
  /** Contador de atualizações (usar como dependência de useMemo) */
  updateTrigger: number;
}

// Cache global para evitar múltiplas chamadas
const globalCache = {
  statuses: new Map<string, AffiliationStatus>(),
  isLoaded: false,
  isLoading: false,
  loadPromise: null as Promise<void> | null,
  updateCounter: 0, // Contador para forçar re-render após atualizações
};

export function useAffiliationStatusCache(): UseAffiliationStatusCacheReturn {
  const [isLoading, setIsLoading] = useState(globalCache.isLoading);
  const [isLoaded, setIsLoaded] = useState(globalCache.isLoaded);
  const [updateTrigger, setUpdateTrigger] = useState(globalCache.updateCounter);
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

    // RISE V3: Não precisa verificar token - cookies httpOnly são enviados automaticamente
    // Se não estiver autenticado, o backend retorna lista vazia

    // Iniciar carregamento
    globalCache.isLoading = true;
    setIsLoading(true);

    globalCache.loadPromise = (async () => {
      try {
        log.debug('Carregando status de afiliação...');

        const { data, error } = await api.call<AffiliationStatusesResponse>("get-all-affiliation-statuses", {});

        if (error) {
          log.error('Erro ao carregar', error);
          throw new Error(error.message);
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
          log.info(`Cache populado com ${globalCache.statuses.size} afiliações`);
        }

        globalCache.isLoaded = true;
      } catch (err) {
        log.error('Erro ao carregar cache', err);
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
    log.debug(`Atualizando cache: ${productId} -> ${status}`);
    globalCache.statuses.set(productId, {
      status: status as AffiliationStatus["status"],
      affiliationId: affiliationId || "",
    });
    // Incrementar contador para forçar re-render dos componentes dependentes
    globalCache.updateCounter++;
    setUpdateTrigger(globalCache.updateCounter);
  }, []);

  /**
   * Invalida o cache (ao deslogar)
   */
  const invalidate = useCallback(() => {
    log.debug('Invalidando cache');
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
    updateTrigger, // Expor para dependência do useMemo
  };
}
