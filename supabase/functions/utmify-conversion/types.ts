/**
 * UTMify Conversion Types
 * 
 * @module utmify-conversion/types
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Tipos conforme documentação oficial da API UTMify:
 * https://api.utmify.com.br/api-credentials/orders
 */

// ============================================================================
// API CONSTANTS
// ============================================================================

export const UTMIFY_API_URL = "https://api.utmify.com.br/api-credentials/orders";
export const PLATFORM_NAME = "RiseCheckout";

// ============================================================================
// PAYMENT METHOD MAPPING
// ============================================================================

export const PaymentMethodMap = {
  pix: "pix",
  credit_card: "credit_card",
  boleto: "boleto",
  debit_card: "debit_card",
  two_credit_cards: "two_credit_cards",
} as const;

export type PaymentMethod = keyof typeof PaymentMethodMap;

// ============================================================================
// STATUS MAPPING
// ============================================================================

export const OrderStatusMap = {
  paid: "paid",
  pending: "waiting_payment",
  expired: "expired",
  refused: "refused",
  refunded: "refunded",
  chargeback: "chargedback",
  canceled: "canceled",
} as const;

export type OrderStatus = keyof typeof OrderStatusMap;

// ============================================================================
// REQUEST TYPES (Input from Frontend)
// ============================================================================

/**
 * Dados do cliente recebidos do frontend
 */
export interface CustomerInput {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  country?: string;
  ip?: string | null;
}

/**
 * Dados do produto recebidos do frontend
 */
export interface ProductInput {
  id: string;
  name: string;
  planId?: string | null;
  planName?: string | null;
  quantity?: number;
  priceInCents: number;
}

/**
 * Parâmetros de tracking recebidos do frontend
 */
export interface TrackingParametersInput {
  src?: string | null;
  sck?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

/**
 * Dados de comissão recebidos do frontend
 */
export interface CommissionInput {
  totalPriceInCents: number;
  gatewayFeeInCents?: number;
  userCommissionInCents?: number;
  currency?: string;
}

/**
 * Payload completo recebido do frontend
 */
export interface UTMifyConversionRequest {
  orderId: string;
  vendorId: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: CustomerInput;
  products: ProductInput[];
  trackingParameters?: TrackingParametersInput;
  commission: CommissionInput;
  isTest?: boolean;
}

// ============================================================================
// API PAYLOAD TYPES (Output to UTMify API)
// ============================================================================

/**
 * Customer object conforme documentação UTMify
 */
export interface UTMifyCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  country: string;
  ip: string | null;
}

/**
 * Product object conforme documentação UTMify
 */
export interface UTMifyProduct {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
}

/**
 * TrackingParameters object conforme documentação UTMify
 */
export interface UTMifyTrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/**
 * Commission object conforme documentação UTMify
 */
export interface UTMifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency: string;
}

/**
 * Payload completo conforme documentação UTMify API
 */
export interface UTMifyAPIPayload {
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UTMifyCustomer;
  products: UTMifyProduct[];
  trackingParameters: UTMifyTrackingParameters;
  commission: UTMifyCommission;
  isTest: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface UTMifyAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface EdgeFunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: unknown;
}
