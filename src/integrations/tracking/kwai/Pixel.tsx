/**
 * Componente Kwai Pixel
 * Módulo: src/integrations/tracking/kwai
 * 
 * Componente React responsável por injetar o script do Kwai Pixel (kwaiq)
 * e inicializar o rastreamento.
 */

import { useEffect } from "react";
import { KwaiIntegration } from "./types";

interface PixelProps {
  /** Integração do Kwai Pixel */
  config: KwaiIntegration | null;
}

/**
 * Componente que injeta o script do Kwai Pixel (kwaiq)
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e inicializar o kwaiq global.
 * 
 * @param config - Integração do Kwai Pixel
 * @returns null (componente invisível)
 */
export const Pixel = ({ config }: PixelProps) => {
  useEffect(() => {
    // Validação: se integração inválida, não fazer nada
    if (!config || !config.active || !config.config?.pixel_id) {
      console.log("[Kwai] Pixel não será ativado (integração inválida ou desativada)");
      return;
    }

    const loadPixel = () => {
      // Se kwaiq já foi carregado, não carregar novamente
      if (window.kwaiq) {
        console.log("[Kwai] kwaiq já foi carregado anteriormente");
        return;
      }

      try {
        // Inicializar fila e função kwaiq tipados
        window._kwai_pixel = window._kwai_pixel || [];
        
        const kwaiqFunction = (eventName: string, eventData?: Record<string, unknown>) => {
          window._kwai_pixel?.push({
            event: eventName,
            data: eventData,
          });
        };

        // Adicionar método track para compatibilidade
        kwaiqFunction.track = kwaiqFunction;

        window.kwaiq = kwaiqFunction;

        // Criar elemento script
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://s3.amazonaws.com/kwai-pixel/pixel.js?v=1";
        script.onerror = () => {
          console.error("[Kwai] Erro ao carregar script do Kwai Pixel");
        };
        script.onload = () => {
          console.log("[Kwai] Script do Kwai Pixel carregado com sucesso");
        };

        // Injetar script no head
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        console.log(
          `[Kwai] ✅ Pixel ${config.config.pixel_id} inicializado com sucesso`,
          {
            active: config.active,
            selected_products: config.config.selected_products?.length || "todos",
          }
        );
      } catch (error) {
        console.error("[Kwai] Erro ao carregar pixel:", error);
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
Pixel.displayName = "KwaiPixel";
