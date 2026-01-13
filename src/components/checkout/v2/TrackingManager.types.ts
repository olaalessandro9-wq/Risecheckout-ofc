/**
 * TrackingManager Types
 * 
 * Tipos para as props do TrackingManager.
 * Documentam exatamente o que cada hook de tracking retorna.
 * 
 * RISE Protocol V2: Zero any, tipagem forte.
 * 
 * IMPORTANTE: Os hooks retornam tipos diferentes:
 * - Facebook: retorna apenas FacebookPixelConfig (não a integração completa)
 * - TikTok, GoogleAds, Kwai, UTMify: retornam a integração completa
 */

import type { FacebookPixelConfig } from "@/integrations/tracking/facebook/types";
import type { TikTokIntegration } from "@/integrations/tracking/tiktok/types";
import type { GoogleAdsIntegration } from "@/integrations/tracking/google-ads/types";
import type { KwaiIntegration } from "@/integrations/tracking/kwai/types";
import type { UTMifyIntegration } from "@/integrations/tracking/utmify/types";

// ============================================================================
// RE-EXPORTS PARA USO NO TRACKING MANAGER
// ============================================================================

/**
 * Facebook usa apenas a config (não a integração completa)
 * Isso é o que useFacebookConfig() retorna
 */
export type LegacyFacebookConfig = FacebookPixelConfig;

/**
 * Re-exportar os tipos já existentes para consistência
 * Esses tipos já estão corretamente definidos nos seus módulos
 */
export type LegacyTikTokIntegration = TikTokIntegration;
export type LegacyGoogleAdsIntegration = GoogleAdsIntegration;
export type LegacyKwaiIntegration = KwaiIntegration;
export type LegacyUTMifyIntegration = UTMifyIntegration;
