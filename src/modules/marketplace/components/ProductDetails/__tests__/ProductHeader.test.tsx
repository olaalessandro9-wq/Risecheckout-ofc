/**
 * @file ProductHeader.test.tsx
 * @description Tests for ProductHeader component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@/test/utils";
import { ProductHeader } from "../ProductHeader";

// Mock utils
vi.mock("../utils", () => ({
  formatPrice: (value: number) => `R$ ${(value / 100).toFixed(2)}`,
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ProductHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing with full props", () => {
      expect(() =>
        render(
          <ProductHeader
            name="Curso de Marketing"
            imageUrl="https://example.com/image.jpg"
            producerName="João Silva"
            maxCommission={5000}
            isOwner={false}
          />
        )
      ).not.toThrow();
    });

    it("should render without crashing when owner", () => {
      expect(() =>
        render(
          <ProductHeader
            name="Meu Produto"
            imageUrl="https://example.com/image.jpg"
            producerName="Eu Mesmo"
            maxCommission={0}
            isOwner={true}
          />
        )
      ).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null product name", () => {
      expect(() =>
        render(
          <ProductHeader
            name={null}
            imageUrl="https://example.com/image.jpg"
            producerName="João Silva"
            maxCommission={5000}
            isOwner={false}
          />
        )
      ).not.toThrow();
    });

    it("should handle null imageUrl", () => {
      expect(() =>
        render(
          <ProductHeader
            name="Curso de Marketing"
            imageUrl={null}
            producerName="João Silva"
            maxCommission={5000}
            isOwner={false}
          />
        )
      ).not.toThrow();
    });

    it("should handle null producer name", () => {
      expect(() =>
        render(
          <ProductHeader
            name="Curso de Marketing"
            imageUrl="https://example.com/image.jpg"
            producerName={null}
            maxCommission={5000}
            isOwner={false}
          />
        )
      ).not.toThrow();
    });

    it("should handle zero maxCommission", () => {
      expect(() =>
        render(
          <ProductHeader
            name="Curso de Marketing"
            imageUrl="https://example.com/image.jpg"
            producerName="João Silva"
            maxCommission={0}
            isOwner={false}
          />
        )
      ).not.toThrow();
    });
  });
});
