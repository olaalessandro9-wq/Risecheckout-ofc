/**
 * Componente UTMify Tracker
 * 
 * @version 3.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useEffect } from "react";
import { createLogger } from "@/lib/logger";
import { UTMifyIntegration } from "./types";

const log = createLogger("UTMify");

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
      log.debug("Tracker não será ativado (integração inválida ou desativada)");
      return;
    }

    try {
      log.info("✅ Tracker inicializado com sucesso", {
        active: integration.active,
        selected_products: integration.config?.selected_products?.length || "todos",
        selected_events: integration.config?.selected_events?.length || "todos",
      });
      
    } catch (error: unknown) {
      log.error("Erro ao inicializar tracker:", error);
    }
  }, [integration?.id, integration?.active]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Tracker.displayName = "UTMifyTracker";
