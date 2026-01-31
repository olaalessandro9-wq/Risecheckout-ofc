/**
 * Vendor Integrations Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module vendor-integrations/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export type VendorAction = "get-config" | "get-all";
export type IntegrationType = 
  | "MERCADOPAGO" 
  | "PUSHINPAY" 
  | "STRIPE" 
  | "ASAAS" 
  | "TIKTOK_PIXEL" 
  | "FACEBOOK_PIXEL" 
  | "GOOGLE_ADS" 
  | "UTMIFY" 
  | "KWAI_PIXEL";

export interface VendorRequest {
  action: VendorAction;
  vendorId: string;
  integrationType?: IntegrationType;
}

export interface VendorResponse {
  success?: boolean;
  error?: string;
  data?: unknown;
}

export interface IntegrationConfig {
  public_key?: string;
  access_token?: string;
  sandbox_mode?: boolean;
  publishable_key?: string;
  secret_key?: string;
  api_key?: string;
  environment?: string;
  pushinpay_token?: string;
  pixel_id?: string;
  selected_products?: string[];
  conversion_id?: string;
  conversion_label?: string;
  api_token?: string;
  selected_events?: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-001";

export const MOCK_MP_INTEGRATION = {
  id: "int-mp-001",
  vendor_id: MOCK_VENDOR_ID,
  integration_type: "MERCADOPAGO",
  active: true,
  config: {
    public_key: "TEST-public-key",
    access_token: "TEST-secret-token",
    sandbox_mode: true
  }
};

export const MOCK_STRIPE_INTEGRATION = {
  id: "int-stripe-001",
  vendor_id: MOCK_VENDOR_ID,
  integration_type: "STRIPE",
  active: true,
  config: {
    publishable_key: "pk_test_123",
    secret_key: "sk_test_456"
  }
};

export const MOCK_ASAAS_INTEGRATION = {
  id: "int-asaas-001",
  vendor_id: MOCK_VENDOR_ID,
  integration_type: "ASAAS",
  active: true,
  config: {
    api_key: "$aact_test_123",
    sandbox_mode: true,
    environment: "sandbox"
  }
};

export const MOCK_PUSHINPAY_INTEGRATION = {
  id: "int-pp-001",
  vendor_id: MOCK_VENDOR_ID,
  integration_type: "PUSHINPAY",
  active: true,
  config: {
    pushinpay_token: "token-secret-123"
  }
};

export const MOCK_PIXEL_INTEGRATIONS = {
  tiktok: {
    id: "int-tt-001",
    vendor_id: MOCK_VENDOR_ID,
    integration_type: "TIKTOK_PIXEL",
    active: true,
    config: {
      pixel_id: "tt-pixel-123",
      selected_products: ["prod-001", "prod-002"]
    }
  },
  facebook: {
    id: "int-fb-001",
    vendor_id: MOCK_VENDOR_ID,
    integration_type: "FACEBOOK_PIXEL",
    active: true,
    config: {
      pixel_id: "fb-pixel-456",
      selected_products: ["prod-001"]
    }
  },
  google: {
    id: "int-ga-001",
    vendor_id: MOCK_VENDOR_ID,
    integration_type: "GOOGLE_ADS",
    active: true,
    config: {
      conversion_id: "AW-123456",
      conversion_label: "purchase",
      selected_products: ["prod-001"]
    }
  },
  utmify: {
    id: "int-utm-001",
    vendor_id: MOCK_VENDOR_ID,
    integration_type: "UTMIFY",
    active: true,
    config: {
      api_token: "secret-api-token",
      selected_products: ["prod-001"]
    }
  },
  kwai: {
    id: "int-kwai-001",
    vendor_id: MOCK_VENDOR_ID,
    integration_type: "KWAI_PIXEL",
    active: true,
    config: {
      pixel_id: "kwai-pixel-789",
      selected_products: ["prod-001"],
      selected_events: ["purchase", "add_to_cart"]
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates vendor request
 */
export function validateVendorRequest(request: Partial<VendorRequest>): string | null {
  if (!request.vendorId) return "vendorId required";
  
  if (request.action === "get-config" && !request.integrationType) {
    return "integrationType required";
  }
  
  return null;
}

/**
 * Sanitizes config based on integration type (removes sensitive data)
 */
export function sanitizeConfig(config: IntegrationConfig | null, integrationType: string): Record<string, unknown> {
  if (!config) return {};
  
  switch (integrationType) {
    case "MERCADOPAGO":
      return {
        public_key: config.public_key,
        sandbox_mode: config.sandbox_mode
      };
    case "STRIPE":
      return {
        publishable_key: config.publishable_key
      };
    case "PUSHINPAY":
      return {
        has_token: !!config.pushinpay_token
      };
    case "ASAAS":
      return {
        sandbox_mode: config.sandbox_mode,
        environment: config.environment,
        has_api_key: !!config.api_key
      };
    case "TIKTOK_PIXEL":
      return {
        pixel_id: config.pixel_id,
        selected_products: config.selected_products
      };
    case "FACEBOOK_PIXEL":
      return {
        pixel_id: config.pixel_id,
        selected_products: config.selected_products
      };
    case "GOOGLE_ADS":
      return {
        conversion_id: config.conversion_id,
        conversion_label: config.conversion_label,
        selected_products: config.selected_products
      };
    case "UTMIFY":
      return {
        api_token: config.api_token ? "configured" : null,
        selected_products: config.selected_products
      };
    case "KWAI_PIXEL":
      return {
        pixel_id: config.pixel_id,
        selected_products: config.selected_products,
        selected_events: config.selected_events
      };
    default:
      return {};
  }
}
