/**
 * Email Templates - Re-exports
 * 
 * Arquivo de agregação que re-exporta todos os templates.
 * Mantém retrocompatibilidade com imports existentes.
 * 
 * RISE Protocol Compliant - < 60 linhas
 */

// Base types and utilities
export type {
  PurchaseConfirmationData,
  PaymentPendingData,
  NewSaleData,
} from "./email-templates-base.ts";

export {
  formatCurrency,
  getBaseStyles,
  getEmailWrapper,
} from "./email-templates-base.ts";

// Purchase confirmation templates (Standard delivery)
export {
  getPurchaseConfirmationTemplate,
  getPurchaseConfirmationTextTemplate,
} from "./email-templates-purchase.ts";

// Members Area delivery templates
export {
  getMembersAreaConfirmationTemplate,
  getMembersAreaConfirmationTextTemplate,
} from "./email-templates-members-area.ts";

// External delivery templates (no access button)
export {
  getExternalDeliveryConfirmationTemplate,
  getExternalDeliveryConfirmationTextTemplate,
} from "./email-templates-external.ts";

// Payment pending templates
export {
  getPaymentPendingTemplate,
  getPaymentPendingTextTemplate,
} from "./email-templates-payment.ts";

// Seller notification templates
export {
  getNewSaleTemplate,
  getNewSaleTextTemplate,
} from "./email-templates-seller.ts";
