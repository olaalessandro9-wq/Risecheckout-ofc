/**
 * @file PixelForm.test.tsx
 * @description Tests for PixelForm component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/utils";
import { PixelForm } from "../PixelForm";
import { mockFacebookPixel } from "../../__tests__/_fixtures";

// Mock PixelsContext with proper structure
const mockContextValue = {
  isFormOpen: false,
  editingPixel: null,
  isSaving: false,
  closeForm: vi.fn(),
  savePixel: vi.fn(),
  pixels: [],
  isLoading: false,
  isError: false,
  error: null,
  deletingPixel: null,
  openForm: vi.fn(),
  requestDelete: vi.fn(),
  cancelDelete: vi.fn(),
  confirmDelete: vi.fn(),
  refresh: vi.fn(),
  send: vi.fn(),
  state: {
    value: "ready",
    context: {
      pixels: [],
      editingPixel: null,
      deletingPixel: null,
      error: null,
      lastRefreshAt: null,
      isFormOpen: false,
      isSaving: false,
    },
    matches: vi.fn(),
  },
  isReady: true,
};

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
    mockContextValue.isFormOpen = false;
    mockContextValue.editingPixel = null;
    mockContextValue.isSaving = false;
  });

  describe("Rendering", () => {
    it("should render without crashing when form is closed", () => {
      mockContextValue.isFormOpen = false;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should render without crashing when form is open", () => {
      mockContextValue.isFormOpen = true;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should render without crashing when editing pixel", () => {
      mockContextValue.isFormOpen = true;
      mockContextValue.editingPixel = mockFacebookPixel;

      expect(() => render(<PixelForm />)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle saving state", () => {
      mockContextValue.isFormOpen = true;
      mockContextValue.isSaving = true;

      expect(() => render(<PixelForm />)).not.toThrow();
    });

    it("should handle null editingPixel", () => {
      mockContextValue.isFormOpen = true;
      mockContextValue.editingPixel = null;

      expect(() => render(<PixelForm />)).not.toThrow();
    });
  });
});
