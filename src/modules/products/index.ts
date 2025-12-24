/**
 * Módulo de Produtos - Exportações Públicas
 * 
 * Este arquivo centraliza todas as exportações do módulo de produtos,
 * facilitando imports em outros lugares da aplicação.
 */

// Context
export { ProductProvider, useProductContext } from "./context/ProductContext";

// Components
export { ProductHeader } from "./components/ProductHeader";
export { ProductTabs } from "./components/ProductTabs";

// Tabs
export { GeneralTab } from "./tabs/GeneralTab";

// Types
export type * from "./types/product.types";
