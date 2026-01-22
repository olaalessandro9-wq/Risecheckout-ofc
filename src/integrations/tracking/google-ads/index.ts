/**
 * Barrel Export - Google Ads Module
 * Módulo: src/integrations/tracking/google-ads
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant - Modularizado
 * 
 * Este arquivo exporta a interface pública do módulo Google Ads.
 * Permite importar tudo com: import * as GoogleAds from "@/integrations/tracking/google-ads"
 * 
 * NOTA: Os pixels são gerenciados centralmente em src/modules/pixels/ (SSOT via XState).
 * Este módulo contém apenas o componente de renderização e funções de eventos.
 */

// Tipos
export * from "./types";

// Eventos (modularizados em events/)
export * from "./events/index";

// Componente de renderização
export { Tracker } from "./Tracker";
