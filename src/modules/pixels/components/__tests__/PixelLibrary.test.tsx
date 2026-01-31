/**
 * @file PixelLibrary.test.tsx
 * @description Tests for PixelLibrary component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
import { PixelLibrary } from "../PixelLibrary";
import { mockVendorPixels } from "../../__tests__/_fixtures";
import { mockLoadedContext, mockErrorContext } from "../../__tests__/_mocks";

// Mock PixelsContext with proper structure
const mockContextValue = {
  pixels: mockVendorPixels,
  isLoading: false,
  isError: false,
  error: null,
  deletingPixel: null,
  isFormOpen: false,
  editingPixel: null,
  isSaving: false,
  openForm: vi.fn(),
  closeForm: vi.fn(),
  savePixel: vi.fn(),
  requestDelete: vi.fn(),
  cancelDelete: vi.fn(),
  confirmDelete: vi.fn(),
  refresh: vi.fn(),
  send: vi.fn(),
  state: {
    value: "ready",
    context: mockLoadedContext,
    matches: vi.fn(),
  },
  isReady: true,
};

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
    mockContextValue.pixels = mockVendorPixels;
    mockContextValue.isLoading = false;
    mockContextValue.isError = false;
    mockContextValue.error = null;
    mockContextValue.deletingPixel = null;
  });

  describe("Rendering", () => {
    it("should render without crashing in loading state", () => {
      mockContextValue.isLoading = true;
      mockContextValue.pixels = [];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should render without crashing in error state", () => {
      mockContextValue.isError = true;
      mockContextValue.error = "Failed to load pixels";
      mockContextValue.pixels = [];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should render without crashing with loaded data", () => {
      mockContextValue.pixels = mockVendorPixels;

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty pixel list", () => {
      mockContextValue.pixels = [];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should handle null error message", () => {
      mockContextValue.isError = true;
      mockContextValue.error = null;
      mockContextValue.pixels = [];

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });

    it("should handle deletingPixel state", () => {
      mockContextValue.deletingPixel = mockVendorPixels[0];
      mockContextValue.pixels = mockVendorPixels;

      expect(() => render(<PixelLibrary />)).not.toThrow();
    });
  });
});
