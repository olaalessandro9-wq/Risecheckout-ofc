/**
 * Barrel Export - Kwai Pixel Module
 * Módulo: src/integrations/tracking/kwai
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Este arquivo exporta a interface pública do módulo Kwai Pixel.
 * Permite importar tudo com: import * as Kwai from "@/integrations/tracking/kwai"
 * 
 * NOTA: Os pixels são gerenciados centralmente em src/modules/pixels/ (SSOT via XState).
 * Este módulo contém apenas o componente de renderização e funções de eventos.
 */

// Tipos
export * from "./types";

// Eventos (trackPurchase, trackPageView, etc.)
export * from "./events";

// Componente de renderização
export { Pixel } from "./Pixel";
