/**
 * Componente Google Ads Tracker
 * Módulo: src/integrations/tracking/google-ads
 * 
 * Componente React responsável por injetar o script do Google Ads (gtag)
 * e inicializar o rastreamento.
 */

import { useEffect } from "react";
import { GoogleAdsIntegration } from "./types";

interface TrackerProps {
  /** Integração do Google Ads */
  integration: GoogleAdsIntegration | null;
}

/**
 * Componente que injeta o script do Google Ads (gtag)
 * 
 * Este componente é invisível (retorna null) e funciona apenas
 * para carregar o script e inicializar o gtag global.
 * 
 * @param integration - Integração do Google Ads
 * @returns null (componente invisível)
 */
export const Tracker = ({ integration }: TrackerProps) => {
  useEffect(() => {
    // Validação: se integração inválida, não fazer nada
    if (!integration || !integration.active || !integration.config?.conversion_id) {
      console.log("[Google Ads] Tracker não será ativado (integração inválida ou desativada)");
      return;
    }

    const loadTracker = () => {
      // Se gtag já foi carregado, não carregar novamente
      if (window.gtag) {
        console.log("[Google Ads] gtag já foi carregado anteriormente");
        return;
      }

      try {
        // Inicializar função gtag (padrão do Google)
        // @ts-ignore
        window.dataLayer = window.dataLayer || [];
        // @ts-ignore
        window.gtag = function () {
          // @ts-ignore
          window.dataLayer.push(arguments);
        };

        // Metadados do gtag
        // @ts-ignore
        window.gtag("js", new Date());

        // Criar elemento script
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${integration.config.conversion_id}`;
        script.onerror = () => {
          console.error("[Google Ads] Erro ao carregar script do Google Ads");
        };
        script.onload = () => {
          console.log("[Google Ads] Script do Google Ads carregado com sucesso");
        };

        // Injetar script no head
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }

        // Configurar Google Ads
        // @ts-ignore
        window.gtag("config", integration.config.conversion_id, {
          allow_google_signals: true,
          allow_ad_personalization_signals: true,
        });

        console.log(
          `[Google Ads] ✅ Tracker ${integration.config.conversion_id} inicializado com sucesso`,
          {
            active: integration.active,
            selected_products: integration.config.selected_products?.length || "todos",
            event_labels: integration.config.event_labels?.length || 0,
          }
        );
      } catch (error) {
        console.error("[Google Ads] Erro ao carregar tracker:", error);
      }
    };

    // Executar apenas no navegador (não SSR)
    if (typeof window !== "undefined") {
      loadTracker();
    }
  }, [integration?.config?.conversion_id, integration?.active]);

  // Componente invisível
  return null;
};

// Exportar com display name para debugging
Tracker.displayName = "GoogleAdsTracker";
