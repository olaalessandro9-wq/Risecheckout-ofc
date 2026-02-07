/**
 * Componente UTMify Pixel
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * Componente React responsável por injetar o script CDN do UTMify
 * e disparar o evento InitiateCheckout (evento comportamental frontend).
 * 
 * Segue o mesmo padrão arquitetural de Facebook/Pixel.tsx, TikTok/Pixel.tsx, Kwai/Pixel.tsx.
 * 
 * Atributos data-utmify-prevent-*:
 * - data-utmify-prevent-xcod-sck: Evita conflito com captura própria de UTMs do RiseCheckout
 * - data-utmify-prevent-subids: Evita conflito com captura própria de subids do RiseCheckout
 */

import { useEffect } from "react";
import { createLogger } from "@/lib/logger";
import type { UTMifyIntegration } from "./types";

const log = createLogger("UTMifyPixel");

// ============================================================================
// CONSTANTS
// ============================================================================

const UTMIFY_CDN_URL = "https://cdn.utmify.com.br/scripts/utms/latest.js";
const SCRIPT_ID = "utmify-pixel-script";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_INTERVAL_MS = 500;

// ============================================================================
// INTERFACE
// ============================================================================

interface PixelProps {
  /** Integração do UTMify */
  integration: UTMifyIntegration | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Dispara o evento InitiateCheckout com retry.
 * O script CDN pode demorar para inicializar window.utmify,
 * então tentamos até MAX_RETRY_ATTEMPTS vezes.
 */
const fireInitiateCheckout = (attempt: number = 1): void => {
  if (window.utmify) {
    window.utmify("track", "InitiateCheckout");
    log.info("Evento InitiateCheckout disparado com sucesso", { attempt });
    return;
  }

  if (attempt >= MAX_RETRY_ATTEMPTS) {
    log.warn("window.utmify não disponível após todas as tentativas", {
      attempts: MAX_RETRY_ATTEMPTS,
    });
    return;
  }

  log.debug("window.utmify ainda não disponível, aguardando...", { attempt });
  setTimeout(() => fireInitiateCheckout(attempt + 1), RETRY_INTERVAL_MS);
};

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Componente que injeta o script CDN do UTMify e dispara InitiateCheckout.
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e disparar o evento comportamental.
 */
export const Pixel = ({ integration }: PixelProps) => {
  useEffect(() => {
    // Validação: se integração inválida, não fazer nada
    if (!integration || !integration.active) {
      log.debug("Pixel não será ativado (integração inválida ou desativada)");
      return;
    }

    // Idempotência: se script já foi injetado, apenas disparar evento
    if (document.getElementById(SCRIPT_ID)) {
      log.debug("Script UTMify já foi injetado anteriormente");
      fireInitiateCheckout();
      return;
    }

    try {
      // Criar elemento script com atributos de prevenção de conflito
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.async = true;
      script.defer = true;
      script.src = UTMIFY_CDN_URL;

      // Evitar conflito com captura própria de UTMs do RiseCheckout
      script.setAttribute("data-utmify-prevent-xcod-sck", "");
      script.setAttribute("data-utmify-prevent-subids", "");

      script.onerror = () => {
        log.error("Erro ao carregar script CDN do UTMify");
      };

      script.onload = () => {
        log.debug("Script CDN do UTMify carregado com sucesso");
        fireInitiateCheckout();
      };

      // Injetar script no head
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      log.info("Pixel UTMify inicializado", {
        active: integration.active,
        selected_products: integration.config?.selected_products?.length || "todos",
      });
    } catch (error: unknown) {
      log.error("Erro ao inicializar pixel UTMify", error);
    }
  }, [integration?.id, integration?.active]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Pixel.displayName = "UTMifyPixel";
