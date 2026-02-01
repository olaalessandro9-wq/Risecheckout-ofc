/**
 * Affiliate Types Index
 * 
 * Re-exports all affiliate-related types.
 * 
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - Modularization
 * @module kernel/types/affiliate
 */

// Core types
export type {
  AffiliationStatus,
  PixGatewayType,
  CreditCardGatewayType,
} from "./core.ts";

// Settings
export type {
  AffiliateSettings,
  AffiliateGatewaySettings,
} from "./settings.ts";

// Credentials
export type {
  GatewayCredentials,
  PayoutIdentifiers,
  AsaasPayoutId,
  MercadoPagoPayoutId,
  StripePayoutId,
  PushinPayPayoutId,
} from "./credentials.ts";

// Records
export type {
  AffiliationRecord,
  AffiliationStatusRecord,
  AffiliationSummary,
} from "./records.ts";

// Pixels
export type {
  PixelPlatform,
  AffiliatePixelRecord,
} from "./pixels.ts";

// Product, Offer, Checkout, Producer
export type {
  AffiliationProductRecord,
  ProductOwnerRecord,
  OfferWithPaymentLink,
  PaymentLinkRecord,
  CheckoutWithPaymentLink,
  ProducerProfile,
  MarketplaceProductSummary,
} from "./product.ts";

// Actions and Request/Response
export type {
  AffiliationManageAction,
  AffiliateSettingsAction,
  AffiliationRequestInput,
  AffiliationRequestOutput,
  AffiliationManageInput,
  AffiliationDetailsOutput,
  AffiliateAuditLogEntry,
} from "./actions.ts";
