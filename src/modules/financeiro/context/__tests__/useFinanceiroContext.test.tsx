/**
 * useFinanceiroContext Hook Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for useFinanceiroContext hook covering:
 * - Hook usage within provider
 * - Error when used outside provider
 * - Context value access
 * - Type safety
 *
 * @module modules/financeiro/context/__tests__/useFinanceiroContext.test
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { FinanceiroProvider, useFinanceiroContext } from "../FinanceiroContext";
import type { ReactNode } from "react";

// Mock XState - using correct property name: lastConnectedAt (not lastSync)
const mockSend = vi.fn();
const mockState = {
  value: "ready",
  context: {
    connectionStatuses: {
      asaas: { id: "asaas", connected: true, mode: "production", lastConnectedAt: new Date().toISOString() },
      pushinpay: { id: "pushinpay", connected: false, mode: null, lastConnectedAt: null },
      mercadopago: { id: "mercadopago", connected: true, mode: "production", lastConnectedAt: new Date().toISOString() },
      stripe: { id: "stripe", connected: false, mode: null, lastConnectedAt: null },
    },
    selectedGateway: "asaas",
    error: null,
  },
  matches: vi.fn((value: string) => mockState.value === value),
};

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}));

describe("useFinanceiroContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>
      <FinanceiroProvider>{children}</FinanceiroProvider>
    </BrowserRouter>
  );

  describe("Hook Usage", () => {
    it("returns context value when used within provider", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.send).toBeDefined();
    });

    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useFinanceiroContext());
      }).toThrow("useFinanceiroContext must be used within FinanceiroProvider");

      console.error = originalError;
    });
  });

  describe("Context Value Access", () => {
    it("provides state value", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.state.value).toBe("ready");
    });

    it("provides state context", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.state.context).toBeDefined();
      expect(result.current.state.context.connectionStatuses).toBeDefined();
    });

    it("provides state matches function", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(typeof result.current.state.matches).toBe("function");
      expect(result.current.state.matches("ready")).toBe(true);
    });

    it("provides send function", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(typeof result.current.send).toBe("function");
    });

    it("provides isLoading helper", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(typeof result.current.isLoading).toBe("boolean");
    });

    it("provides isReady helper", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(typeof result.current.isReady).toBe("boolean");
      expect(result.current.isReady).toBe(true);
    });

    it("provides isError helper", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(typeof result.current.isError).toBe("boolean");
    });

    it("provides selectedGateway", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.selectedGateway).toBe("asaas");
    });

    it("provides connectionStatuses", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.connectionStatuses).toBeDefined();
      expect(result.current.connectionStatuses.asaas).toBeDefined();
      expect(result.current.connectionStatuses.asaas.connected).toBe(true);
    });
  });

  describe("Helper Values", () => {
    it("isLoading is false when state is ready", () => {
      mockState.value = "ready";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it("isLoading is true when state is loading", () => {
      mockState.value = "loading";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it("isReady is true when state is ready", () => {
      mockState.value = "ready";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isReady).toBe(true);
    });

    it("isReady is false when state is loading", () => {
      mockState.value = "loading";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isReady).toBe(false);
    });

    it("isError is true when state is error", () => {
      mockState.value = "error";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isError).toBe(true);
    });

    it("isError is false when state is ready", () => {
      mockState.value = "ready";

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.isError).toBe(false);
    });
  });

  describe("Connection Statuses", () => {
    it("provides all gateway connection statuses", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.connectionStatuses.asaas).toBeDefined();
      expect(result.current.connectionStatuses.pushinpay).toBeDefined();
      expect(result.current.connectionStatuses.mercadopago).toBeDefined();
      expect(result.current.connectionStatuses.stripe).toBeDefined();
    });

    it("reflects connected status correctly", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.connectionStatuses.asaas.connected).toBe(true);
      expect(result.current.connectionStatuses.pushinpay.connected).toBe(false);
    });

    it("provides lastConnectedAt timestamps", () => {
      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.connectionStatuses.asaas.lastConnectedAt).toBeTruthy();
      expect(result.current.connectionStatuses.pushinpay.lastConnectedAt).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles null selectedGateway", () => {
      mockState.context.selectedGateway = null;

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.selectedGateway).toBeNull();
    });

    it("handles all gateways disconnected", () => {
      mockState.context.connectionStatuses = {
        asaas: { id: "asaas", connected: false, mode: null, lastConnectedAt: null },
        pushinpay: { id: "pushinpay", connected: false, mode: null, lastConnectedAt: null },
        mercadopago: { id: "mercadopago", connected: false, mode: null, lastConnectedAt: null },
        stripe: { id: "stripe", connected: false, mode: null, lastConnectedAt: null },
      };

      const { result } = renderHook(() => useFinanceiroContext(), { wrapper });

      expect(result.current.connectionStatuses.asaas.connected).toBe(false);
      expect(result.current.connectionStatuses.pushinpay.connected).toBe(false);
      expect(result.current.connectionStatuses.mercadopago.connected).toBe(
        false
      );
      expect(result.current.connectionStatuses.stripe.connected).toBe(false);
    });
  });
});
