/**
 * Componente Facebook Pixel
 * Módulo: src/integrations/tracking/facebook
 * 
 * Componente React responsável por injetar o script do Facebook Pixel
 * e inicializar o rastreamento.
 */

import { useEffect } from "react";
import { FacebookPixelConfig } from "./types";

interface PixelProps {
  /** Configuração do Facebook Pixel */
  config: FacebookPixelConfig | null;
}

/**
 * Componente que injeta o script do Facebook Pixel
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e inicializar o fbq global.
 * 
 * @param config - Configuração do pixel
 * @returns null (componente invisível)
 */
export const Pixel = ({ config }: PixelProps) => {
  useEffect(() => {
    // Validação: se config inválida, não fazer nada
    if (!config || !config.enabled || !config.pixel_id) {
      console.log("[Facebook] Pixel não será carregado (config inválida ou desativada)");
      return;
    }

    const loadPixel = () => {
      // Se fbq já foi carregado, não carregar novamente
      if (window.fbq) {
        console.log("[Facebook] fbq já foi carregado anteriormente");
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
          console.error("[Facebook] Erro ao carregar script do Facebook Pixel");
        };
        script.onload = () => {
          console.log("[Facebook] Script do Facebook Pixel carregado com sucesso");
        };

        // Injetar script no head
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        // Inicializar pixel com o ID
        window.fbq?.("init", config.pixel_id);

        // Disparar evento PageView
        window.fbq?.("track", "PageView");

        console.log(
          `[Facebook] ✅ Pixel ${config.pixel_id} inicializado com sucesso`,
          {
            enabled: config.enabled,
            fire_purchase_on_pix: config.fire_purchase_on_pix,
            selected_products: config.selected_products?.length || "todos",
          }
        );
      } catch (error: unknown) {
        console.error("[Facebook] Erro ao carregar pixel:", error);
      }
    };

    // Executar apenas no navegador (não SSR)
    if (typeof window !== "undefined") {
      loadPixel();
    }
  }, [config?.pixel_id, config?.enabled]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Pixel.displayName = "FacebookPixel";
