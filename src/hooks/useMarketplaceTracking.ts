import { useCallback, useRef, useEffect } from "react";
import { trackProductView, trackProductClick } from "@/services/marketplace";

interface UseMarketplaceTrackingReturn {
  trackView: (productId: string) => void;
  trackClick: (productId: string) => void;
}

/**
 * Hook para rastrear visualizações e cliques no marketplace
 * 
 * Features:
 * - Rastreia visualização automaticamente (uma vez por produto)
 * - Rastreia cliques manualmente
 * - Debounce para evitar múltiplas chamadas
 * - Não bloqueia a UI em caso de erro
 */
export function useMarketplaceTracking(): UseMarketplaceTrackingReturn {
  const trackedViews = useRef<Set<string>>(new Set());
  const trackingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (trackingTimeout.current) {
        clearTimeout(trackingTimeout.current);
      }
    };
  }, []);

  /**
   * Rastreia visualização de um produto
   * (Chamado automaticamente ao visualizar detalhes)
   */
  const trackView = useCallback((productId: string) => {
    // Evitar rastrear o mesmo produto múltiplas vezes
    if (trackedViews.current.has(productId)) {
      return;
    }

    trackedViews.current.add(productId);

    // Debounce de 500ms
    if (trackingTimeout.current) {
      clearTimeout(trackingTimeout.current);
    }

    trackingTimeout.current = setTimeout(async () => {
      try {
        await trackProductView(productId);
        
        if (import.meta.env.DEV) {
          console.log(`[Marketplace] Visualização rastreada: ${productId}`);
        }
      } catch (error: unknown) {
        console.error("[Marketplace] Erro ao rastrear visualização:", error);
        // Remover do set para permitir retry
        trackedViews.current.delete(productId);
      }
    }, 500);
  }, []);

  /**
   * Rastreia clique em um produto
   * (Chamado manualmente ao clicar em "Promover" ou link de afiliado)
   */
  const trackClick = useCallback(async (productId: string) => {
    try {
      await trackProductClick(productId);
      
      if (import.meta.env.DEV) {
        console.log(`[Marketplace] Clique rastreado: ${productId}`);
      }
    } catch (error: unknown) {
      console.error("[Marketplace] Erro ao rastrear clique:", error);
      // Não lançar erro para não bloquear a UI
    }
  }, []);

  return {
    trackView,
    trackClick,
  };
}
