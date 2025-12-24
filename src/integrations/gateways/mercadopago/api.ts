/**
 * Chamadas de API do Mercado Pago
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Este arquivo contém funções para interagir com a API do Mercado Pago.
 * Todas as chamadas devem ser feitas via backend (Edge Function) para segurança.
 */

import {
  MercadoPagoPreference,
  MercadoPagoPreferenceResponse,
  MercadoPagoPaymentResponse,
  MercadoPagoResponse,
} from "./types";

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * 
 * Deve ser chamado via Edge Function (backend) para segurança.
 * 
 * @param vendorId - ID do vendedor
 * @param preference - Dados da preferência
 * @returns Resposta com ID e URL de checkout
 * 
 * @example
 * const result = await createPreference(vendorId, {
 *   items: [...],
 *   payer: {...},
 *   external_reference: orderId,
 *   ...
 * });
 */
export async function createPreference(
  vendorId: string,
  preference: MercadoPagoPreference
): Promise<MercadoPagoResponse> {
  try {
    // Validação
    if (!vendorId) {
      return {
        success: false,
        message: "Vendor ID não fornecido",
      };
    }

    if (!preference.items?.length) {
      return {
        success: false,
        message: "Nenhum item fornecido",
      };
    }

    // Chamar Edge Function
    const response = await fetch("/api/mercadopago/create-preference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vendor_id: vendorId,
        preference,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[MercadoPago] Erro ao criar preferência:", error);
      return {
        success: false,
        message: "Erro ao criar preferência",
        error: error.error,
      };
    }

    const data = (await response.json()) as MercadoPagoPreferenceResponse;

    console.log(
      "[MercadoPago] ✅ Preferência criada com sucesso",
      {
        preference_id: data.id,
        vendor_id: vendorId,
      }
    );

    return {
      success: true,
      message: "Preferência criada com sucesso",
      data,
    };
  } catch (error) {
    console.error("[MercadoPago] Erro ao criar preferência:", error);
    return {
      success: false,
      message: "Erro ao criar preferência",
      error: {
        code: "CREATE_PREFERENCE_ERROR",
        message: String(error),
      },
    };
  }
}

/**
 * Processa um pagamento via Brick (Cartão)
 * 
 * Deve ser chamado via Edge Function (backend) para segurança.
 * 
 * @param vendorId - ID do vendedor
 * @param orderId - ID do pedido
 * @param token - Token do cartão gerado pelo Brick
 * @param paymentMethodId - ID do método de pagamento
 * @param installments - Número de parcelas
 * @param amount - Valor do pagamento em reais
 * @param email - Email do cliente
 * @returns Resposta com dados do pagamento
 * 
 * @example
 * const result = await processPayment(
 *   vendorId,
 *   orderId,
 *   token,
 *   "visa",
 *   1,
 *   100.00,
 *   "customer@example.com"
 * );
 */
export async function processPayment(
  vendorId: string,
  orderId: string,
  token: string,
  paymentMethodId: string,
  installments: number,
  amount: number,
  email: string
): Promise<MercadoPagoResponse> {
  try {
    // Validação
    if (!vendorId || !orderId || !token || !paymentMethodId) {
      return {
        success: false,
        message: "Parâmetros obrigatórios não fornecidos",
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        message: "Valor inválido",
      };
    }

    // Chamar Edge Function
    const response = await fetch("/api/mercadopago/process-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vendor_id: vendorId,
        order_id: orderId,
        token,
        payment_method_id: paymentMethodId,
        installments,
        amount,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[MercadoPago] Erro ao processar pagamento:", error);
      return {
        success: false,
        message: "Erro ao processar pagamento",
        error: error.error,
      };
    }

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    console.log(
      "[MercadoPago] ✅ Pagamento processado",
      {
        payment_id: data.id,
        status: data.status,
        vendor_id: vendorId,
      }
    );

    return {
      success: true,
      message: `Pagamento ${data.status}`,
      data,
    };
  } catch (error) {
    console.error("[MercadoPago] Erro ao processar pagamento:", error);
    return {
      success: false,
      message: "Erro ao processar pagamento",
      error: {
        code: "PROCESS_PAYMENT_ERROR",
        message: String(error),
      },
    };
  }
}

/**
 * Obtém informações de um pagamento
 * 
 * @param vendorId - ID do vendedor
 * @param paymentId - ID do pagamento
 * @returns Dados do pagamento
 * 
 * @example
 * const payment = await getPayment(vendorId, paymentId);
 */
export async function getPayment(
  vendorId: string,
  paymentId: number
): Promise<MercadoPagoResponse> {
  try {
    // Validação
    if (!vendorId || !paymentId) {
      return {
        success: false,
        message: "Parâmetros obrigatórios não fornecidos",
      };
    }

    // Chamar Edge Function
    const response = await fetch(
      `/api/mercadopago/get-payment?vendor_id=${vendorId}&payment_id=${paymentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[MercadoPago] Erro ao obter pagamento:", error);
      return {
        success: false,
        message: "Erro ao obter pagamento",
        error: error.error,
      };
    }

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    return {
      success: true,
      message: "Pagamento obtido com sucesso",
      data,
    };
  } catch (error) {
    console.error("[MercadoPago] Erro ao obter pagamento:", error);
    return {
      success: false,
      message: "Erro ao obter pagamento",
      error: {
        code: "GET_PAYMENT_ERROR",
        message: String(error),
      },
    };
  }
}

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
  // Precisa ter Public Key
  if (!publicKey) {
    console.warn("[MercadoPago] Public Key não configurada");
    return false;
  }

  // Public Key deve começar com "APP_USR-"
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
    // Validação
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
      window.MercadoPago.setPublishableKey?.(publicKey);
      console.log("[MercadoPago] ✅ MercadoPago inicializado com sucesso");
      return true;
    }

    console.warn("[MercadoPago] MercadoPago SDK não carregado");
    return false;
  } catch (error) {
    console.error("[MercadoPago] Erro ao inicializar:", error);
    return false;
  }
}
