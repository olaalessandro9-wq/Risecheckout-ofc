/**
 * Helpers Index - Re-exporta todos os helpers
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - XState State Machine Edition
 */

// Data mappers
export {
  mapProductRecord,
  mapUpsellSettings,
  mapAffiliateSettings,
  mapOfferRecords,
  mapOrderBumpRecords,
  mapCheckoutRecords,
  mapPaymentLinkRecords,
  mapCouponRecords,
} from "./productDataMapper";

// Pure save functions (for useGlobalValidationHandlers)
export {
  uploadProductImage,
  saveDeletedOffers,
  saveOffers,
  saveGeneralProduct,
} from "./saveFunctions";

// Validation handler configs
export {
  createGeneralValidation,
  createCheckoutSettingsValidation,
  createUpsellValidation,
  createAffiliateValidation,
} from "./validationHandlerConfigs";
