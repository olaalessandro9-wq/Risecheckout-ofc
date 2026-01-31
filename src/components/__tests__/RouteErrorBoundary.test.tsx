/**
 * @file RouteErrorBoundary.test.tsx
 * @description Tests for RouteErrorBoundary component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { RouteErrorBoundary } from "../RouteErrorBoundary";
import * as ReactRouterDOM from "react-router-dom";

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useRouteError: vi.fn(),
  };
});

// Mock logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock lazyWithRetry
vi.mock("@/lib/lazyWithRetry", () => ({
  isChunkLoadError: vi.fn((error: Error | null) => {
    if (!error) return false;
    return error.message.includes("ChunkLoadError") || 
           error.message.includes("Failed to fetch");
  }),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="error-button" {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  WifiOff: () => <div data-testid="wifi-off-icon">WifiOff</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
}));

// ============================================================================
// TESTS
// ============================================================================

describe("RouteErrorBoundary", () => {
  let reloadSpy: ReturnType<typeof vi.fn>;
  let useRouteErrorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock window.location.reload
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
    // Mock sessionStorage
    const sessionStorageMock: Record<string, string> = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return sessionStorageMock[key] || null;
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      sessionStorageMock[key] = value;
    });
    // Mock useRouteError
    useRouteErrorMock = vi.mocked(ReactRouterDOM.useRouteError);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render error UI for application errors", () => {
      const error = new Error("Application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(screen.getByText("Erro inesperado")).toBeInTheDocument();
      expect(screen.getByText(/Ocorreu um erro. Por favor, tente novamente./)).toBeInTheDocument();
    });

    it("should render network error UI for chunk load errors", () => {
      const error = new Error("ChunkLoadError: Loading chunk failed");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      // Should show recovering state first
      expect(screen.getByText("Reconectando...")).toBeInTheDocument();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should display correct icon for network errors after max attempts", () => {
      const error = new Error("Failed to fetch dynamic import");
      useRouteErrorMock.mockReturnValue(error);
      
      // Simulate max attempts reached
      sessionStorage.setItem("route_error_recovery_attempts", "2");
      sessionStorage.setItem("route_error_recovery_timestamp", String(Date.now()));

      render(<RouteErrorBoundary />);

      expect(screen.getByTestId("wifi-off-icon")).toBeInTheDocument();
      expect(screen.getByText("Problemas de conexão")).toBeInTheDocument();
    });

    it("should display correct icon for application errors", () => {
      const error = new Error("Application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      const refreshIcons = screen.getAllByTestId("refresh-icon");
      expect(refreshIcons.length).toBeGreaterThan(0);
    });

    it("should display error message for non-network errors", () => {
      const error = new Error("Custom application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(screen.getByText("Custom application error")).toBeInTheDocument();
    });

    it("should show recovering state for network errors", () => {
      const error = new Error("ChunkLoadError");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(screen.getByText("Reconectando...")).toBeInTheDocument();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should reload page when button is clicked", () => {
      const error = new Error("Application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      const button = screen.getByTestId("error-button");
      button.click();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // AUTO-RECOVERY
  // ==========================================================================

  describe("Auto-Recovery", () => {
    it("should show recovering state for network errors", () => {
      const error = new Error("ChunkLoadError");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      // Should show recovering state immediately
      expect(screen.getByText("Reconectando...")).toBeInTheDocument();
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });

    it("should increment recovery attempts counter", () => {
      const error = new Error("ChunkLoadError");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        "route_error_recovery_attempts",
        "1"
      );
    });

    it("should stop auto-recovery after max attempts", () => {
      const error = new Error("ChunkLoadError");
      useRouteErrorMock.mockReturnValue(error);
      
      // Simulate max attempts reached
      sessionStorage.setItem("route_error_recovery_attempts", "2");
      sessionStorage.setItem("route_error_recovery_timestamp", String(Date.now()));

      render(<RouteErrorBoundary />);

      // Should NOT show recovering state
      expect(screen.queryByText("Reconectando...")).not.toBeInTheDocument();
      
      // Should show manual error UI
      expect(screen.getByText("Problemas de conexão")).toBeInTheDocument();
    });

    it("should reset counter after 1 minute", () => {
      const error = new Error("ChunkLoadError");
      useRouteErrorMock.mockReturnValue(error);
      
      // Simulate old timestamp (more than 1 minute ago)
      const oldTimestamp = Date.now() - 61000; // 61 seconds ago
      sessionStorage.setItem("route_error_recovery_attempts", "2");
      sessionStorage.setItem("route_error_recovery_timestamp", String(oldTimestamp));

      render(<RouteErrorBoundary />);

      // Should reset and show recovering state again
      expect(screen.getByText("Reconectando...")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle non-Error objects", () => {
      useRouteErrorMock.mockReturnValue("String error");

      render(<RouteErrorBoundary />);

      expect(screen.getByText("Erro inesperado")).toBeInTheDocument();
    });

    it("should display correct button text", () => {
      const error = new Error("Application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    });

    it("should display appropriate help text for network errors", () => {
      const error = new Error("Failed to fetch");
      useRouteErrorMock.mockReturnValue(error);
      
      // Simulate max attempts to show error UI
      sessionStorage.setItem("route_error_recovery_attempts", "2");
      sessionStorage.setItem("route_error_recovery_timestamp", String(Date.now()));

      render(<RouteErrorBoundary />);

      expect(screen.getByText(/Verifique se você está conectado à internet/)).toBeInTheDocument();
    });

    it("should display appropriate help text for application errors", () => {
      const error = new Error("Application error");
      useRouteErrorMock.mockReturnValue(error);

      render(<RouteErrorBoundary />);

      expect(screen.getByText(/Se o problema persistir, entre em contato com o suporte/)).toBeInTheDocument();
    });

    it("should not show error message for network errors", () => {
      const error = new Error("ChunkLoadError: details");
      useRouteErrorMock.mockReturnValue(error);
      
      // Simulate max attempts to show error UI
      sessionStorage.setItem("route_error_recovery_attempts", "2");
      sessionStorage.setItem("route_error_recovery_timestamp", String(Date.now()));

      render(<RouteErrorBoundary />);

      // Error details should NOT be shown for network errors
      expect(screen.queryByText("ChunkLoadError: details")).not.toBeInTheDocument();
    });
  });
});
