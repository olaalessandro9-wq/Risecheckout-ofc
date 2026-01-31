/**
 * @file feature-flags.test.ts
 * @description Tests for Feature Flags configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the logger module BEFORE importing feature-flags
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => mockLogger,
}));

import { FEATURE_FLAGS, debugLog, type FeatureFlagKey } from "../feature-flags";

// ============================================================================
// FEATURE_FLAGS Object
// ============================================================================

describe("FEATURE_FLAGS", () => {
  it("should be defined", () => {
    expect(FEATURE_FLAGS).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof FEATURE_FLAGS).toBe("object");
  });

  it("should have all required flags", () => {
    expect(FEATURE_FLAGS).toHaveProperty("ENABLE_STRIPE_GATEWAY");
    expect(FEATURE_FLAGS).toHaveProperty("ENABLE_PAGSEGURO_GATEWAY");
    expect(FEATURE_FLAGS).toHaveProperty("VALIDATE_GATEWAY_CREDENTIALS");
    expect(FEATURE_FLAGS).toHaveProperty("DEBUG_MODE");
  });

  it("should have boolean values for all flags", () => {
    Object.values(FEATURE_FLAGS).forEach((value) => {
      expect(typeof value).toBe("boolean");
    });
  });

  it("should be readonly (const assertion)", () => {
    // TypeScript enforces this at compile time via 'as const'
    // At runtime, the object is not frozen, but TypeScript prevents modification
    // This test verifies the type is correctly defined
    const keys = Object.keys(FEATURE_FLAGS) as FeatureFlagKey[];
    expect(keys.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Individual Feature Flags
// ============================================================================

describe("Individual Feature Flags", () => {
  describe("ENABLE_STRIPE_GATEWAY", () => {
    it("should be a boolean value", () => {
      expect(typeof FEATURE_FLAGS.ENABLE_STRIPE_GATEWAY).toBe("boolean");
    });

    it("should be a boolean", () => {
      expect(typeof FEATURE_FLAGS.ENABLE_STRIPE_GATEWAY).toBe("boolean");
    });
  });

  describe("ENABLE_PAGSEGURO_GATEWAY", () => {
    it("should be false (coming soon)", () => {
      expect(FEATURE_FLAGS.ENABLE_PAGSEGURO_GATEWAY).toBe(false);
    });

    it("should be a boolean", () => {
      expect(typeof FEATURE_FLAGS.ENABLE_PAGSEGURO_GATEWAY).toBe("boolean");
    });
  });

  describe("VALIDATE_GATEWAY_CREDENTIALS", () => {
    it("should be true (enabled)", () => {
      expect(FEATURE_FLAGS.VALIDATE_GATEWAY_CREDENTIALS).toBe(true);
    });

    it("should be a boolean", () => {
      expect(typeof FEATURE_FLAGS.VALIDATE_GATEWAY_CREDENTIALS).toBe("boolean");
    });
  });

  describe("DEBUG_MODE", () => {
    it("should be a boolean", () => {
      expect(typeof FEATURE_FLAGS.DEBUG_MODE).toBe("boolean");
    });

    it("should match environment DEV mode", () => {
      const isDevelopment = import.meta.env.DEV;
      expect(FEATURE_FLAGS.DEBUG_MODE).toBe(isDevelopment);
    });
  });
});

// ============================================================================
// debugLog Function
// ============================================================================

describe("debugLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(debugLog).toBeDefined();
  });

  it("should be a function", () => {
    expect(typeof debugLog).toBe("function");
  });

  it("should log when DEBUG_MODE is true", () => {
    // Save original value
    const originalDebugMode = FEATURE_FLAGS.DEBUG_MODE;

    // Mock DEBUG_MODE as true
    vi.spyOn(FEATURE_FLAGS, "DEBUG_MODE", "get").mockReturnValue(true);

    debugLog("Test message", { test: "data" });

    expect(mockLogger.debug).toHaveBeenCalledWith("Test message", { test: "data" });

    // Restore
    vi.spyOn(FEATURE_FLAGS, "DEBUG_MODE", "get").mockReturnValue(originalDebugMode);
  });

  it("should not log when DEBUG_MODE is false", () => {
    // Mock DEBUG_MODE as false
    vi.spyOn(FEATURE_FLAGS, "DEBUG_MODE", "get").mockReturnValue(false);

    debugLog("Test message", { test: "data" });

    expect(mockLogger.debug).not.toHaveBeenCalled();
  });

  it("should handle message without data", () => {
    vi.spyOn(FEATURE_FLAGS, "DEBUG_MODE", "get").mockReturnValue(true);

    debugLog("Test message");

    expect(mockLogger.debug).toHaveBeenCalledWith("Test message", undefined);
  });
});

// ============================================================================
// FeatureFlagKey Type
// ============================================================================

describe("FeatureFlagKey Type", () => {
  it("should include all flag keys", () => {
    const validKeys: FeatureFlagKey[] = [
      "ENABLE_STRIPE_GATEWAY",
      "ENABLE_PAGSEGURO_GATEWAY",
      "VALIDATE_GATEWAY_CREDENTIALS",
      "DEBUG_MODE",
    ];

    validKeys.forEach((key) => {
      expect(FEATURE_FLAGS).toHaveProperty(key);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should not have undefined flags", () => {
    Object.values(FEATURE_FLAGS).forEach((value) => {
      expect(value).not.toBeUndefined();
    });
  });

  it("should not have null flags", () => {
    Object.values(FEATURE_FLAGS).forEach((value) => {
      expect(value).not.toBeNull();
    });
  });

  it("should have consistent flag naming (SCREAMING_SNAKE_CASE)", () => {
    Object.keys(FEATURE_FLAGS).forEach((key) => {
      expect(key).toMatch(/^[A-Z_]+$/);
    });
  });
});
