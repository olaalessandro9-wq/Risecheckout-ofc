/**
 * Re-exportação dos hooks especializados do ProductContext
 */

export { useProductCore } from "./useProductCore";
export { useProductEntities } from "./useProductEntities";
export { useProductCheckouts } from "./useProductCheckouts";

// Adapter puro (zero useState) - renomeado para uso geral
export { useProductSettings } from "./useProductSettingsAdapter";

// Save Registry Pattern - Registro de handlers
export { useSettingsHandlerRegistration } from "./useSettingsHandlerRegistration";

// Tab Validation - Sistema de validação global
export { useTabValidation } from "./useTabValidation";
