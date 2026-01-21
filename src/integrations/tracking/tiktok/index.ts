/**
 * Barrel Export - TikTok Pixel Module
 * Módulo: src/integrations/tracking/tiktok
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant
 * 
 * Este arquivo exporta a interface pública do módulo TikTok Pixel.
 * Permite importar tudo com: import * as TikTok from "@/integrations/tracking/tiktok"
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
