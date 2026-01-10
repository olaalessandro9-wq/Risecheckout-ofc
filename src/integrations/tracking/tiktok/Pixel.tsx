/**
 * Componente TikTok Pixel
 * Módulo: src/integrations/tracking/tiktok
 * 
 * Componente React responsável por injetar o script do TikTok Pixel (ttq)
 * e inicializar o rastreamento.
 */

import { useEffect } from "react";
import { TikTokIntegration } from "./types";

interface PixelProps {
  /** Integração do TikTok Pixel */
  config: TikTokIntegration | null;
}

/**
 * Componente que injeta o script do TikTok Pixel (ttq)
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e inicializar o ttq global.
 * 
 * @param config - Integração do TikTok Pixel
 * @returns null (componente invisível)
 */
export const Pixel = ({ config }: PixelProps) => {
  useEffect(() => {
    // Validação: se integração inválida, não fazer nada
    if (!config || !config.active || !config.config?.pixel_id) {
      console.log("[TikTok] Pixel não será ativado (integração inválida ou desativada)");
      return;
    }

    const loadPixel = () => {
      // Se ttq já foi carregado, não carregar novamente
      if (window.ttq) {
        console.log("[TikTok] ttq já foi carregado anteriormente");
        return;
      }

      try {
        // Inicializar fila e objeto ttq tipados
        window._tiktok_pixel = window._tiktok_pixel || [];
        
        window.ttq = {
          track: (eventName: string, eventData?: Record<string, unknown>) => {
            window._tiktok_pixel?.push({
              event: eventName,
              data: eventData,
            });
          },
          page: () => {
            window._tiktok_pixel?.push({ event: "PageView" });
          },
          load: (pixelId: string) => {
            window._tiktok_pixel?.push({ event: "load", data: { pixelId } });
          },
          identify: (userData: Record<string, unknown>) => {
            window._tiktok_pixel?.push({ event: "identify", data: userData });
          },
        };

        // Criar elemento script
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://analytics.tiktok.com/i18n/pixel/events.js?v=1";
        script.onerror = () => {
          console.error("[TikTok] Erro ao carregar script do TikTok Pixel");
        };
        script.onload = () => {
          console.log("[TikTok] Script do TikTok Pixel carregado com sucesso");
        };

        // Injetar script no head
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        console.log(
          `[TikTok] ✅ Pixel ${config.config.pixel_id} inicializado com sucesso`,
          {
            active: config.active,
            selected_products: config.config.selected_products?.length || "todos",
          }
        );
      } catch (error) {
        console.error("[TikTok] Erro ao carregar pixel:", error);
      }
    };

    // Executar apenas no navegador (não SSR)
    if (typeof window !== "undefined") {
      loadPixel();
    }
  }, [config?.config?.pixel_id, config?.active]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Pixel.displayName = "TikTokPixel";
