/**
 * @file _shared.ts
 * @description Shared types, mocks and utilities for config tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";

// ============================================================================
// MOCK LOGGER
// ============================================================================

export const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

export function createMockLogger() {
  return mockLogger;
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export const testData = {
  email: () => `test-${Date.now()}@example.com`,
  url: () => `https://test-${Date.now()}.example.com`,
  uuid: () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
};

// ============================================================================
// ENVIRONMENT MOCKS
// ============================================================================

export function mockEnv(overrides: Record<string, string> = {}) {
  const originalEnv = { ...import.meta.env };
  
  Object.assign(import.meta.env, {
    DEV: false,
    PROD: true,
    ...overrides,
  });

  return () => {
    Object.assign(import.meta.env, originalEnv);
  };
}
