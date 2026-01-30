/**
 * useContextSwitcher.test.ts
 * 
 * Tests for useContextSwitcher hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

const mockSwitchToProducer = vi.fn();
const mockSwitchToBuyer = vi.fn();
const mockSwitchContext = vi.fn();

vi.mock("@/hooks/useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    activeRole: "user",
    roles: ["user", "buyer"],
    canSwitchToProducer: true,
    canSwitchToBuyer: true,
    switchToProducer: mockSwitchToProducer,
    switchToBuyer: mockSwitchToBuyer,
    switchContext: mockSwitchContext,
    isSwitching: false,
  })),
}));

import { useContextSwitcher } from "../useContextSwitcher";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { toast } from "sonner";

describe("useContextSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSwitchToProducer.mockResolvedValue({ success: true });
    mockSwitchToBuyer.mockResolvedValue({ success: true });
    mockSwitchContext.mockResolvedValue({ success: true });
  });

  it("should return current context state", () => {
    const { result } = renderHook(() => useContextSwitcher());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.activeRole).toBe("user");
    expect(result.current.canSwitchToProducer).toBe(true);
    expect(result.current.canSwitchToBuyer).toBe(true);
  });

  describe("goToProducerPanel", () => {
    it("should navigate to auth when not authenticated", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: false,
        activeRole: null,
        roles: [],
        canSwitchToProducer: false,
        canSwitchToBuyer: false,
        switchToProducer: mockSwitchToProducer,
        switchToBuyer: mockSwitchToBuyer,
        switchContext: mockSwitchContext,
        isSwitching: false,
      } as unknown as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useContextSwitcher());

      await act(async () => {
        await result.current.goToProducerPanel();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });

    it("should show error when user cannot switch to producer", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        isAuthenticated: true,
        isLoading: false,
        activeRole: "buyer",
        roles: ["buyer"],
        canSwitchToProducer: false,
        canSwitchToBuyer: true,
        switchToProducer: mockSwitchToProducer,
        switchToBuyer: mockSwitchToBuyer,
        switchContext: mockSwitchContext,
        isSwitching: false,
      } as unknown as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useContextSwitcher());

      await act(async () => {
        await result.current.goToProducerPanel();
      });

      expect(toast.error).toHaveBeenCalledWith("Você não tem acesso ao painel do produtor");
    });

    it("should navigate to dashboard when already producer", async () => {

      const { result } = renderHook(() => useContextSwitcher());

      await act(async () => {
        await result.current.goToProducerPanel();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      // Should not call switch since already in producer context
      expect(mockSwitchToProducer).not.toHaveBeenCalled();
    });
  });

  describe("goToStudentPanel", () => {
    it("should navigate to minha-conta when not authenticated", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: false,
        activeRole: null,
        roles: [],
        canSwitchToProducer: false,
        canSwitchToBuyer: false,
        switchToProducer: mockSwitchToProducer,
        switchToBuyer: mockSwitchToBuyer,
        switchContext: mockSwitchContext,
        isSwitching: false,
      } as unknown as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useContextSwitcher());

      await act(async () => {
        await result.current.goToStudentPanel();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/minha-conta");
    });

    it("should switch to buyer and navigate", async () => {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        isAuthenticated: true,
        isLoading: false,
        activeRole: "user",
        roles: ["user", "buyer"],
        canSwitchToProducer: true,
        canSwitchToBuyer: true,
        switchToProducer: mockSwitchToProducer,
        switchToBuyer: mockSwitchToBuyer,
        switchContext: mockSwitchContext,
        isSwitching: false,
      } as unknown as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useContextSwitcher());

      await act(async () => {
        await result.current.goToStudentPanel();
      });

      expect(mockSwitchToBuyer).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/minha-conta/dashboard");
    });
  });

  describe("getRoleDisplayName", () => {
    it("should return correct display names", () => {
      const { result } = renderHook(() => useContextSwitcher());

      expect(result.current.getRoleDisplayName("owner")).toBe("Proprietário");
      expect(result.current.getRoleDisplayName("admin")).toBe("Administrador");
      expect(result.current.getRoleDisplayName("user")).toBe("Produtor");
      expect(result.current.getRoleDisplayName("seller")).toBe("Afiliado");
      expect(result.current.getRoleDisplayName("buyer")).toBe("Aluno");
    });
  });

  describe("currentContextName", () => {
    it("should return display name for active role", () => {
      const { result } = renderHook(() => useContextSwitcher());

      expect(result.current.currentContextName).toBe("Produtor");
    });
  });
});
