/**
 * @file _test-helpers.ts
 * @description Test helpers for TikTok Pixel tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { TikTokConfig, TikTokItem, TikTokCustomer } from "../types";

export function createMockConfig(overrides?: Partial<TikTokConfig>): TikTokConfig {
  return {
    pixel_id: "123456789",
    enabled: true,
    ...overrides,
  };
}

export function createMockItem(overrides?: Partial<TikTokItem>): TikTokItem {
  return {
    id: "prod_123",
    name: "Test Product",
    price: 99.9,
    quantity: 1,
    ...overrides,
  };
}

export function createMockCustomer(overrides?: Partial<TikTokCustomer>): TikTokCustomer {
  return {
    email: "test@example.com",
    phone: "+5511999999999",
    ...overrides,
  };
}
