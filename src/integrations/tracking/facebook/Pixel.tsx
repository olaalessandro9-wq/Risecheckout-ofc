/**
 * Componente Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * @version 3.0.0 - RISE Protocol V3 - Advanced Matching
 * Componente React responsável por injetar o script do Facebook Pixel
 * e inicializar o rastreamento com Advanced Matching (Manual Mode).
 * 
 * Advanced Matching sends hashed user data (email, phone, name) alongside
 * the pixel initialization, dramatically improving Event Match Quality (EMQ).
 */

import { useEffect } from "react";
import { FacebookPixelConfig, FacebookAdvancedMatchingData } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("Facebook");

interface PixelProps {
  /** Configuração do Facebook Pixel */
  config: FacebookPixelConfig | null;
  /** User data for Advanced Matching (optional but recommended for EMQ 8.0+) */
  advancedMatching?: FacebookAdvancedMatchingData;
}

/**
 * Componente que injeta o script do Facebook Pixel com Advanced Matching.
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e inicializar o fbq global.
 * 
 * When advancedMatching is provided, the Pixel SDK automatically hashes
 * the user data (SHA-256) and includes it in all subsequent events,
 * enabling Meta to match conversions to users with much higher accuracy.
 * 
 * @param config - Configuração do pixel
 * @param advancedMatching - Dados do usuário para Advanced Matching
 * @returns null (componente invisível)
 */
export const Pixel = ({ config, advancedMatching }: PixelProps) => {
  useEffect(() => {
    // Validação: se config inválida, não fazer nada
    if (!config || !config.enabled || !config.pixel_id) {
      log.debug("Pixel não será carregado (config inválida ou desativada)");
      return;
    }

    const loadPixel = () => {
      // Se fbq já foi carregado, não carregar novamente
      if (window.fbq) {
        log.debug("fbq já foi carregado anteriormente");
        return;
      }

      try {
        // Criar função fbq tipada (padrão do Facebook)
        const fbqFunction = function(...args: unknown[]) {
          if (window.fbq?.callMethod) {
            window.fbq.callMethod(...args);
          } else if (window.fbq?.queue) {
            window.fbq.queue.push(args);
          }
        };

        // Inicializar objeto fbq com metadados
        const fbq = fbqFunction as typeof window.fbq;
        if (fbq) {
          fbq.queue = [];
          fbq.loaded = true;
          fbq.version = "2.0";
          fbq.push = fbqFunction as typeof window.fbq;
        }

        // Atribuir ao window
        window.fbq = fbq;
        if (!window._fbq) {
          window._fbq = fbq;
        }

        // Criar elemento script
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.onerror = () => {
          log.error("Erro ao carregar script do Facebook Pixel");
        };
        script.onload = () => {
          log.debug("Script do Facebook Pixel carregado com sucesso");
        };

        // Injetar script no head
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        // Build Advanced Matching userData object
        // The Pixel SDK auto-hashes plain text values (SHA-256)
        const userData = buildAdvancedMatchingPayload(advancedMatching);

        // Inicializar pixel com o ID + Advanced Matching
        if (userData) {
          window.fbq?.("init", config.pixel_id, userData);
          log.info("Pixel inicializado com Advanced Matching", {
            pixel_id: config.pixel_id,
            has_email: !!advancedMatching?.em,
            has_phone: !!advancedMatching?.ph,
            has_name: !!(advancedMatching?.fn || advancedMatching?.ln),
          });
        } else {
          window.fbq?.("init", config.pixel_id);
          log.info("Pixel inicializado sem Advanced Matching", {
            pixel_id: config.pixel_id,
          });
        }

        // Disparar evento PageView
        window.fbq?.("track", "PageView");

        log.info("Pixel ativo", {
          pixel_id: config.pixel_id,
          enabled: config.enabled,
          fire_purchase_on_pix: config.fire_purchase_on_pix,
          selected_products: config.selected_products?.length || "todos",
        });
      } catch (error: unknown) {
        log.error("Erro ao carregar pixel", error);
      }
    };

    // Executar apenas no navegador (não SSR)
    if (typeof window !== "undefined") {
      loadPixel();
    }
  }, [config?.pixel_id, config?.enabled, advancedMatching?.em]);

  // Componente invisível
  return null;
};

/**
 * Builds the Advanced Matching payload for fbq("init").
 * 
 * Only includes fields that have valid values.
 * The Pixel SDK expects plain text — it handles hashing internally.
 * 
 * @param data - Raw user data from the checkout form
 * @returns Object with valid fields, or null if no data available
 */
function buildAdvancedMatchingPayload(
  data?: FacebookAdvancedMatchingData
): Record<string, string> | null {
  if (!data) return null;

  const payload: Record<string, string> = {};

  if (data.em) {
    payload.em = data.em.toLowerCase().trim();
  }
  if (data.ph) {
    // Remove all non-digits and ensure country code
    const digits = data.ph.replace(/\D/g, "");
    if (digits.length >= 10) {
      payload.ph = digits;
    }
  }
  if (data.fn) {
    payload.fn = data.fn.toLowerCase().trim();
  }
  if (data.ln) {
    payload.ln = data.ln.toLowerCase().trim();
  }

  // Country is always Brazil for this checkout
  payload.country = "br";

  return Object.keys(payload).length > 1 ? payload : null;
}

// Exportar com display name para debugging
Pixel.displayName = "FacebookPixel";
