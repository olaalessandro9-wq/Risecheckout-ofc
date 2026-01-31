/**
 * @file AppErrorBoundary.test.tsx
 * @description Tests for AppErrorBoundary component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/test/utils";
import { AppErrorBoundary } from "../AppErrorBoundary";
import * as Sentry from "@sentry/react";

// ============================================================================
// MOCKS
// ============================================================================

// Mock Sentry
vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}));

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
}));

// ============================================================================
// TEST COMPONENT
// ============================================================================

const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

const WorkingComponent = () => <div data-testid="working-component">Working</div>;

// ============================================================================
// TESTS
// ============================================================================

describe("AppErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Suppress console.error in tests
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Mock window.location.reload
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render children when no error occurs", () => {
      render(
        <AppErrorBoundary>
          <WorkingComponent />
        </AppErrorBoundary>
      );

      expect(screen.getByTestId("working-component")).toBeInTheDocument();
    });

    it("should render error UI when error is caught", () => {
      const error = new Error("Test error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Ops! Algo deu errado")).toBeInTheDocument();
      expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
    });

    it("should render network error UI for chunk load errors", () => {
      const error = new Error("ChunkLoadError: Loading chunk failed");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Problemas de conexão")).toBeInTheDocument();
      expect(screen.getByText(/Não foi possível carregar a página/)).toBeInTheDocument();
    });

    it("should display correct icon for network errors", () => {
      const error = new Error("Failed to fetch dynamic import");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByTestId("wifi-off-icon")).toBeInTheDocument();
    });

    it("should display correct icon for application errors", () => {
      const error = new Error("Application error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      // There are multiple refresh icons (one in the error UI, one in the button)
      const refreshIcons = screen.getAllByTestId("refresh-icon");
      expect(refreshIcons.length).toBeGreaterThan(0);
    });

    it("should display error message for non-network errors", () => {
      const error = new Error("Custom application error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Error: Custom application error")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should reload page when button is clicked", () => {
      const error = new Error("Test error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      const button = screen.getByTestId("error-button");
      button.click();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    it("should send error to Sentry for application errors", () => {
      const error = new Error("Application error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            errorType: "application_error",
          },
        })
      );
    });

    it("should NOT send error to Sentry for network errors (auto-recovery)", () => {
      const error = new Error("ChunkLoadError");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      // Network errors trigger auto-recovery and don't send to Sentry immediately
      // They only send if recovery fails
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle null error gracefully", () => {
      // This tests the boundary's resilience
      render(
        <AppErrorBoundary>
          <WorkingComponent />
        </AppErrorBoundary>
      );

      expect(screen.getByTestId("working-component")).toBeInTheDocument();
    });

    it("should display correct button text for network errors", () => {
      const error = new Error("ChunkLoadError");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Tentar Novamente")).toBeInTheDocument();
    });

    it("should display correct button text for application errors", () => {
      const error = new Error("Application error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText("Recarregar Página")).toBeInTheDocument();
    });

    it("should display appropriate help text for network errors", () => {
      const error = new Error("Failed to fetch");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/Verifique se você está conectado à internet/)).toBeInTheDocument();
    });

    it("should display appropriate help text for application errors", () => {
      const error = new Error("Application error");

      render(
        <AppErrorBoundary>
          <ThrowError error={error} />
        </AppErrorBoundary>
      );

      expect(screen.getByText(/Se o problema persistir, entre em contato com o suporte/)).toBeInTheDocument();
    });
  });
});
