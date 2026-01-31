/**
 * @file BusyProvider.core.test.tsx
 * @description Core tests for BusyProvider (Rendering, Interactions, Error Handling)
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { BusyProvider, useBusy } from "../BusyProvider";
import { renderHook, act } from "@testing-library/react";

// ============================================================================
// MOCKS
// ============================================================================

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className}>Loader2</div>,
}));

// ============================================================================
// TESTS
// ============================================================================

describe("BusyProvider - Core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  describe("Rendering", () => {
    it("should render children without busy modal initially", () => {
      render(<BusyProvider><div data-testid="child">Child Content</div></BusyProvider>);
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    });
    it("should render busy modal when show is called", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Testing"); });
      expect(screen.getByText("Testing")).toBeInTheDocument();
    });
    it("should render default message when no message provided", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show(); });
      expect(screen.getByText("Processando...")).toBeInTheDocument();
    });
    it("should render custom message when provided", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Custom message"); });
      expect(screen.getByText("Custom message")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================
  describe("Interactions", () => {
    it("should hide modal when hide is called", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Testing"); });
      expect(screen.getByText("Testing")).toBeInTheDocument();
      act(() => { result.current.hide(); });
      expect(screen.queryByText("Testing")).not.toBeInTheDocument();
    });
    it("should run async function and auto-hide on success", async () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      const asyncFn = vi.fn().mockResolvedValue("success");
      await act(async () => {
        await result.current.run(asyncFn, "Running");
      });
      expect(asyncFn).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByText("Running")).not.toBeInTheDocument();
      });
    });
    it("should run async function and auto-hide on error", async () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      const asyncFn = vi.fn().mockRejectedValue(new Error("Test error"));
      await act(async () => {
        try {
          await result.current.run(asyncFn, "Running");
        } catch (error) {
          // Expected error
        }
      });
      expect(asyncFn).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByText("Running")).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe("Error Handling", () => {
    it("should throw error when useBusy is used outside provider", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useBusy());
      }).toThrow("useBusy must be used within <BusyProvider>");
      consoleErrorSpy.mockRestore();
    });
    it("should handle empty string message", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show(""); });
      expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    });
    it("should handle multiple show calls", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("First"); });
      expect(screen.getByText("First")).toBeInTheDocument();
      act(() => { result.current.show("Second"); });
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.queryByText("First")).not.toBeInTheDocument();
    });
  });
});
