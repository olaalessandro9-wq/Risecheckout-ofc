/**
 * Re-exportação dos hooks do ProductContext
 * 
 * MIGRADO para XState State Machine
 * 
 * @see RISE Protocol V3 - State Machine Edition
 */

// === DELETE OPERATION ===
// Single Responsibility: Apenas deleção de produto
export { useProductDelete } from "./useProductDelete";

// === ADAPTERS ===
// Adapter puro (zero useState) - bridge para State Machine
export { useProductSettings, useProductSettingsAdapter } from "./useProductSettingsAdapter";

// === VALIDATION ===
// Global Validation Handlers - TODOS os handlers de validação centralizados
export { useGlobalValidationHandlers } from "./useGlobalValidationHandlers";

// Tab Validation - Sistema de validação global
export { useTabValidation } from "./useTabValidation";

// === DATA LOADING ===
// BFF Product Loader - React Query Edition (usado pelos Actors da State Machine)
export { useProductLoader, productQueryKeys } from "./useProductLoader";
export { useProductDataMapper } from "./useProductDataMapper";

// === TYPE EXPORTS ===
export type { 
  ProductFullData, 
  ProductRecord, 
  OfferRecord, 
  OrderBumpRecord, 
  CheckoutRecord, 
  PaymentLinkRecord, 
  CouponRecord,
  UseProductLoaderOptions,
  UseProductLoaderReturn,
} from "./useProductLoader";
