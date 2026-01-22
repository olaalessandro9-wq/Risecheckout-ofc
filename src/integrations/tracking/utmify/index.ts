/**
 * Barrel Export - UTMify Module
 * Módulo: src/integrations/tracking/utmify
 * 
 * @version 3.1.0 - RISE Protocol V3 Compliant - Modularizado
 * 
 * Este arquivo exporta a interface pública do módulo UTMify.
 * Permite importar tudo com: import * as UTMify from "@/integrations/tracking/utmify"
 */

// Tipos
export * from "./types";

// Utils (extraídos para modularização)
export * from "./utils";

// Eventos
export * from "./events";

// Hooks
export * from "./hooks";

// Componente
export { Tracker } from "./Tracker";
