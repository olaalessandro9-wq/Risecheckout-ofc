/**
 * ============================================================================
 * UTMify Types - Unified Type Definitions
 * ============================================================================
 * 
 * @module _shared/utmify/types
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centraliza TODAS as interfaces e tipos para integração UTMify.
 * ============================================================================
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Eventos suportados pelo UTMify
 */
export type UTMifyEventType = 
  | "pix_generated"
  | "purchase_approved" 
  | "purchase_refused"
  | "refund"
  | "chargeback";

// ============================================================================
// ORDER DATA TYPES
// ============================================================================

/**
 * Dados do cliente para envio ao UTMify
 */
export interface UTMifyCustomer {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string;
  ip?: string | null;
}

/**
 * Dados de um produto para envio ao UTMify
 */
export interface UTMifyProduct {
  id: string;
  name: string;
  priceInCents: number;
  quantity?: number;
}

/**
 * Parâmetros de rastreamento (UTM + src/sck)
 */
export interface UTMifyTrackingParameters {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

/**
 * Dados do pedido para envio ao UTMify
 */
export interface UTMifyOrderData {
  orderId: string;
  vendorId: string;
  paymentMethod: string;
  createdAt: string;
  customer: UTMifyCustomer;
  products: UTMifyProduct[];
  trackingParameters?: UTMifyTrackingParameters;
  totalPriceInCents: number;
  approvedDate?: string | null;
  refundedAt?: string | null;
}

// ============================================================================
// DISPATCH RESULT TYPES
// ============================================================================

/**
 * Resultado do disparo de evento UTMify
 */
export interface UTMifyDispatchResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  fingerprint?: string;
}

// ============================================================================
// TOKEN NORMALIZATION TYPES
// ============================================================================

/**
 * Resultado da normalização de token
 */
export interface TokenNormalizationResult {
  normalized: string;
  originalLength: number;
  normalizedLength: number;
  changes: string[];
}

/**
 * Resultado da recuperação de token do Vault
 */
export interface TokenRetrievalResult {
  token: string | null;
  fingerprint: string | null;
  normalizationApplied: boolean;
  changes: string[];
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Interface para ordem do banco de dados
 */
export interface DatabaseOrder {
  id: string;
  vendor_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document: string | null;
  customer_ip: string | null;
  amount_cents: number;
  payment_method: string | null;
  created_at: string;
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  order_items?: Array<{
    product_id: string;
    product_name: string;
    amount_cents: number;
    quantity: number | null;
  }>;
}
