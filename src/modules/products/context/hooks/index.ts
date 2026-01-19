/**
 * Re-exportação dos hooks especializados do ProductContext
 * 
 * NOTA: useSettingsHandlerRegistration foi DELETADO
 * Motivo: Código morto - nunca importado/usado, substituído por useGlobalValidationHandlers
 * Data: 2026-01-18
 */

export { useProductCore } from "./useProductCore";
export { useProductEntities } from "./useProductEntities";
export { useProductCheckouts } from "./useProductCheckouts";

// Adapter puro (zero useState) - renomeado para uso geral
export { useProductSettings } from "./useProductSettingsAdapter";

// Global Validation Handlers - TODOS os handlers de validação centralizados
export { useGlobalValidationHandlers } from "./useGlobalValidationHandlers";

// Tab Validation - Sistema de validação global
export { useTabValidation } from "./useTabValidation";

// BFF Product Loader - React Query Edition
export { useProductLoader, productQueryKeys } from "./useProductLoader";
export { useProductDataMapper } from "./useProductDataMapper";

// Re-export types for external consumption
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
