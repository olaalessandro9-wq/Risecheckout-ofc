/**
 * Barrel Export - Facebook Pixel Module
 * Módulo: src/integrations/tracking/facebook
 * 
 * @version 3.0.0 - RISE Protocol V3 - Event ID Deduplication
 * 
 * Este arquivo exporta a interface pública do módulo Facebook Pixel.
 * Permite importar tudo com: import * as Facebook from "@/integrations/tracking/facebook"
 * 
 * NOTA: Os pixels são gerenciados centralmente em src/modules/pixels/ (SSOT via XState).
 * Este módulo contém apenas o componente de renderização e funções de eventos.
 */

// Tipos
export * from "./types";

// Eventos (trackPurchase, trackViewContent, etc.)
export * from "./events";

// Componente de renderização
export { Pixel } from "./Pixel";
