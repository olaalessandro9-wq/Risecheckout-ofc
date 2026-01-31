/**
 * @file BusyProvider.test.tsx
 * @description Tests for BusyProvider component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { BusyProvider, useBusy } from "../BusyProvider";
import { renderHook, act } from "@testing-library/react";
import React from "react";

// ============================================================================
// MOCKS
// ============================================================================

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className}>Loader2</div>,
  Copy: ({ className }: any) => <div data-testid="copy-icon" className={className}>Copy</div>,
  Trash2: ({ className }: any) => <div data-testid="trash-icon" className={className}>Trash2</div>,
  Save: ({ className }: any) => <div data-testid="save-icon" className={className}>Save</div>,
  Upload: ({ className }: any) => <div data-testid="upload-icon" className={className}>Upload</div>,
  Download: ({ className }: any) => <div data-testid="download-icon" className={className}>Download</div>,
}));

// ============================================================================
// TEST COMPONENTS
// ============================================================================

function TestComponent() {
  const busy = useBusy();

  return (
    <div>
      <button onClick={() => busy.show("Testing")}>Show</button>
      <button onClick={() => busy.hide()}>Hide</button>
      <button onClick={() => busy.run(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      }, "Running")}>Run</button>
    </div>
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe("BusyProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render children without busy modal initially", () => {
      render(
        <BusyProvider>
          <div data-testid="child">Child Content</div>
        </BusyProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    });

    it("should render busy modal when show is called", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Testing");
      });

      expect(screen.getByText("Testing")).toBeInTheDocument();
    });

    it("should render default message when no message provided", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show();
      });

      // When no message is provided, state.message is undefined
      // The component uses ?? operator, so "Processando..." is shown
      expect(screen.getByText("Processando...")).toBeInTheDocument();
    });

    it("should render custom message when provided", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Custom message");
      });

      expect(screen.getByText("Custom message")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ICONS
  // ==========================================================================

  describe("Icons", () => {
    it("should render default loader icon for generic messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Generic message");
      });

      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should render copy icon for duplication messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Duplicando produto...");
      });

      expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    });

    it("should render trash icon for deletion messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Excluindo item...");
      });

      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("should render save icon for saving messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Salvando alterações...");
      });

      expect(screen.getByTestId("save-icon")).toBeInTheDocument();
    });

    it("should render upload icon for upload messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Enviando arquivo...");
      });

      expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
    });

    it("should render download icon for download messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Baixando arquivo...");
      });

      expect(screen.getByTestId("download-icon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DESCRIPTIONS
  // ==========================================================================

  describe("Descriptions", () => {
    it("should render default description for generic messages", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Generic");
      });

      // getDescriptionForMessage returns default for messages that don't match patterns
      expect(screen.getByText(/Aguarde enquanto processamos/)).toBeInTheDocument();
    });

    it("should render specific description for duplication", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Duplicando produto");
      });

      expect(screen.getByText(/Criando uma cópia completa do produto/)).toBeInTheDocument();
    });

    it("should render specific description for deletion", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Excluindo produto");
      });

      expect(screen.getByText(/Removendo o produto e desativando todos os checkouts/)).toBeInTheDocument();
    });

    it("should render specific description for saving", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Salvando dados");
      });

      expect(screen.getByText(/Salvando suas alterações no banco de dados/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should hide modal when hide is called", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Testing");
      });
      expect(screen.getByText("Testing")).toBeInTheDocument();

      act(() => {
        result.current.hide();
      });
      expect(screen.queryByText("Testing")).not.toBeInTheDocument();
    });

    it("should show and hide modal automatically with run method", async () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      const mockFn = vi.fn().mockResolvedValue("result");

      act(() => {
        result.current.run(mockFn, "Running task");
      });

      // Should show modal
      expect(screen.getByText("Running task")).toBeInTheDocument();

      // Wait for async operation to complete
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalled();
      });

      // Should hide modal after completion
      await waitFor(() => {
        expect(screen.queryByText("Running task")).not.toBeInTheDocument();
      });
    });

    it("should hide modal even if run method throws error", async () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));

      await act(async () => {
        try {
          await result.current.run(mockFn, "Running task");
        } catch (error) {
          // Expected error
        }
      });

      // Should hide modal after error
      await waitFor(() => {
        expect(screen.queryByText("Running task")).not.toBeInTheDocument();
      });
    });

    it("should return result from run method", async () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      const mockFn = vi.fn().mockResolvedValue("test-result");

      let returnValue: string | undefined;
      await act(async () => {
        returnValue = await result.current.run(mockFn, "Running");
      });

      expect(returnValue).toBe("test-result");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should throw error when useBusy is used outside provider", () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useBusy());
      }).toThrow("useBusy must be used within <BusyProvider>");

      consoleErrorSpy.mockRestore();
    });

    it("should render footer warning text", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("Testing");
      });

      expect(screen.getByText("Por favor, não feche esta janela")).toBeInTheDocument();
    });

    it("should handle multiple show calls", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("First message");
      });

      expect(screen.getByText("First message")).toBeInTheDocument();

      act(() => {
        result.current.show("Second message");
      });

      expect(screen.queryByText("First message")).not.toBeInTheDocument();
      expect(screen.getByText("Second message")).toBeInTheDocument();
    });

    it("should handle empty string message", () => {
      const { result } = renderHook(() => useBusy(), {
        wrapper: BusyProvider,
      });

      act(() => {
        result.current.show("");
      });

      // Empty string is a falsy value, but the component uses ?? operator
      // which only checks for null/undefined, so empty string is rendered as-is
      // The modal should be visible but with empty title
      expect(screen.getByText("Por favor, não feche esta janela")).toBeInTheDocument();
    });
  });
});
