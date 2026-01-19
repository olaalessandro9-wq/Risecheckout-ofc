/**
 * Utilitários do SDK - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/api/sdk-utils.ts
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Contém funções de validação e inicialização do SDK.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPago");

/**
 * Valida se a configuração do Mercado Pago é válida
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @returns true se válida, false caso contrário
 * 
 * @example
 * if (!isValidConfig(publicKey)) {
 *   log.error("Configuração inválida");
 * }
 */
export function isValidConfig(publicKey?: string): boolean {
  if (!publicKey) {
    log.warn("Public Key não configurada");
    return false;
  }

  if (!publicKey.startsWith("APP_USR-")) {
    log.warn("Public Key inválida");
    return false;
  }

  return true;
}

/**
 * Inicializa o Mercado Pago no frontend
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @returns true se inicializado com sucesso
 * 
 * @example
 * if (initializeMercadoPago(publicKey)) {
 *   // Pronto para usar Brick
 * }
 */
export function initializeMercadoPago(publicKey: string): boolean {
  try {
    if (!isValidConfig(publicKey)) {
      return false;
    }

    // Verificar se MercadoPago já foi inicializado
    if (typeof window !== "undefined" && window.MercadoPago) {
      log.debug("MercadoPago já foi inicializado");
      return true;
    }

    // Inicializar MercadoPago
    if (typeof window !== "undefined" && window.MercadoPago) {
      const mpConstructor = window.MercadoPago as unknown as { 
        setPublishableKey?: (key: string) => void 
      };
      if (typeof mpConstructor.setPublishableKey === 'function') {
        mpConstructor.setPublishableKey(publicKey);
      }
      log.info("MercadoPago inicializado com sucesso");
      return true;
    }

    log.warn("MercadoPago SDK não carregado");
    return false;
  } catch (error: unknown) {
    log.error("Erro ao inicializar", error);
    return false;
  }
}
