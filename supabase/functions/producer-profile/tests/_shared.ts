/**
 * Shared Types & Mock Data for producer-profile Tests
 * 
 * @module producer-profile/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProfileAction = "get-profile" | "check-credentials" | "get-gateway-connections";

export interface ProfileRequest {
  action: ProfileAction;
  productId?: string;
}

export interface ProfileResponse {
  profile?: {
    name: string | null;
    cpf_cnpj: string | null;
    phone: string | null;
  };
  credentials?: {
    mercadopago: { configured: boolean };
    pushinpay: { configured: boolean };
    stripe: { configured: boolean };
    asaas: { configured: boolean };
  };
  productSettings?: unknown;
  connections?: {
    asaas: boolean;
    mercadopago: boolean;
    stripe: boolean;
    pushinpay: boolean;
  };
  error?: string;
  code?: string;
}

export interface MockProducer {
  id: string;
  email: string;
  name: string | null;
  cpf_cnpj: string | null;
  phone: string | null;
  asaas_wallet_id: string | null;
  mercadopago_collector_id: string | null;
  stripe_account_id: string | null;
}

export interface MockProduct {
  id: string;
  user_id: string;
  affiliate_gateway_settings: unknown;
}

export interface PushinpaySettings {
  pushinpay_account_id: string | null;
  pushinpay_token: string | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_PRODUCER: MockProducer = {
  id: "producer-001",
  email: "producer@example.com",
  name: "Producer Name",
  cpf_cnpj: "12345678901",
  phone: "11999999999",
  asaas_wallet_id: "wlt_123",
  mercadopago_collector_id: "mp_456",
  stripe_account_id: null
};

export const MOCK_PRODUCER_PARTIAL: MockProducer = {
  id: "producer-002",
  email: "partial@example.com",
  name: null,
  cpf_cnpj: null,
  phone: null,
  asaas_wallet_id: null,
  mercadopago_collector_id: null,
  stripe_account_id: null
};

export const MOCK_PRODUCT: MockProduct = {
  id: "product-001",
  user_id: "producer-001",
  affiliate_gateway_settings: {
    pix: { allowed: true },
    credit_card: { allowed: true }
  }
};

export const MOCK_PUSHINPAY: PushinpaySettings = {
  pushinpay_account_id: "pp_acc_123",
  pushinpay_token: "pp_token_456"
};

export const VALID_ACTIONS: ProfileAction[] = ["get-profile", "check-credentials", "get-gateway-connections"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateProfileRequest(request: Partial<ProfileRequest>): string | null {
  if (!request.action || !VALID_ACTIONS.includes(request.action)) {
    return `Ação desconhecida: ${request.action}`;
  }
  
  if (request.action === "get-gateway-connections" && !request.productId) {
    return "productId é obrigatório";
  }
  
  return null;
}

export function checkCredentialsConfigured(integrations: {
  mercadopago: boolean;
  pushinpay: boolean;
  stripe: boolean;
  asaas: boolean;
}): ProfileResponse["credentials"] {
  return {
    mercadopago: { configured: integrations.mercadopago },
    pushinpay: { configured: integrations.pushinpay },
    stripe: { configured: integrations.stripe },
    asaas: { configured: integrations.asaas }
  };
}

export function checkGatewayConnections(
  user: MockProducer, 
  pushinpay: PushinpaySettings | null
): ProfileResponse["connections"] {
  return {
    asaas: !!user.asaas_wallet_id,
    mercadopago: !!user.mercadopago_collector_id,
    stripe: !!user.stripe_account_id,
    pushinpay: !!(pushinpay?.pushinpay_token && pushinpay?.pushinpay_account_id)
  };
}
