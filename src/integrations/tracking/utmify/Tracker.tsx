/**
 * Componente UTMify Tracker
 * Módulo: src/integrations/tracking/utmify
 * 
 * Componente React responsável por rastrear eventos do UTMify.
 */

import { useEffect } from "react";
import { UTMifyIntegration } from "./types";

interface TrackerProps {
  /** Integração do UTMify */
  integration: UTMifyIntegration | null;
}

/**
 * Componente que rastreia eventos do UTMify
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para rastrear eventos e enviar dados ao UTMify.
 * 
 * @param integration - Integração do UTMify
 * @returns null (componente invisível)
 */
export const Tracker = ({ integration }: TrackerProps) => {
  useEffect(() => {
    // Validação: se integração inválida, não fazer nada
    if (!integration || !integration.active) {
      console.log("[UTMify] Tracker não será ativado (integração inválida ou desativada)");
      return;
    }

    try {
      console.log(
        "[UTMify] ✅ Tracker inicializado com sucesso",
        {
          active: integration.active,
          selected_products: integration.config?.selected_products?.length || "todos",
          selected_events: integration.config?.selected_events?.length || "todos",
        }
      );

      // Aqui você pode adicionar lógica adicional de rastreamento
      // Por exemplo: rastrear PageView automaticamente
      
    } catch (error: unknown) {
      console.error("[UTMify] Erro ao inicializar tracker:", error);
    }
  }, [integration?.id, integration?.active]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Tracker.displayName = "UTMifyTracker";
