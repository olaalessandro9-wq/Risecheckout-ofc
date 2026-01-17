/**
 * Context Helpers Index
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

export {
  createUpdateGeneralField,
  createUpdateImageState,
  createUpdateLocalOffers,
  createMarkOfferDeleted,
  createSetOffersModified,
  createUpdateCheckoutSettingsField,
  createInitCheckoutSettings,
} from "./formHelpers";

export {
  createSaveProduct,
  createSaveUpsellSettings,
  createSaveAffiliateSettings,
} from "./saveWrappers";

// Factory saveAll extraída para manter ProductContext < 300 linhas
export { createSaveAll } from "./createSaveAll";

export {
  createUpdateProduct,
  createUpdateProductBulk,
  createUpdateUpsellSettings,
  createUpdateAffiliateSettings,
} from "./updateWrappers";
