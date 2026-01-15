/**
 * Utilitários do SDK - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/api/sdk-utils.ts
 * RISE ARCHITECT PROTOCOL V2 - Single Responsibility
 * 
 * Contém funções de validação e inicialização do SDK.
 */

/**
 * Valida se a configuração do Mercado Pago é válida
 * 
 * @param publicKey - Public Key do Mercado Pago
 * @returns true se válida, false caso contrário
 * 
 * @example
 * if (!isValidConfig(publicKey)) {
 *   console.error("Configuração inválida");
 * }
 */
export function isValidConfig(publicKey?: string): boolean {
  if (!publicKey) {
    console.warn("[MercadoPago] Public Key não configurada");
    return false;
  }

  if (!publicKey.startsWith("APP_USR-")) {
    console.warn("[MercadoPago] Public Key inválida");
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
      console.log("[MercadoPago] MercadoPago já foi inicializado");
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
      console.log("[MercadoPago] ✅ MercadoPago inicializado com sucesso");
      return true;
    }

    console.warn("[MercadoPago] MercadoPago SDK não carregado");
    return false;
  } catch (error: unknown) {
    console.error("[MercadoPago] Erro ao inicializar:", error);
    return false;
  }
}
