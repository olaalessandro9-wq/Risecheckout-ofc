/**
 * @file ProductInfo.test.tsx
 * @description Tests for ProductInfo component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { ProductInfo } from "../ProductInfo";

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ProductInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render status badge as active", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category="Marketing Digital"
          requiresManualApproval={false}
        />
      );

      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("● Ativo")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <ProductInfo
          description="Este é um curso completo de marketing digital"
          category="Marketing Digital"
          requiresManualApproval={false}
        />
      );

      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(
        screen.getByText("Este é um curso completo de marketing digital")
      ).toBeInTheDocument();
    });

    it("should not render description section when description is null", () => {
      render(
        <ProductInfo
          description={null}
          category="Marketing Digital"
          requiresManualApproval={false}
        />
      );

      expect(screen.queryByText("Descrição")).not.toBeInTheDocument();
    });

    it("should render category when provided", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category="Desenvolvimento"
          requiresManualApproval={false}
        />
      );

      expect(screen.getByText("Tipo do produto")).toBeInTheDocument();
      expect(screen.getByText("Desenvolvimento")).toBeInTheDocument();
    });

    it("should render default category when category is null", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category={null}
          requiresManualApproval={false}
        />
      );

      expect(screen.getByText("Tipo do produto")).toBeInTheDocument();
      expect(screen.getByText("digital")).toBeInTheDocument();
    });

    it("should render immediate approval badge when requiresManualApproval is false", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category="Marketing Digital"
          requiresManualApproval={false}
        />
      );

      expect(screen.getByText("Aprovação")).toBeInTheDocument();
      expect(screen.getByText("● Imediata")).toBeInTheDocument();
    });

    it("should render manual approval badge when requiresManualApproval is true", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category="Marketing Digital"
          requiresManualApproval={true}
        />
      );

      expect(screen.getByText("Aprovação")).toBeInTheDocument();
      expect(screen.getByText("● Mediante análise")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null requiresManualApproval gracefully", () => {
      render(
        <ProductInfo
          description="Descrição do produto"
          category="Marketing Digital"
          requiresManualApproval={null}
        />
      );

      // Should render immediate approval when null (falsy value)
      expect(screen.getByText("● Imediata")).toBeInTheDocument();
    });

    it("should handle empty description string", () => {
      render(
        <ProductInfo
          description=""
          category="Marketing Digital"
          requiresManualApproval={false}
        />
      );

      // Empty string is falsy, so description section should not render
      expect(screen.queryByText("Descrição")).not.toBeInTheDocument();
    });

    it("should render all sections with valid data", () => {
      render(
        <ProductInfo
          description="Produto completo"
          category="Cursos"
          requiresManualApproval={true}
        />
      );

      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(screen.getByText("Tipo do produto")).toBeInTheDocument();
      expect(screen.getByText("Aprovação")).toBeInTheDocument();
    });
  });
});
