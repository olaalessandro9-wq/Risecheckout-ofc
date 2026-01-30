/**
 * AffiliationContext Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Affiliation Context Provider and Hook.
 * 
 * @module affiliation/context/__tests__
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { AffiliationProvider, useAffiliationContext } from "../AffiliationContext";
import type { AffiliationTabId } from "../../machines";

// Mock @xstate/react
vi.mock("@xstate/react", () => ({ useMachine: vi.fn() }));

// Mock affiliationMachine
vi.mock("../../machines", () => ({
  affiliationMachine: { id: "affiliation", initial: "idle" },
}));

import { useMachine } from "@xstate/react";

// ============================================================================
// FIXTURES
// ============================================================================

const mockAffiliation = {
  id: "aff-123",
  affiliate_code: "CODE123",
  commission_rate: 10,
  status: "active",
  total_sales_count: 5,
  total_sales_amount: 500,
  created_at: "2024-01-01",
  product: { id: "prod-1", name: "Product 1" },
  offers: [],
  checkouts: [],
  producer: null,
  pixels: [],
  pix_gateway: null,
  credit_card_gateway: null,
  allowed_gateways: { pix_allowed: [], credit_card_allowed: [], require_gateway_connection: false },
};

const mockOtherProducts = [{ id: "prod-2", name: "Product 2" }];

const createMockSnapshot = (overrides = {}) => ({
  matches: vi.fn((state: string) => state === "idle"),
  context: {
    affiliationId: null,
    affiliation: null,
    otherProducts: [],
    activeTab: "gateways" as AffiliationTabId,
    tabErrors: {},
    loadError: null,
  },
  ...overrides,
});

const createMockSend = () => vi.fn();

// ============================================================================
// TESTS
// ============================================================================

describe("AffiliationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AffiliationProvider", () => {
    it("renders children", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      render(<AffiliationProvider affiliationId="aff-123"><div>Test Child</div></AffiliationProvider>);
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("calls useMachine with affiliationMachine", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      render(<AffiliationProvider affiliationId="aff-123"><div>Test</div></AffiliationProvider>);
      expect(useMachine).toHaveBeenCalledWith(expect.objectContaining({ id: "affiliation" }));
    });

    it("sends LOAD event when affiliationId is provided", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      render(<AffiliationProvider affiliationId="aff-123"><div>Test</div></AffiliationProvider>);
      expect(mockSend).toHaveBeenCalledWith({ type: "LOAD", affiliationId: "aff-123" });
    });

    it("does not send LOAD when affiliationId is undefined", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      render(<AffiliationProvider affiliationId={undefined}><div>Test</div></AffiliationProvider>);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sends LOAD when affiliationId changes", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const { rerender } = render(<AffiliationProvider affiliationId="aff-123"><div>Test</div></AffiliationProvider>);
      mockSend.mockClear();
      rerender(<AffiliationProvider affiliationId="aff-456"><div>Test</div></AffiliationProvider>);
      expect(mockSend).toHaveBeenCalledWith({ type: "LOAD", affiliationId: "aff-456" });
    });
  });

  describe("useAffiliationContext", () => {
    it("returns context value when inside provider", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      expect(result.current).toBeDefined();
      expect(result.current.state).toBe("idle");
    });

    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useAffiliationContext());
      }).toThrow("useAffiliationContext must be used within an AffiliationProvider");
    });
  });

  describe("Context Value - State Derivation", () => {
    it("derives idle state correctly", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot({ matches: vi.fn((state: string) => state === "idle") });
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId={undefined}>{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      expect(result.current.state).toBe("idle");
      expect(result.current.isLoading).toBe(false);
    });

    it("derives loading state correctly", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot({ matches: vi.fn((state: string) => state === "loading") });
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      expect(result.current.state).toBe("loading");
      expect(result.current.isLoading).toBe(true);
    });

    it("derives ready state correctly", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot({
        matches: vi.fn((state: string) => state === "ready"),
        context: {
          affiliationId: "aff-123",
          affiliation: mockAffiliation,
          otherProducts: mockOtherProducts,
          activeTab: "gateways" as AffiliationTabId,
          tabErrors: {},
          loadError: null,
        },
      });
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      expect(result.current.state).toBe("ready");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.affiliation).toEqual(mockAffiliation);
      expect(result.current.otherProducts).toEqual(mockOtherProducts);
    });

    it("derives error state correctly", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot({
        matches: vi.fn((state: string) => state === "error"),
        context: {
          affiliationId: "aff-123",
          affiliation: null,
          otherProducts: [],
          activeTab: "gateways" as AffiliationTabId,
          tabErrors: {},
          loadError: "Failed to load",
        },
      });
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      expect(result.current.state).toBe("error");
      expect(result.current.error).toBe("Failed to load");
    });
  });

  describe("Context Value - Actions", () => {
    it("setActiveTab sends SET_TAB event", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      result.current.setActiveTab("offers");
      expect(mockSend).toHaveBeenCalledWith({ type: "SET_TAB", tab: "offers" });
    });

    it("setTabError sends SET_TAB_ERROR event", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      result.current.setTabError("pixels", true);
      expect(mockSend).toHaveBeenCalledWith({ type: "SET_TAB_ERROR", tab: "pixels", hasError: true });
    });

    it("clearTabErrors sends CLEAR_TAB_ERRORS event", () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      result.current.clearTabErrors();
      expect(mockSend).toHaveBeenCalledWith({ type: "CLEAR_TAB_ERRORS" });
    });

    it("refetch sends REFRESH event when affiliationId is present", async () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId="aff-123">{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      await result.current.refetch();
      expect(mockSend).toHaveBeenCalledWith({ type: "REFRESH" });
    });

    it("refetch does not send event when affiliationId is undefined", async () => {
      const mockSend = createMockSend();
      const mockSnapshot = createMockSnapshot();
      vi.mocked(useMachine).mockReturnValue([mockSnapshot, mockSend] as any);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AffiliationProvider affiliationId={undefined}>{children}</AffiliationProvider>
      );
      const { result } = renderHook(() => useAffiliationContext(), { wrapper });
      mockSend.mockClear();
      await result.current.refetch();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
