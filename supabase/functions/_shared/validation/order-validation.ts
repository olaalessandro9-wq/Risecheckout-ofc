/**
 * Order Validation - RISE V3 Modular
 * 
 * Validação de orders e valores de pagamento.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { ValidateOrderAmountInput, OrderRecord, ValidationResult, CustomerData, CustomerValidationResult } from "./types.ts";
import { logSecurityViolation } from "./security-logging.ts";

const log = createLogger("order-validation");

/**
 * Valida se o valor do pagamento corresponde ao valor da order no banco
 */
export async function validateOrderAmount(
  input: ValidateOrderAmountInput
): Promise<ValidationResult> {
  const { supabase, orderId, expectedAmountCents, gateway, clientIp } = input;

  log.info(`Validating order ${orderId}: expected ${expectedAmountCents} cents (gateway: ${gateway})`);

  try {
    // Busca order no banco
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, amount_cents, status, vendor_id, product_id, customer_email")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      log.error("Database error fetching order:", error);
      return {
        valid: false,
        error: "Erro interno ao buscar pedido",
        errorCode: 500,
      };
    }

    if (!order) {
      await logSecurityViolation(supabase, {
        type: "order_not_found",
        orderId,
        gateway,
        clientIp,
        details: "Order not found in database",
      });
      
      return {
        valid: false,
        error: "Pedido não encontrado",
        errorCode: 404,
      };
    }

    // Verifica se order está em status válido para pagamento
    const validStatuses = ["pending", "awaiting_payment"];
    if (!validStatuses.includes(order.status)) {
      log.warn(`Order ${orderId} has invalid status for payment: ${order.status}`);
      
      await logSecurityViolation(supabase, {
        type: "order_status_invalid",
        orderId,
        gateway,
        clientIp,
        details: `Order status: ${order.status}`,
      });
      
      return {
        valid: false,
        error: `Pedido em status inválido: ${order.status}`,
        errorCode: 400,
      };
    }

    // Validação crítica: compara valores
    if (order.amount_cents !== expectedAmountCents) {
      log.error(`PRICE TAMPERING DETECTED! Order ${orderId}: DB=${order.amount_cents} vs Request=${expectedAmountCents}`);
      
      await logSecurityViolation(supabase, {
        type: "price_tampering",
        orderId,
        gateway,
        expectedAmount: expectedAmountCents,
        actualAmount: order.amount_cents,
        clientIp,
        details: `DB amount: ${order.amount_cents}, Request amount: ${expectedAmountCents}`,
      });
      
      return {
        valid: false,
        error: "Valor do pagamento não corresponde ao pedido",
        errorCode: 400,
      };
    }

    log.info(`✅ Order ${orderId} validated successfully: ${order.amount_cents} cents`);
    
    return {
      valid: true,
      order: order as OrderRecord,
    };

  } catch (error) {
    log.error("Exception in validateOrderAmount:", error);
    return {
      valid: false,
      error: "Erro interno na validação",
      errorCode: 500,
    };
  }
}

/**
 * Valida dados do cliente
 */
export function validateCustomerData(customer: unknown): CustomerValidationResult {
  const errors: string[] = [];
  
  if (!customer || typeof customer !== "object") {
    return { valid: false, errors: ["Customer data is required"] };
  }
  
  const data = customer as Record<string, unknown>;
  
  // Nome obrigatório
  if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
    errors.push("Nome é obrigatório (mínimo 2 caracteres)");
  }
  
  // Email obrigatório e válido
  if (!data.email || typeof data.email !== "string") {
    errors.push("Email é obrigatório");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Email inválido");
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Retorna dados sanitizados
  return {
    valid: true,
    sanitizedData: {
      name: (data.name as string).trim(),
      email: (data.email as string).toLowerCase().trim(),
      document: data.document ? String(data.document).replace(/\D/g, "") : undefined,
      phone: data.phone ? String(data.phone).replace(/\D/g, "") : undefined,
    },
  };
}
