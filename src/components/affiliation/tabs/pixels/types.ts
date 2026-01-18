/**
 * Types for PixelsTab components
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Vertical Slice Architecture
 * @module affiliation/tabs/pixels/types
 */

export type Platform = "facebook" | "google_ads" | "tiktok" | "kwai";

export interface PixelForm {
  id?: string;
  pixel_id: string;
  domain: string;
  fire_on_pix: boolean;
  fire_on_boleto: boolean;
  fire_on_card: boolean;
  custom_value_pix: number;
  custom_value_boleto: number;
  custom_value_card: number;
  enabled: boolean;
  isNew?: boolean;
}

export interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: "facebook", name: "Facebook Pixel", icon: "🔵" },
  { id: "google_ads", name: "Google Ads", icon: "📊" },
  { id: "tiktok", name: "TikTok Pixel", icon: "🎵" },
  { id: "kwai", name: "Kwai Pixel", icon: "🟢" },
];

export const DEFAULT_PIXEL_FORM: PixelForm = {
  pixel_id: "",
  domain: "",
  fire_on_pix: true,
  fire_on_boleto: true,
  fire_on_card: true,
  custom_value_pix: 100,
  custom_value_boleto: 100,
  custom_value_card: 100,
  enabled: true,
  isNew: true,
};

export const MAX_PIXELS_PER_PLATFORM = 50;
