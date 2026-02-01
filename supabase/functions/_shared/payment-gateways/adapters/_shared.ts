/**
 * Payment Gateway Adapters - Shared Test Infrastructure
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este módulo fornece factories type-safe para testes de adaptadores de gateway.
 * ZERO 'as any' ou 'as never' - totalmente tipado.
 * 
 * @module _shared/payment-gateways/adapters/_shared
 * @version 1.0.0
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { PaymentRequest } from "../types.ts";

// ============================================================================
// SUPABASE CLIENT MOCK TYPES
// ============================================================================

/**
 * Tipo do resultado de uma query Supabase
 */
interface MockQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code: string } | null;
}

/**
 * Interface para o builder de query do Supabase
 */
interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder;
  eq: (column: string, value: unknown) => MockQueryBuilder;
  maybeSingle: () => Promise<MockQueryResult>;
  single: () => Promise<MockQueryResult>;
}

/**
 * Interface para o mock mínimo do SupabaseClient usado pelos adapters
 */
interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder;
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<MockQueryResult>;
}

// ============================================================================
// SUPABASE CLIENT FACTORY
// ============================================================================

/**
 * Cria um mock type-safe do SupabaseClient para testes de adapters.
 * 
 * Este mock implementa apenas os métodos utilizados pelos adapters:
 * - from().select().eq().single/maybeSingle()
 * - rpc()
 * 
 * @param overrides - Permite customizar o comportamento do mock
 * @returns Mock type-safe compatível com SupabaseClient
 */
export function createMockSupabaseClient(overrides?: {
  queryResult?: MockQueryResult;
  rpcResult?: MockQueryResult;
}): SupabaseClient {
  const defaultQueryResult: MockQueryResult = { data: null, error: null };
  const defaultRpcResult: MockQueryResult = { data: null, error: null };

  const queryResult = overrides?.queryResult ?? defaultQueryResult;
  const rpcResult = overrides?.rpcResult ?? defaultRpcResult;

  const queryBuilder: MockQueryBuilder = {
    select: () => queryBuilder,
    eq: () => queryBuilder,
    maybeSingle: () => Promise.resolve(queryResult),
    single: () => Promise.resolve(queryResult),
  };

  const client: MockSupabaseClient = {
    from: () => queryBuilder,
    rpc: () => Promise.resolve(rpcResult),
  };

  // O cast é seguro porque MockSupabaseClient implementa o subset
  // de métodos que os adapters realmente utilizam
  return client as unknown as SupabaseClient;
}

// ============================================================================
// PAYMENT REQUEST FACTORY
// ============================================================================

/**
 * Cria um PaymentRequest válido para testes.
 * 
 * @param overrides - Campos para sobrescrever valores padrão
 * @returns PaymentRequest completo e válido
 */
export function createMockPaymentRequest(
  overrides?: Partial<PaymentRequest>
): PaymentRequest {
  const defaultCustomer = {
    name: "Test Customer",
    email: "test@example.com",
    document: "12345678900",
  };

  const customer = overrides?.customer
    ? {
        name: overrides.customer.name ?? defaultCustomer.name,
        email: overrides.customer.email ?? defaultCustomer.email,
        document: overrides.customer.document ?? defaultCustomer.document,
        phone: overrides.customer.phone,
      }
    : defaultCustomer;

  return {
    amount_cents: overrides?.amount_cents ?? 10000,
    order_id: overrides?.order_id ?? "test_order_123",
    description: overrides?.description ?? "Test payment",
    customer,
    card_token: overrides?.card_token,
    installments: overrides?.installments,
    split_rules: overrides?.split_rules,
  };
}

/**
 * Cria um PaymentRequest mínimo válido (sem campos opcionais).
 */
export function createMinimalPaymentRequest(): PaymentRequest {
  return {
    amount_cents: 100, // R$ 1,00
    order_id: "min_order_1",
    customer: {
      name: "A",
      email: "a@b.c",
      document: "12345678900",
    },
    description: "Minimal",
  };
}

/**
 * Cria um PaymentRequest completo com todos os campos opcionais.
 */
export function createFullPaymentRequest(): PaymentRequest {
  return {
    amount_cents: 50000, // R$ 500,00
    order_id: "full_order_123",
    customer: {
      name: "Full Customer Name",
      email: "full@example.com",
      document: "12345678901234", // CNPJ
      phone: "+5511999999999",
    },
    description: "Full test payment with all fields",
    card_token: "tok_abc123xyz",
    installments: 12,
    split_rules: [
      {
        recipient_id: "wallet-platform",
        amount_cents: 5000,
        role: "platform",
      },
      {
        recipient_id: "wallet-affiliate",
        amount_cents: 3000,
        role: "affiliate",
      },
    ],
  };
}

/**
 * Cria um PaymentRequest para cartão de crédito.
 */
export function createCreditCardPaymentRequest(
  overrides?: Partial<PaymentRequest>
): PaymentRequest {
  return createMockPaymentRequest({
    card_token: "tok_test123",
    installments: 1,
    ...overrides,
  });
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Verifica se um adapter implementa a interface IPaymentGateway.
 * Retorna true se todos os métodos existem e são funções.
 */
export function hasPaymentGatewayInterface(adapter: unknown): boolean {
  if (!adapter || typeof adapter !== 'object') return false;
  
  const obj = adapter as Record<string, unknown>;
  
  return (
    typeof obj.providerName === 'string' &&
    typeof obj.createPix === 'function' &&
    typeof obj.createCreditCard === 'function' &&
    typeof obj.validateCredentials === 'function'
  );
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { PaymentRequest } from "../types.ts";
