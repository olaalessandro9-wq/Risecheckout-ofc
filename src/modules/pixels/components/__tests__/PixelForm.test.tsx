/**
 * @file PixelForm.test.tsx
 * @description Tests for PixelForm component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
import { PixelForm } from "../PixelForm";
import { mockFacebookPixel } from "../../__tests__/_fixtures";
import { createMockPixelsContextValue } from "../../__tests__/_mocks";

// Mock PixelsContext
const mockContextValue = createMockPixelsContextValue();

vi.mock("../../context/PixelsContext", () => ({
  usePixelsContext: () => mockContextValue,
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("PixelForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock context to default state
    Object.assign(mockContextValue, createMockPixelsContextValue({
      context: {
        pixels: [],
        editingPixel: null,
        deletingPixel: null,
        error: null,
        lastRefreshAt: null,
        isFormOpen: false,
        isSaving: false,
      },
    }));
  });

  describe("Rendering", () => {
    it("should render without crashing when form is closed", () => {
      mockContextValue.context.isFormOpen = false;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should render without crashing when form is open", () => {
      mockContextValue.context.isFormOpen = true;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should render without crashing when editing pixel", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = mockFacebookPixel;

      expect(() => render(<PixelForm />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle saving state", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.isSaving = true;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should handle null editingPixel", () => {
      mockContextValue.context.isFormOpen = true;
      mockContextValue.context.editingPixel = null;

      expect(() => render(<PixelForm />)).not.toThrow();
    });
  });
});
