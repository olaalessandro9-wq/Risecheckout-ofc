/**
 * Email Templates - Re-exports
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Arquivo de agregação que re-exporta todos os templates.
 * 
 * IMPORTANT: getBaseStyles() and getEmailWrapper() are NOT exported.
 * These functions are deprecated. All templates must use inline <style> blocks.
 * 
 * @version 2.0.0
 */

// Base types and utilities
export type {
  PurchaseConfirmationData,
  PaymentPendingData,
  NewSaleData,
} from "./email-templates-base.ts";

export {
  formatCurrency,
  getLogoUrl,
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
