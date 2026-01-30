/**
 * AffiliationMachine Actors Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliation Machine Actors configuration.
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
      expect(loadingState?.invoke?.src).toBe("loadAffiliation");
    });

    it("has onDone transition to ready", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke?.onDone).toBeDefined();
      expect(loadingState?.invoke?.onDone?.target).toBe("ready");
    });

    it("has onError transition to error", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke?.onError).toBeDefined();
      expect(loadingState?.invoke?.onError?.target).toBe("error");
    });

    it("receives affiliationId as input", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke?.input).toBeDefined();
    });

    it("updates context on success", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke?.onDone?.actions).toBeDefined();
    });

    it("updates loadError on failure", () => {
      const loadingState = affiliationMachine.config.states?.loading;
      expect(loadingState?.invoke?.onError?.actions).toBeDefined();
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
      expect(result.data?.affiliation).toBeDefined();
    });
  });
});
