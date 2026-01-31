/**
 * @file _test-helpers.ts
 * @description Test helpers for Facebook Pixel tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import type { TrackableProduct, TrackableBump } from "@/types/tracking.types";

export function createMockProduct(overrides?: Partial<TrackableProduct>): TrackableProduct {
  return {
    id: "prod_123",
    name: "Test Product",
    price: 99.9,
    ...overrides,
  };
}

export function createMockBump(overrides?: Partial<TrackableBump>): TrackableBump {
  return {
    id: "bump_123",
    name: "Test Bump",
    price: 49.9,
    ...overrides,
  };
}
