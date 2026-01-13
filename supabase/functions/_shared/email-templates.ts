/**
 * Email Templates - Re-exports
 * 
 * Arquivo de agregação que re-exporta todos os templates.
 * Mantém retrocompatibilidade com imports existentes.
 * 
 * RISE Protocol Compliant - < 50 linhas
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

// Purchase confirmation templates
export {
  getPurchaseConfirmationTemplate,
  getPurchaseConfirmationTextTemplate,
} from "./email-templates-purchase.ts";

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
