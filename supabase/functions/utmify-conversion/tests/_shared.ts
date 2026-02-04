/**
 * Shared Test Utilities for utmify-conversion
 * 
 * @module utmify-conversion/tests/_shared
 * @version 3.0.0 - RISE Protocol V3 Compliant - Vault SSOT
 * 
 * Atualizado para refletir a arquitetura real:
 * - Tokens recuperados do Vault via RPC get_gateway_credentials
 * - Zero referências a coluna legada users.utmify_token (REMOVIDA)
 */

// ============================================
// CONSTANTS - CORRECTED PER DOCUMENTATION
// ============================================

export const FUNCTION_URL = "https://test.supabase.co/functions/v1/utmify-conversion";

/** URL correta conforme documentação oficial */
export const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";

/** Nome da plataforma enviado para UTMify */
export const PLATFORM_NAME = "RiseCheckout";

// ============================================
// TYPES
// ============================================

export interface MockOrder {
  id: string;
  product_id: string;
  product_name: string;
  total_amount: number;
  amount_cents: number;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface MockCustomer {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string;
  ip?: string | null;
}

export interface MockProduct {
  id: string;
  name: string;
  planId?: string | null;
  planName?: string | null;
  quantity?: number;
  priceInCents: number;
}

export interface MockTrackingParameters {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface MockCommission {
  totalPriceInCents: number;
  gatewayFeeInCents?: number;
  userCommissionInCents?: number;
  currency?: string;
}

export interface ConversionPayload {
  orderId: string;
  vendorId: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: MockCustomer;
  products: MockProduct[];
  trackingParameters?: MockTrackingParameters;
  commission: MockCommission;
  isTest?: boolean;
}

/**
 * Frontend payload structure (with nested orderData)
 * This is what the frontend actually sends via events.ts
 */
export interface FrontendPayload {
  vendorId: string;
  orderData: {
    orderId: string;
    paymentMethod?: string;
    status: string;
    createdAt: string;
    approvedDate?: string | null;
    refundedAt?: string | null;
    customer: MockCustomer;
    products: MockProduct[];
    trackingParameters?: MockTrackingParameters;
    commission?: MockCommission;
    totalPriceInCents: number;
    isTest?: boolean;
  };
  eventType?: string;
  productId?: string;
}

// ============================================
// VAULT CREDENTIALS TYPES (RISE V3 - SSOT)
// ============================================

/**
 * Credenciais retornadas do Vault via RPC get_gateway_credentials
 * Estrutura: { success: true, credentials: { api_token: "..." } }
 */
export interface MockVaultCredentials {
  api_token: string | null;
}

/**
 * Resposta completa do RPC get_gateway_credentials
 */
export interface MockVaultResponse {
  success: boolean;
  credentials?: MockVaultCredentials;
  error?: string;
}

/**
 * Cria uma resposta mock do Vault RPC
 * @param hasToken - Se true, retorna token válido; se false, retorna erro
 */
export function createMockVaultResponse(hasToken: boolean = true): MockVaultResponse {
  if (hasToken) {
    return {
      success: true,
      credentials: { api_token: "vault-token-123" },
    };
  }
  return {
    success: false,
    error: "Credentials not found for gateway: utmify",
  };
}

/**
 * Parâmetros esperados para chamada ao RPC get_gateway_credentials
 */
export interface VaultRPCParams {
  p_vendor_id: string;
  p_gateway: string;
}

/**
 * Cria parâmetros mock para chamada ao Vault RPC
 */
export function createMockVaultRPCParams(vendorId: string = "vendor-123"): VaultRPCParams {
  return {
    p_vendor_id: vendorId,
    p_gateway: "utmify",
  };
}

// ============================================
// MOCK FACTORIES
// ============================================

export function createMockSupabaseClient(vaultResponse?: MockVaultResponse) {
  const defaultVaultResponse = vaultResponse ?? createMockVaultResponse(true);
  
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    rpc: (functionName: string, params: unknown) => {
      if (functionName === "get_gateway_credentials") {
        return Promise.resolve({ data: defaultVaultResponse, error: null });
      }
      return Promise.resolve({ data: null, error: { message: `Unknown RPC: ${functionName}` } });
    },
  };
}

export function createMockRequest(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer valid-api-key",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createMockRequestWithoutAuth(body: Record<string, unknown>): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export function createOptionsRequest(): Request {
  return new Request(FUNCTION_URL, {
    method: "OPTIONS",
    headers: new Headers(),
  });
}

export function createInvalidJsonRequest(): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Bearer valid-api-key",
  });

  return new Request(FUNCTION_URL, {
    method: "POST",
    headers,
    body: "invalid-json",
  });
}

// ============================================
// DEFAULT MOCK DATA
// ============================================

export function createDefaultOrder(): MockOrder {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    product_id: "product-123",
    product_name: "Test Product",
    total_amount: 99.90,
    amount_cents: 9990,
    status: "paid",
    customer_email: "customer@example.com",
    customer_name: "Test Customer",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
}

