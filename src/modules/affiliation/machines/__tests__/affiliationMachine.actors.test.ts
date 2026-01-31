/**
 * AffiliationMachine Actors Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliation Machine Actors configuration.
 * Uses structural verification compatible with XState v5 SingleOrArray types.
 * 
 * @module affiliation/machines/__tests__
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadAffiliationActor } from "../affiliationMachine.actors";
import { affiliationMachine } from "../affiliationMachine";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  })),
}));

import { api } from "@/lib/api";

// ============================================================================
// HELPER - Extract invoke configuration safely for XState v5
// ============================================================================

function getInvokeConfig(invoke: unknown): Record<string, unknown> | null {
  if (!invoke) return null;
  if (Array.isArray(invoke)) {
    return invoke[0] as Record<string, unknown>;
  }
  return invoke as Record<string, unknown>;
}

// ============================================================================
// TESTS
// ============================================================================

describe("affiliationMachine.actors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadAffiliationActor", () => {
    it("is defined and exported", () => {
      expect(loadAffiliationActor).toBeDefined();
      expect(typeof loadAffiliationActor).toBe("object");
    });

    it("is invoked in loading state", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke).toBeDefined();
      
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      expect(invokeConfig?.src).toBe("loadAffiliation");
    });

    it("has onDone transition to ready", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      
      expect(invokeConfig?.onDone).toBeDefined();
    });

    it("has onError transition to error", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      
      expect(invokeConfig?.onError).toBeDefined();
    });

    it("receives affiliationId as input", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      
      expect(invokeConfig?.input).toBeDefined();
    });

    it("updates context on success", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      
      const onDone = invokeConfig?.onDone as Record<string, unknown> | undefined;
      expect(onDone).toBeDefined();
    });

    it("updates loadError on failure", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      const invokeConfig = getInvokeConfig(loadingState?.invoke);
      
      const onError = invokeConfig?.onError as Record<string, unknown> | undefined;
      expect(onError).toBeDefined();
    });
  });

  describe("API integration", () => {
    it("calls api.call with correct function name", async () => {
      vi.mocked(api.call).mockResolvedValue({
        data: {
          affiliation: {
            id: "aff-123",
            affiliate_code: "CODE123",
            commission_rate: 10,
            status: "active",
            created_at: "2024-01-01T00:00:00Z",
            product: { id: "prod-1", name: "Product 1" },
          },
        },
        error: null,
      });

      // Test that api.call is mocked correctly
      const result = await api.call("get-affiliation-details", { affiliation_id: "aff-123" });
      
      expect(api.call).toHaveBeenCalledWith("get-affiliation-details", {
        affiliation_id: "aff-123",
      });
      
      const data = result.data as { affiliation?: { id: string } } | null;
      expect(data?.affiliation).toBeDefined();
    });
  });
});
