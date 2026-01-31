/**
 * @file ProductHeader.test.tsx
 * @description Tests for ProductHeader component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
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
    it("should render product name", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      expect(screen.getByText("Curso de Marketing")).toBeInTheDocument();
    });

    it("should render product image when imageUrl is provided", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      const image = screen.getByAltText("Curso de Marketing");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("should not render image when imageUrl is null", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl={null}
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      const image = screen.queryByRole("img");
      expect(image).not.toBeInTheDocument();
    });

    it("should render producer name for non-owner", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      expect(screen.getByText(/Por/)).toBeInTheDocument();
      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    it("should render max commission for non-owner", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      expect(screen.getByText(/Você pode lucrar até/)).toBeInTheDocument();
      expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
    });

    it("should render owner badge when isOwner is true", () => {
      render(
        <ProductHeader
          name="Meu Produto"
          imageUrl="https://example.com/image.jpg"
          producerName="Eu Mesmo"
          maxCommission={0}
          isOwner={true}
        />
      );

      expect(screen.getByText("Você é o produtor")).toBeInTheDocument();
    });

    it("should not render producer info when isOwner is true", () => {
      render(
        <ProductHeader
          name="Meu Produto"
          imageUrl="https://example.com/image.jpg"
          producerName="Eu Mesmo"
          maxCommission={0}
          isOwner={true}
        />
      );

      expect(screen.queryByText(/Por/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Você pode lucrar até/)).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null product name", () => {
      render(
        <ProductHeader
          name={null}
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={5000}
          isOwner={false}
        />
      );

      // Should render without crashing
      expect(screen.getByRole("img")).toHaveAttribute("alt", "Produto");
    });

    it("should handle null producer name", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName={null}
          maxCommission={5000}
          isOwner={false}
        />
      );

      expect(screen.getByText("Produtor")).toBeInTheDocument();
    });

    it("should not render commission text when maxCommission is 0", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={0}
          isOwner={false}
        />
      );

      expect(screen.queryByText(/Você pode lucrar até/)).not.toBeInTheDocument();
    });

    it("should handle negative maxCommission gracefully", () => {
      render(
        <ProductHeader
          name="Curso de Marketing"
          imageUrl="https://example.com/image.jpg"
          producerName="João Silva"
          maxCommission={-1000}
          isOwner={false}
        />
      );

      expect(screen.queryByText(/Você pode lucrar até/)).not.toBeInTheDocument();
    });
  });
});
