/**
 * @file PixelLibrary.test.tsx
 * @description Tests for PixelLibrary component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
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
  PixelCard: () => <div data-testid="pixel-card">Pixel Card</div>,
}));

vi.mock("../PixelForm", () => ({
  PixelForm: () => <div data-testid="pixel-form">Pixel Form</div>,
}));

vi.mock("../PlatformIcon", () => ({
  PlatformIcon: () => <div data-testid="platform-icon">Platform Icon</div>,
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
    it("should render without crashing in loading state", () => {
      mockContextValue.isLoading = true;

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should render without crashing in error state", () => {
      mockContextValue.isError = true;
      mockContextValue.context = mockErrorContext;

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should render without crashing with loaded data", () => {
      expect(() => render(<PixelLibrary />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty pixel list", () => {
      mockContextValue.context.pixels = [];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should handle null error message", () => {
      mockContextValue.isError = true;
      mockContextValue.context.error = null;

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should handle deletingPixel state", () => {
      mockContextValue.context.deletingPixel = mockVendorPixels[0];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });
  });
});
