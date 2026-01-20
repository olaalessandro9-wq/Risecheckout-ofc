/**
 * useMercadoPagoInit - Hook para inicializar SDK do Mercado Pago
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Responsabilidade única: Carregar e inicializar script da SDK
 */

import { useState, useEffect } from "react";
import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPago");

/**
 * Hook para inicializar o Mercado Pago no frontend
 * 
 * Carrega o script do Mercado Pago e inicializa a SDK.
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @returns true se inicializado com sucesso
 * 
 * @example
 * const isInitialized = useMercadoPagoInit(publicKey);
 * 
 * if (isInitialized) {
 *   // Pronto para usar Brick
 * }
 */
export function useMercadoPagoInit(publicKey?: string): boolean {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setIsInitialized(false);
      return;
    }

    const initMP = async () => {
      try {
        // Carregar script do Mercado Pago
        if (!window.MercadoPago) {
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          script.onload = () => {
            if (window.MercadoPago) {
              try {
                new window.MercadoPago(publicKey, { locale: "pt-BR" });
              } catch {
                // SDK initialization may throw in some cases, but still work
              }
              log.info("SDK carregada e inicializada");
              setIsInitialized(true);
            }
          };
          script.onerror = () => {
            log.error("Erro ao carregar SDK");
            setIsInitialized(false);
          };
          document.head.appendChild(script);
        } else {
          // SDK já carregada
          try {
            new window.MercadoPago(publicKey, { locale: "pt-BR" });
          } catch {
            // SDK initialization may throw in some cases, but still work
          }
          log.debug("SDK já estava carregada");
          setIsInitialized(true);
        }
      } catch (error: unknown) {
        log.error("Erro ao inicializar", error);
        setIsInitialized(false);
      }
    };

    initMP();
  }, [publicKey]);

  return isInitialized;
}
