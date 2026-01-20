/**
 * Re-exportação dos hooks especializados do ProductContext
 * 
 * MIGRADO para XState State Machine
 * Hooks legados mantidos para compatibilidade durante transição
 * 
 * @see RISE Protocol V3 - State Machine Edition
 */

// === LEGACY HOOKS (mantidos para compatibilidade) ===
// Estes hooks ainda são usados por alguns componentes
// Serão removidos em fases futuras após migração completa
export { useProductCore } from "./useProductCore";
export { useProductEntities } from "./useProductEntities";
export { useProductCheckouts } from "./useProductCheckouts";

// === ADAPTERS ===
// Adapter puro (zero useState) - bridge para State Machine
export { useProductSettingsAdapter, useProductSettings } from "./useProductSettingsAdapter";

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
