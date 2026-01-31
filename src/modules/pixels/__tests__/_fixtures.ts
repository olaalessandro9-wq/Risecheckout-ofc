/**
 * @file _fixtures.ts
 * @description Test fixtures for Pixels module
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type {
  VendorPixel,
  ProductPixelLink,
  LinkedPixel,
  PixelFormData,
  ProductPixelLinkData,
  PixelPlatform,
} from "../types";

// ============================================================================
// VENDOR PIXELS
// ============================================================================

export const mockFacebookPixel: VendorPixel = {
  id: "pixel-fb-001",
  vendor_id: "vendor-001",
  platform: "facebook",
  name: "Facebook Pixel Principal",
  pixel_id: "123456789012345",
  access_token: "EAABsbCS1iHgBO...",
  conversion_label: null,
  domain: "example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-15T00:00:00Z",
  linked_products_count: 3,
};

export const mockTikTokPixel: VendorPixel = {
  id: "pixel-tt-001",
  vendor_id: "vendor-001",
  platform: "tiktok",
  name: "TikTok Pixel Campanha 2026",
  pixel_id: "C9ABCDEFGHIJKLMN",
  access_token: "tiktok_access_token_xyz",
  conversion_label: null,
  domain: null,
  is_active: true,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-20T00:00:00Z",
  linked_products_count: 1,
};

export const mockGoogleAdsPixel: VendorPixel = {
  id: "pixel-ga-001",
  vendor_id: "vendor-001",
  platform: "google_ads",
  name: "Google Ads Conversão",
  pixel_id: "AW-123456789",
  access_token: null,
  conversion_label: "AbCdEfGhIjKlMnOp",
  domain: null,
  is_active: true,
  created_at: "2026-01-10T00:00:00Z",
  updated_at: "2026-01-25T00:00:00Z",
  linked_products_count: 5,
};

export const mockKwaiPixel: VendorPixel = {
  id: "pixel-kw-001",
  vendor_id: "vendor-001",
  platform: "kwai",
  name: "Kwai Pixel Teste",
  pixel_id: "kwai_pixel_id_123",
  access_token: null,
  conversion_label: null,
  domain: null,
  is_active: false,
  created_at: "2026-01-12T00:00:00Z",
  updated_at: "2026-01-12T00:00:00Z",
  linked_products_count: 0,
};

export const mockVendorPixels: VendorPixel[] = [
  mockFacebookPixel,
  mockTikTokPixel,
  mockGoogleAdsPixel,
  mockKwaiPixel,
];

// ============================================================================
// PRODUCT PIXEL LINKS
// ============================================================================

export const mockProductPixelLink: ProductPixelLink = {
  id: "link-001",
  product_id: "prod-001",
  pixel_id: "pixel-fb-001",
  fire_on_initiate_checkout: true,
  fire_on_purchase: true,
  fire_on_pix: true,
  fire_on_card: true,
  fire_on_boleto: false,
  custom_value_percent: 100,
  created_at: "2026-01-15T00:00:00Z",
};

export const mockLinkedPixel: LinkedPixel = {
  ...mockFacebookPixel,
  link: mockProductPixelLink,
};

// ============================================================================
// FORM DATA
// ============================================================================

export const mockPixelFormData: PixelFormData = {
  platform: "facebook",
  name: "Novo Facebook Pixel",
  pixel_id: "987654321098765",
  access_token: "EAABsbCS1iHgBO_new_token",
  conversion_label: undefined,
  domain: "newdomain.com",
  is_active: true,
};

export const mockGoogleAdsFormData: PixelFormData = {
  platform: "google_ads",
  name: "Nova Conversão Google",
  pixel_id: "AW-987654321",
  access_token: undefined,
  conversion_label: "XyZaBcDeFgHiJkLm",
  domain: undefined,
  is_active: true,
};

export const mockProductPixelLinkData: ProductPixelLinkData = {
  pixel_id: "pixel-fb-001",
  fire_on_initiate_checkout: true,
  fire_on_purchase: true,
  fire_on_pix: true,
  fire_on_card: true,
  fire_on_boleto: true,
  custom_value_percent: 80,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a mock VendorPixel with custom overrides
 */
export function createMockVendorPixel(
  overrides: Partial<VendorPixel> = {}
): VendorPixel {
  return {
    id: `pixel-${Date.now()}`,
    vendor_id: "vendor-001",
    platform: "facebook",
    name: "Test Pixel",
    pixel_id: `${Math.random().toString(36).slice(2, 17)}`,
    access_token: null,
    conversion_label: null,
    domain: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_products_count: 0,
    ...overrides,
  };
}

/**
 * Creates a mock ProductPixelLink with custom overrides
 */
export function createMockProductPixelLink(
  overrides: Partial<ProductPixelLink> = {}
): ProductPixelLink {
  return {
    id: `link-${Date.now()}`,
    product_id: "prod-001",
    pixel_id: "pixel-001",
    fire_on_initiate_checkout: true,
    fire_on_purchase: true,
    fire_on_pix: true,
    fire_on_card: true,
    fire_on_boleto: true,
    custom_value_percent: 100,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock PixelFormData with custom overrides
 */
export function createMockPixelFormData(
  platform: PixelPlatform = "facebook",
  overrides: Partial<PixelFormData> = {}
): PixelFormData {
  const baseData: Record<PixelPlatform, PixelFormData> = {
    facebook: {
      platform: "facebook",
      name: "Test Facebook Pixel",
      pixel_id: "123456789012345",
      access_token: "test_access_token",
      domain: "test.com",
      is_active: true,
    },
    tiktok: {
      platform: "tiktok",
      name: "Test TikTok Pixel",
      pixel_id: "C9TESTPIXELID",
      access_token: "test_tiktok_token",
      is_active: true,
    },
    google_ads: {
      platform: "google_ads",
      name: "Test Google Ads",
      pixel_id: "AW-123456789",
      conversion_label: "TestLabel123",
      is_active: true,
    },
    kwai: {
      platform: "kwai",
      name: "Test Kwai Pixel",
      pixel_id: "kwai_test_123",
      is_active: true,
    },
  };

  return {
    ...baseData[platform],
    ...overrides,
  };
}