export function createOrderWithUtm(): MockOrder {
  return {
    id: "550e8400-e29b-41d4-a716-446655440001",
    product_id: "product-123",
    product_name: "Test Product with UTM",
    total_amount: 149.90,
    amount_cents: 14990,
    status: "paid",
    customer_email: "customer@example.com",
    customer_name: "Test Customer",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "summer_sale",
    utm_content: "banner_1",
    utm_term: "test keyword",
  };
}

export function createDefaultConversionPayload(): ConversionPayload {
  const order = createDefaultOrder();
  return {
    orderId: order.id,
    vendorId: "vendor-123",
    paymentMethod: "pix",
    status: "paid",
    createdAt: new Date().toISOString(),
    approvedDate: new Date().toISOString(),
    refundedAt: null,
    customer: {
      name: order.customer_name || "Test Customer",
      email: order.customer_email || "test@example.com",
      phone: null,
      document: null,
      country: "BR",
      ip: null,
    },
    products: [{
      id: order.product_id,
      name: order.product_name,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: order.amount_cents,
    }],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: order.utm_source,
      utm_campaign: order.utm_campaign,
      utm_medium: order.utm_medium,
      utm_content: order.utm_content,
      utm_term: order.utm_term,
    },
    commission: {
      totalPriceInCents: order.amount_cents,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount_cents,
      currency: "BRL",
    },
    isTest: false,
  };
}

export function createConversionPayloadWithUtm(): ConversionPayload {
  const order = createOrderWithUtm();
  return {
    orderId: order.id,
    vendorId: "vendor-123",
    paymentMethod: "credit_card",
    status: "paid",
    createdAt: new Date().toISOString(),
    approvedDate: new Date().toISOString(),
    refundedAt: null,
    customer: {
      name: order.customer_name || "Test Customer",
      email: order.customer_email || "test@example.com",
      phone: "11999999999",
      document: "12345678900",
      country: "BR",
      ip: "192.168.1.1",
    },
    products: [{
      id: order.product_id,
      name: order.product_name,
      planId: null,
      planName: null,
      quantity: 1,
      priceInCents: order.amount_cents,
    }],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: order.utm_source,
      utm_campaign: order.utm_campaign,
      utm_medium: order.utm_medium,
      utm_content: order.utm_content,
      utm_term: order.utm_term,
    },
    commission: {
      totalPriceInCents: order.amount_cents,
      gatewayFeeInCents: 300,
      userCommissionInCents: order.amount_cents - 300,
      currency: "BRL",
    },
    isTest: false,
  };
}

// ============================================
// FRONTEND PAYLOAD FACTORIES (Nested Structure)
// ============================================

/**
 * Creates a mock frontend payload with nested orderData (default, no UTM)
 */
export function createNestedFrontendPayload(): FrontendPayload {
  const order = createDefaultOrder();
  return {
    vendorId: "vendor-123",
    orderData: {
      orderId: order.id,
      paymentMethod: "pix",
      status: "paid",
      createdAt: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      refundedAt: null,
      customer: {
        name: order.customer_name || "Test Customer",
        email: order.customer_email || "test@example.com",
        phone: null,
        document: null,
        country: "BR",
        ip: null,
      },
      products: [{
        id: order.product_id,
        name: order.product_name,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: order.amount_cents,
      }],
      trackingParameters: {
        src: null,
        sck: null,
        utm_source: null,
        utm_campaign: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
      },
      commission: {
        totalPriceInCents: order.amount_cents,
        gatewayFeeInCents: 0,
        userCommissionInCents: order.amount_cents,
        currency: "BRL",
      },
      totalPriceInCents: order.amount_cents,
      isTest: false,
    },
    eventType: "purchase",
    productId: order.product_id,
  };
}

/**
 * Creates a mock frontend payload with nested orderData (with UTM params)
 */
export function createNestedFrontendPayloadWithUtm(): FrontendPayload {
  const order = createOrderWithUtm();
  return {
    vendorId: "vendor-123",
    orderData: {
      orderId: order.id,
      paymentMethod: "credit_card",
      status: "paid",
      createdAt: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      refundedAt: null,
      customer: {
        name: order.customer_name || "Test Customer",
        email: order.customer_email || "test@example.com",
        phone: "11999999999",
        document: "12345678900",
        country: "BR",
        ip: "192.168.1.1",
      },
      products: [{
        id: order.product_id,
        name: order.product_name,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: order.amount_cents,
      }],
      trackingParameters: {
        src: null,
        sck: null,
        utm_source: order.utm_source,
        utm_campaign: order.utm_campaign,
        utm_medium: order.utm_medium,
        utm_content: order.utm_content,
        utm_term: order.utm_term,
      },
      commission: {
        totalPriceInCents: order.amount_cents,
        gatewayFeeInCents: 300,
        userCommissionInCents: order.amount_cents - 300,
        currency: "BRL",
      },
      totalPriceInCents: order.amount_cents,
      isTest: false,
    },
    eventType: "purchase",
    productId: order.product_id,
  };
}
