/**
 * @file ProductInfo.test.tsx
 * @description Tests for ProductInfo component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@/test/utils";
import { ProductInfo } from "../ProductInfo";

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ProductInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing with full data", () => {
      expect(() =>
        render(
          <ProductInfo
            description="Este é um curso completo de marketing digital"
            category="Marketing Digital"
            requiresManualApproval={false}
          />
        )
      ).not.toThrow();
    });

    it("should render without crashing with manual approval", () => {
      expect(() =>
        render(
          <ProductInfo
            description="Descrição do produto"
            category="Marketing Digital"
            requiresManualApproval={true}
          />
        )
      ).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null description", () => {
      expect(() =>
        render(
          <ProductInfo
            description={null}
            category="Marketing Digital"
            requiresManualApproval={false}
          />
        )
      ).not.toThrow();
    });

    it("should handle null category", () => {
      expect(() =>
        render(
          <ProductInfo
            description="Descrição do produto"
            category={null}
            requiresManualApproval={false}
          />
        )
      ).not.toThrow();
    });

    it("should handle null requiresManualApproval", () => {
      expect(() =>
        render(
          <ProductInfo
            description="Descrição do produto"
            category="Marketing Digital"
            requiresManualApproval={null}
          />
        )
      ).not.toThrow();
    });

    it("should handle empty description string", () => {
      expect(() =>
        render(
          <ProductInfo
            description=""
            category="Marketing Digital"
            requiresManualApproval={false}
          />
        )
      ).not.toThrow();
    });
  });
});
