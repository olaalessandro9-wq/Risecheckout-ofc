/**
 * Shared Kernel Index
 * 
 * Re-exports all kernel modules for convenient importing.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Vertical Slice Architecture
 * @module kernel
 */

// Security
export {
  generateSecureAffiliateCode,
  generateSecureToken,
  generateSecureId,
  generateUrlSafeToken,
} from "./security/crypto-utils.ts";

export {
  maskEmail,
  maskId,
  maskCpf,
  maskCnpj,
  maskPhone,
  maskName,
  maskCardNumber,
} from "./security/pii-masking.ts";

// Types - Re-export from modular affiliate types
export type {
  // Core types
  AffiliationStatus,
  PixGatewayType,
  CreditCardGatewayType,
  
  // Settings
  AffiliateSettings,
  AffiliateGatewaySettings,
  
  // Records
  AffiliationRecord,
  AffiliationStatusRecord,
  AffiliationSummary,
  
  // Credentials
  GatewayCredentials,
  AsaasCredentials,
  MercadoPagoCredentials,
  StripeCredentials,
  PushinPayCredentials,
  
  // Pixels
  AffiliatePixelRecord,
  PixelPlatform,
  
  // Product
  AffiliationProductRecord,
  ProductOwnerRecord,
  
  // Offers
  OfferWithPaymentLink,
  PaymentLinkRecord,
  
  // Checkouts
  CheckoutWithPaymentLink,
  
  // Producer
  ProducerProfile,
  
  // Marketplace
  MarketplaceProductSummary,
  
  // Actions
  AffiliationManageAction,
  AffiliateSettingsAction,
  
  // Request/Response
  AffiliationRequestInput,
  AffiliationRequestOutput,
  AffiliationManageInput,
  AffiliationDetailsOutput,
  
  // Audit
  AffiliateAuditLogEntry,
} from "./types/affiliate/index.ts";
