/**
 * TrackingManager Types
 * 
 * Tipos para o TrackingManager.
 * 
 * RISE Protocol V2: Código legacy removido.
 * Apenas UTMify permanece pois não migrou para product_pixels.
 */

import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";

/**
 * Re-exportar UTMify para uso no TrackingManager
 * (único tracking que ainda não migrou para product_pixels)
 */
export type LegacyUTMifyIntegration = UTMifyIntegration;
