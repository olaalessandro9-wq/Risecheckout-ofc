/**
 * UTMify Module Types
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Centralized Types
 */

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export interface UTMifyEvent {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly status?: string;
}

export interface UTMifyConfig {
  readonly active: boolean;
  readonly hasToken: boolean;
  readonly selectedProducts: string[];
  readonly selectedEvents: string[];
}

// ============================================================================
// FORM DATA
// ============================================================================

export interface UTMifyFormData {
  token: string;
  active: boolean;
  selectedProducts: string[];
  selectedEvents: string[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ProductsListResponse {
  products: Product[];
}

export interface VendorIntegrationResponse {
  integration?: {
    active: boolean;
    config: {
      selected_products?: string[];
      selected_events?: string[];
      has_token?: boolean;
    } | null;
  };
}

export interface VaultSaveResponse {
  success: boolean;
  error?: string;
}
