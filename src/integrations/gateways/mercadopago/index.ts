/**
 * Barrel Export - Mercado Pago Gateway Module
 * Módulo: src/integrations/gateways/mercadopago
 * 
 * Este arquivo exporta a interface pública do módulo Mercado Pago.
 * Permite importar tudo com: import * as MercadoPago from "@/integrations/gateways/mercadopago"
 */

// Tipos
export * from "./types";

// API
export * from "./api";

// Hooks (refatorado em arquivos individuais < 300 linhas)
export * from "./hooks/index";

// Componentes
export { Brick } from "./Brick";
export { ConfigForm } from "./components/ConfigForm";
