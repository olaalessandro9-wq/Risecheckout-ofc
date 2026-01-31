/**
 * @file PixelsContext.test.tsx
 * @description Tests for PixelsContext
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { PixelsProvider, usePixelsContext } from "../PixelsContext";
import { mockVendorPixels, mockFacebookPixel, mockPixelFormData } from "../../__tests__/_fixtures";

// Mock XState machine
const mockSend = vi.fn();
const mockState = {
  value: "idle",
  matches: vi.fn((state: string) => state === "idle"),
  context: {
    pixels: [],
    editingPixel: null,
    deletingPixel: null,
    error: null,
    lastRefreshAt: null,
    isFormOpen: false,
    isSaving: false,
  },
};

vi.mock("@xstate/react", () => ({
  useMachine: () => [mockState, mockSend],
}));

// ============================================================================
// TEST SUITE
// ============================================================================

describe("PixelsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock state
    mockState.value = "idle";
    mockState.matches = vi.fn((state: string) => state === "idle");
    mockState.context = {
      pixels: [],
      editingPixel: null,
      deletingPixel: null,
      error: null,
      lastRefreshAt: null,
      isFormOpen: false,
      isSaving: false,
    };
  });

  describe("Provider", () => {
    it("should provide context value to children", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.pixels).toBeDefined();
      expect(result.current.send).toBeDefined();
    });

    it("should throw error when used outside provider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePixelsContext());
      }).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("State Management", () => {
    it("should expose pixels from context", () => {
      mockState.context.pixels = mockVendorPixels;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.pixels).toEqual(mockVendorPixels);
    });

    it("should expose isLoading flag", () => {
      mockState.value = "loading";
      mockState.matches = vi.fn((state: string) => state === "loading");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it("should expose isError flag", () => {
      mockState.value = "error";
      mockState.matches = vi.fn((state: string) => state === "error");
      mockState.context.error = "Failed to load";

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe("Failed to load");
    });

    it("should expose editingPixel", () => {
      mockState.context.editingPixel = mockFacebookPixel;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.editingPixel).toEqual(mockFacebookPixel);
    });
  });

  describe("Actions", () => {
    it("should provide openForm action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.openForm(mockFacebookPixel);

      expect(mockSend).toHaveBeenCalledWith({
        type: "OPEN_FORM",
        pixel: mockFacebookPixel,
      });
    });

    it("should provide closeForm action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.closeForm();

      expect(mockSend).toHaveBeenCalledWith({ type: "CLOSE_FORM" });
    });

    it("should provide savePixel action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.savePixel(mockPixelFormData);

      expect(mockSend).toHaveBeenCalledWith({
        type: "SAVE_PIXEL",
        data: mockPixelFormData,
      });
    });

    it("should provide requestDelete action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.requestDelete(mockFacebookPixel);

      expect(mockSend).toHaveBeenCalledWith({
        type: "REQUEST_DELETE",
        pixel: mockFacebookPixel,
      });
    });

    it("should provide cancelDelete action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.cancelDelete();

      expect(mockSend).toHaveBeenCalledWith({ type: "CANCEL_DELETE" });
    });

    it("should provide confirmDelete action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.confirmDelete();

      expect(mockSend).toHaveBeenCalledWith({ type: "CONFIRM_DELETE" });
    });

    it("should provide refresh action", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      result.current.refresh();

      expect(mockSend).toHaveBeenCalledWith({ type: "REFRESH" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null editingPixel", () => {
      mockState.context.editingPixel = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.editingPixel).toBeNull();
    });

    it("should handle empty pixels array", () => {
      mockState.context.pixels = [];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PixelsProvider>{children}</PixelsProvider>
      );

      const { result } = renderHook(() => usePixelsContext(), { wrapper });

      expect(result.current.pixels).toEqual([]);
    });
  });
});
