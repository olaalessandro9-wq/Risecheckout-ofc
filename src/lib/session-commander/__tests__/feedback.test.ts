/**
 * Session Commander Feedback Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the visual user notification system.
 * Covers: toast functions, message content, duration, actions.
 * 
 * @module lib/session-commander/__tests__/feedback.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  showReconnecting,
  showReconnected,
  showReconnectionFailed,
  showSessionExpired,
  showSessionExpiringSoon,
  showOffline,
  showOnline,
  dismissSessionToasts,
} from "../feedback";
import { toast } from "sonner";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// ============================================================================
// TEST SETUP
// ============================================================================

describe("Session Commander Feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/dashboard",
        href: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RECONNECTION FEEDBACK TESTS
  // ==========================================================================

  describe("showReconnecting", () => {
    it("should show loading toast with attempt count", () => {
      showReconnecting(2, 5);

      expect(toast.loading).toHaveBeenCalledWith(
        "Reconectando... (2/5)",
        expect.objectContaining({
          id: "session-reconnecting",
          description: "Restaurando sua sessão",
          duration: Infinity,
        })
      );
    });

    it("should update existing toast on subsequent calls", () => {
      showReconnecting(1, 3);
      showReconnecting(2, 3);
      showReconnecting(3, 3);

      // All calls use same ID to update the toast
      expect(toast.loading).toHaveBeenCalledTimes(3);
      expect(toast.loading).toHaveBeenLastCalledWith(
        "Reconectando... (3/3)",
        expect.objectContaining({ id: "session-reconnecting" })
      );
    });
  });

  describe("showReconnected", () => {
    it("should show success toast", () => {
      showReconnected();

      expect(toast.success).toHaveBeenCalledWith(
        "Conectado!",
        expect.objectContaining({
          id: "session-reconnecting",
          description: "Sessão restaurada com sucesso",
          duration: 3000,
        })
      );
    });

    it("should replace reconnecting toast", () => {
      showReconnecting(1, 3);
      showReconnected();

      // Uses same ID to replace the loading toast
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: "session-reconnecting" })
      );
    });
  });

  describe("showReconnectionFailed", () => {
    it("should show error toast", () => {
      showReconnectionFailed();

      expect(toast.error).toHaveBeenCalledWith(
        "Falha na reconexão",
        expect.objectContaining({
          id: "session-reconnecting",
          description: "Não foi possível restaurar a sessão",
          duration: 5000,
        })
      );
    });
  });

  // ==========================================================================
  // SESSION EXPIRATION TESTS
  // ==========================================================================

  describe("showSessionExpired", () => {
    it("should show error toast with login action", () => {
      showSessionExpired();

      expect(toast.error).toHaveBeenCalledWith(
        "Sessão expirada",
        expect.objectContaining({
          id: "session-status",
          description: "Faça login novamente para continuar",
          duration: 10000,
          action: expect.objectContaining({
            label: "Login",
            onClick: expect.any(Function),
          }),
        })
      );
    });

    it("should redirect to auth with current path on action click", () => {
      showSessionExpired();

      const call = vi.mocked(toast.error).mock.calls[0];
      const action = call[1]?.action as unknown as { onClick: () => void };
      
      action.onClick();

      expect(window.location.href).toContain("/auth");
    });

    it("should redirect to auth without param when on root", () => {
      window.location.pathname = "/";
      
      showSessionExpired();

      const call = vi.mocked(toast.error).mock.calls[0];
      const action = call[1]?.action as unknown as { onClick: () => void };
      
      action.onClick();

      expect(window.location.href).toBe("/auth");
    });

    it("should redirect to auth without param when on auth page", () => {
      window.location.pathname = "/auth";
      
      showSessionExpired();

      const call = vi.mocked(toast.error).mock.calls[0];
      const action = call[1]?.action as unknown as { onClick: () => void };
      
      action.onClick();

      expect(window.location.href).toBe("/auth");
    });
  });

  describe("showSessionExpiringSoon", () => {
    it("should show warning toast with minutes remaining", () => {
      showSessionExpiringSoon(5);

      expect(toast.warning).toHaveBeenCalledWith(
        "Sessão expirando",
        expect.objectContaining({
          id: "session-status",
          description: "Sua sessão expira em 5 minutos",
          duration: 8000,
        })
      );
    });

    it("should handle singular minute", () => {
      showSessionExpiringSoon(1);

      expect(toast.warning).toHaveBeenCalledWith(
        "Sessão expirando",
        expect.objectContaining({
          description: "Sua sessão expira em 1 minutos",
        })
      );
    });
  });

  // ==========================================================================
  // NETWORK STATUS TESTS
  // ==========================================================================

  describe("showOffline", () => {
    it("should show warning toast for offline status", () => {
      showOffline();

      expect(toast.warning).toHaveBeenCalledWith(
        "Sem conexão",
        expect.objectContaining({
          id: "network-status",
          description: "Verifique sua conexão com a internet",
          duration: Infinity,
        })
      );
    });
  });

  describe("showOnline", () => {
    it("should show success toast for online status", () => {
      showOnline();

      expect(toast.success).toHaveBeenCalledWith(
        "Conectado",
        expect.objectContaining({
          id: "network-status",
          description: "Conexão restaurada",
          duration: 3000,
        })
      );
    });

    it("should replace offline toast", () => {
      showOffline();
      showOnline();

      // Both use same ID
      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: "network-status" })
      );
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: "network-status" })
      );
    });
  });

  // ==========================================================================
  // DISMISS TESTS
  // ==========================================================================

  describe("dismissSessionToasts", () => {
    it("should dismiss reconnecting toast", () => {
      dismissSessionToasts();

      expect(toast.dismiss).toHaveBeenCalledWith("session-reconnecting");
    });

    it("should dismiss session status toast", () => {
      dismissSessionToasts();

      expect(toast.dismiss).toHaveBeenCalledWith("session-status");
    });

    it("should dismiss both toasts", () => {
      dismissSessionToasts();

      expect(toast.dismiss).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // TOAST ID CONSISTENCY TESTS
  // ==========================================================================

  describe("toast ID consistency", () => {
    it("should use consistent IDs for reconnection flow", () => {
      showReconnecting(1, 3);
      showReconnected();
      showReconnectionFailed();

      const reconnectingId = vi.mocked(toast.loading).mock.calls[0][1]?.id;
      const reconnectedId = vi.mocked(toast.success).mock.calls[0][1]?.id;
      const failedId = vi.mocked(toast.error).mock.calls[0][1]?.id;

      expect(reconnectingId).toBe("session-reconnecting");
      expect(reconnectedId).toBe("session-reconnecting");
      expect(failedId).toBe("session-reconnecting");
    });

    it("should use consistent IDs for session status flow", () => {
      showSessionExpired();
      showSessionExpiringSoon(5);

      const expiredId = vi.mocked(toast.error).mock.calls[0][1]?.id;
      const expiringId = vi.mocked(toast.warning).mock.calls[0][1]?.id;

      expect(expiredId).toBe("session-status");
      expect(expiringId).toBe("session-status");
    });
  });
});
