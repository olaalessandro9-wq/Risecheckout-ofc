/**
 * Affiliate Core Types
 * 
 * Fundamental types for affiliate domain.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate/core
 */

// ============================================
// STATUS TYPES
// ============================================

/**
 * Possible affiliation statuses
 */
export type AffiliationStatus = 
  | "pending" 
  | "active" 
  | "rejected" 
  | "blocked" 
  | "cancelled";

// ============================================
// GATEWAY TYPES
// ============================================

/**
 * Supported payment gateway types for PIX
 */
export type PixGatewayType = 
  | "asaas" 
  | "mercadopago" 
  | "pushinpay"
  | null;

/**
 * Supported payment gateway types for Credit Card
 */
export type CreditCardGatewayType = 
  | "mercadopago" 
  | "stripe"
  | null;
