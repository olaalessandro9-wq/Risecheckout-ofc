/**
 * Re-exportação dos hooks especializados do ProductContext
 */

export { useProductCore } from "./useProductCore";
export { useProductEntities } from "./useProductEntities";
export { useProductCheckouts } from "./useProductCheckouts";

// Legacy - mantido para compatibilidade durante migração
export { useProductSettings } from "./useProductSettings";

// Novo - adapter puro (zero useState)
export { useProductSettings as useProductSettingsAdapter } from "./useProductSettingsAdapter";
