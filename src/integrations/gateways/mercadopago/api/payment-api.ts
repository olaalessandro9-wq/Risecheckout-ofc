/**
 * Chamadas de API de Pagamento - Mercado Pago Gateway
 * 
 * Módulo: src/integrations/gateways/mercadopago/api/payment-api.ts
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant - Zero console.log
 * Contém funções para criar preferências e processar pagamentos.
 */

import {
  MercadoPagoPreference,
  MercadoPagoPreferenceResponse,
  MercadoPagoPaymentResponse,
  MercadoPagoResponse,
} from '../types';
import { createLogger } from "@/lib/logger";

const log = createLogger("MercadoPago");

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * 
 * Deve ser chamado via Edge Function (backend) para segurança.
 * 
 * @param vendorId - ID do vendedor
 * @param preference - Dados da preferência
 * @returns Resposta com ID e URL de checkout
 */
export async function createPreference(
  vendorId: string,
  preference: MercadoPagoPreference
): Promise<MercadoPagoResponse> {
  try {
    if (!vendorId) {
      return { success: false, message: "Vendor ID não fornecido" };
    }

    if (!preference.items?.length) {
      return { success: false, message: "Nenhum item fornecido" };
    }

    const response = await fetch("/api/mercadopago/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId, preference }),
    });

    if (!response.ok) {
      const error = await response.json();
      log.error("Erro ao criar preferência", error);
      return { success: false, message: "Erro ao criar preferência", error: error.error };
    }

    const data = (await response.json()) as MercadoPagoPreferenceResponse;

    log.info("Preferência criada com sucesso", {
      preference_id: data.id,
      vendor_id: vendorId,
    });

    return { success: true, message: "Preferência criada com sucesso", data };
  } catch (error: unknown) {
    log.error("Erro ao criar preferência", error);
    return {
      success: false,
      message: "Erro ao criar preferência",
      error: { code: "CREATE_PREFERENCE_ERROR", message: String(error) },
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
    if (!vendorId || !orderId || !token || !paymentMethodId) {
      return { success: false, message: "Parâmetros obrigatórios não fornecidos" };
    }

    if (amount <= 0) {
      return { success: false, message: "Valor inválido" };
    }

    const response = await fetch("/api/mercadopago/process-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      log.error("Erro ao processar pagamento", error);
      return { success: false, message: "Erro ao processar pagamento", error: error.error };
    }

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    log.info("Pagamento processado", {
      payment_id: data.id,
      status: data.status,
      vendor_id: vendorId,
    });

    return { success: true, message: `Pagamento ${data.status}`, data };
  } catch (error: unknown) {
    log.error("Erro ao processar pagamento", error);
    return {
      success: false,
      message: "Erro ao processar pagamento",
      error: { code: "PROCESS_PAYMENT_ERROR", message: String(error) },
    };
  }
}

/**
 * Obtém informações de um pagamento
 * 
 * @param vendorId - ID do vendedor
 * @param paymentId - ID do pagamento
 * @returns Dados do pagamento
 */
export async function getPayment(
  vendorId: string,
  paymentId: number
): Promise<MercadoPagoResponse> {
  try {
    if (!vendorId || !paymentId) {
      return { success: false, message: "Parâmetros obrigatórios não fornecidos" };
    }

    const response = await fetch(
      `/api/mercadopago/get-payment?vendor_id=${vendorId}&payment_id=${paymentId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      log.error("Erro ao obter pagamento", error);
      return { success: false, message: "Erro ao obter pagamento", error: error.error };
    }

    const data = (await response.json()) as MercadoPagoPaymentResponse;

    return { success: true, message: "Pagamento obtido com sucesso", data };
  } catch (error: unknown) {
    log.error("Erro ao obter pagamento", error);
    return {
      success: false,
      message: "Erro ao obter pagamento",
      error: { code: "GET_PAYMENT_ERROR", message: String(error) },
    };
  }
}
