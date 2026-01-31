/**
 * @file PixelLibrary.test.tsx
 * @description Tests for PixelLibrary component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { PixelLibrary } from "../PixelLibrary";
import { mockVendorPixels } from "../../__tests__/_fixtures";
import { createMockPixelsContextValue, mockLoadedContext, mockErrorContext } from "../../__tests__/_mocks";

// Mock PixelsContext
const mockContextValue = createMockPixelsContextValue();

vi.mock("../../context/PixelsContext", () => ({
  usePixelsContext: () => mockContextValue,
}));

// Mock child components
vi.mock("../PixelCard", () => ({
  PixelCard: ({ pixel }: { pixel: { name: string } }) => (
    <div data-testid="pixel-card">{pixel.name}</div>
  ),
}));

vi.mock("../PixelForm", () => ({
  PixelForm: () => <div data-testid="pixel-form">Pixel Form</div>,
}));

vi.mock("../PlatformIcon", () => ({
  PlatformIcon: ({ platform }: { platform: string }) => (
    <div data-testid="platform-icon">{platform}</div>
  ),
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("PixelLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock context to default loaded state
    Object.assign(mockContextValue, createMockPixelsContextValue({
      context: mockLoadedContext,
      isLoading: false,
      isError: false,
    }));
  });

  describe("Rendering", () => {
    it("should render loading state", () => {
      mockContextValue.isLoading = true;

      render(<PixelLibrary />);

      // Should show loading spinner
      expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    });

    it("should render error state", () => {
      mockContextValue.isError = true;
      mockContextValue.context = mockErrorContext;

      render(<PixelLibrary />);

      expect(screen.getByText(/Erro ao carregar pixels/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeInTheDocument();
    });

    it("should render pixel list when loaded", () => {
      render(<PixelLibrary />);

      // Should render pixel cards
      const pixelCards = screen.getAllByTestId("pixel-card");
      expect(pixelCards.length).toBeGreaterThan(0);
    });

    it("should render add pixel button", () => {
      render(<PixelLibrary />);

      expect(screen.getByRole("button", { name: /Adicionar Pixel/i })).toBeInTheDocument();
    });

    it("should render refresh button", () => {
      render(<PixelLibrary />);

      expect(screen.getByRole("button", { name: /Atualizar/i })).toBeInTheDocument();
    });

    it("should group pixels by platform", () => {
      render(<PixelLibrary />);

      // Should render platform sections
      expect(screen.getByText("Facebook Pixel Principal")).toBeInTheDocument();
      expect(screen.getByText("TikTok Pixel Campanha 2026")).toBeInTheDocument();
      expect(screen.getByText("Google Ads Conversão")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call openForm when add button is clicked", () => {
      const openFormSpy = vi.fn();
      mockContextValue.send = openFormSpy;

      render(<PixelLibrary />);

      const addButton = screen.getByRole("button", { name: /Adicionar Pixel/i });
      fireEvent.click(addButton);

      expect(openFormSpy).toHaveBeenCalled();
    });

    it("should call refresh when refresh button is clicked", () => {
      const refreshSpy = vi.fn();
      mockContextValue.send = refreshSpy;

      render(<PixelLibrary />);

      const refreshButton = screen.getByRole("button", { name: /Atualizar/i });
      fireEvent.click(refreshButton);

      expect(refreshSpy).toHaveBeenCalled();
    });

    it("should call refresh when retry button is clicked in error state", () => {
      mockContextValue.isError = true;
      mockContextValue.context = mockErrorContext;
      const refreshSpy = vi.fn();
      mockContextValue.send = refreshSpy;

      render(<PixelLibrary />);

      const retryButton = screen.getByRole("button", { name: /Tentar novamente/i });
      fireEvent.click(retryButton);

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe("Delete Confirmation", () => {
    it("should render delete confirmation dialog when deletingPixel is set", () => {
      mockContextValue.context.deletingPixel = mockVendorPixels[0];

      render(<PixelLibrary />);

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/Tem certeza/i)).toBeInTheDocument();
    });

    it("should call cancelDelete when cancel button is clicked", () => {
      mockContextValue.context.deletingPixel = mockVendorPixels[0];
      const cancelDeleteSpy = vi.fn();
      mockContextValue.send = cancelDeleteSpy;

      render(<PixelLibrary />);

      const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(cancelDeleteSpy).toHaveBeenCalled();
    });

    it("should call confirmDelete when confirm button is clicked", () => {
      mockContextValue.context.deletingPixel = mockVendorPixels[0];
      const confirmDeleteSpy = vi.fn();
      mockContextValue.send = confirmDeleteSpy;

      render(<PixelLibrary />);

      const confirmButton = screen.getByRole("button", { name: /Excluir/i });
      fireEvent.click(confirmButton);

      expect(confirmDeleteSpy).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty pixel list", () => {
      mockContextValue.context.pixels = [];

      render(<PixelLibrary />);

      // Should render empty state
      expect(screen.getByText(/Nenhum pixel cadastrado/i)).toBeInTheDocument();
    });

    it("should handle null error message", () => {
      mockContextValue.isError = true;
      mockContextValue.context.error = null;

      render(<PixelLibrary />);

      expect(screen.getByText(/Erro ao carregar pixels/i)).toBeInTheDocument();
    });

    it("should render PixelForm component", () => {
      render(<PixelLibrary />);

      expect(screen.getByTestId("pixel-form")).toBeInTheDocument();
    });
  });
});
