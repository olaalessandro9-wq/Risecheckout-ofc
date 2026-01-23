/**
 * Payment Validation Module
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validação centralizada de pagamentos.
 * Usado pelos Adapters para garantir integridade de dados.
 * 
 * @module _shared/payment-validation
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";

const log = createLogger("payment-validation");

// ============================================================================
// TYPES
// ============================================================================

export interface ValidateOrderAmountInput {
  /** Supabase client com service role */
  supabase: SupabaseClient;
  /** ID da order */
  orderId: string;
  /** Valor esperado em centavos (do frontend/request) */
  expectedAmountCents: number;
  /** Nome do gateway para logging */
  gateway: string;
  /** IP do cliente para audit */
  clientIp?: string;
}

export interface OrderRecord {
  id: string;
  amount_cents: number;
  status: string;
  vendor_id: string;
  product_id: string;
  customer_email: string;
}

export interface ValidationResult {
  /** Se a validação passou */
  valid: boolean;
  /** Dados da order se encontrada */
  order?: OrderRecord;
  /** Mensagem de erro se inválido */
  error?: string;
  /** Código de erro para resposta HTTP */
  errorCode?: number;
}

export interface SecurityViolationInput {
  supabase: SupabaseClient;
  orderId: string;
  expectedAmountCents: number;
  actualAmountCents?: number;
  gateway: string;
  clientIp?: string;
  reason: string;
}

// ============================================================================
// CORE VALIDATION
// ============================================================================

/**
 * Valida se o valor do pagamento corresponde ao valor da order no banco
 * 
 * Esta função é CRÍTICA para segurança. Previne:
 * - Manipulação de preço no frontend
 * - Ataques de replay com valores alterados
 * - Fraudes de pagamento com desconto não autorizado
 * 
 * @example
 * const validation = await validateOrderAmount({
 *   supabase,
 *   orderId: 'order-123',
 *   expectedAmountCents: 9900,
 *   gateway: 'asaas',
 *   clientIp: '192.168.1.1',
 * });
 * 
 * if (!validation.valid) {
 *   return createErrorResponse(validation.error, validation.errorCode);
 * }
 */
export async function validateOrderAmount(
  input: ValidateOrderAmountInput
): Promise<ValidationResult> {
  const { supabase, orderId, expectedAmountCents, gateway, clientIp } = input;

  log.info(`Validating order amount: ${orderId} = ${expectedAmountCents} cents (${gateway})`);

  // 1. Buscar order no banco
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, amount_cents, status, vendor_id, product_id, customer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    log.error(`Database error fetching order ${orderId}:`, orderError);
    return {
      valid: false,
      error: "Erro ao validar pedido",
      errorCode: 500,
    };
  }

  if (!order) {
    log.warn(`Order not found: ${orderId}`);
    return {
      valid: false,
      error: "Pedido não encontrado",
      errorCode: 404,
    };
  }

  // 2. Validar status da order (não processar orders já finalizadas)
  if (order.status === "paid" || order.status === "refunded") {
    log.warn(`Order ${orderId} already in final status: ${order.status}`);
    return {
      valid: false,
      order: order as OrderRecord,
      error: `Pedido já está ${order.status === "paid" ? "pago" : "reembolsado"}`,
      errorCode: 409, // Conflict
    };
  }

  // 3. VALIDAÇÃO CRÍTICA: Comparar valores
  if (order.amount_cents !== expectedAmountCents) {
    log.error(`🚨 SECURITY VIOLATION: Price mismatch for order ${orderId}`);
    log.error(`   Expected (frontend): ${expectedAmountCents} cents`);
    log.error(`   Actual (database):   ${order.amount_cents} cents`);
    log.error(`   Gateway: ${gateway}`);
    log.error(`   Client IP: ${clientIp || "unknown"}`);

    // Registrar violação de segurança
    await logSecurityViolation({
      supabase,
      orderId,
      expectedAmountCents,
      actualAmountCents: order.amount_cents,
      gateway,
      clientIp,
      reason: "price_mismatch",
    });

    return {
      valid: false,
      order: order as OrderRecord,
      error: "Valor do pagamento inválido. Possível tentativa de manipulação.",
      errorCode: 400,
    };
  }

  // 4. Validar valor mínimo (segurança adicional)
  if (order.amount_cents < 100) { // Mínimo R$ 1,00
    log.warn(`Order ${orderId} has suspiciously low amount: ${order.amount_cents} cents`);
    
    await logSecurityViolation({
      supabase,
      orderId,
      expectedAmountCents,
      actualAmountCents: order.amount_cents,
      gateway,
      clientIp,
      reason: "amount_too_low",
    });

    return {
      valid: false,
      order: order as OrderRecord,
      error: "Valor mínimo de pagamento é R$ 1,00",
      errorCode: 400,
    };
  }

  log.info(`✅ Order ${orderId} validated: ${order.amount_cents} cents`);

  return {
    valid: true,
    order: order as OrderRecord,
  };
}

/**
 * Valida dados do cliente para pagamento
 */
export interface CustomerValidationInput {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
}

export function validateCustomerData(
  customer: CustomerValidationInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!customer.email || !isValidEmail(customer.email)) {
    errors.push("Email inválido");
  }

  if (!customer.name || customer.name.trim().length < 3) {
    errors.push("Nome deve ter pelo menos 3 caracteres");
  }

  // CPF é opcional, mas se fornecido, deve ser válido
  if (customer.cpf && !isValidCPF(customer.cpf)) {
    errors.push("CPF inválido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

/**
 * Registra violação de segurança para auditoria
 */
export async function logSecurityViolation(
  input: SecurityViolationInput
): Promise<void> {
  const { supabase, orderId, expectedAmountCents, actualAmountCents, gateway, clientIp, reason } = input;

  try {
    // RISE V3: Usar schema correto de security_audit_log
    // Colunas disponíveis: user_id, action, resource, resource_id, success, ip_address, user_agent, metadata
    await supabase.from("security_audit_log").insert({
      user_id: null, // Não temos user_id neste contexto
      action: "payment_validation_failure",
      resource: "orders",
      resource_id: orderId,
      success: false,
      ip_address: clientIp || null,
      metadata: {
        reason,
        expected_amount_cents: expectedAmountCents,
        actual_amount_cents: actualAmountCents,
        gateway,
        timestamp: new Date().toISOString(),
        severity: "high"
      },
    });

    log.warn(`Security violation logged: ${reason} for order ${orderId}`);
  } catch (error) {
    // Não falhar a operação principal por erro de logging
    log.error(`Failed to log security violation:`, error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, "");

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Formata valor em centavos para exibição
 */
export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
