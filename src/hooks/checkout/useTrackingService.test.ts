/**
 * useTrackingService Hook Tests
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Eventos transacionais no backend (SSOT) via _shared/utmify/dispatcher.ts
 * - Eventos comportamentais (InitiateCheckout) no frontend via Pixel CDN
 * 
 * Estes testes verificam que o hook existe e funciona como no-op.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTrackingService } from "./useTrackingService";

describe("useTrackingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return fireInitiateCheckout and firePurchase functions", () => {
    const { result } = renderHook(() =>
      useTrackingService({
        vendorId: "vendor-1",
        productId: "prod-1",
        productName: "Test Product",
        trackingConfig: {},
      })
    );

    expect(typeof result.current.fireInitiateCheckout).toBe("function");
    expect(typeof result.current.firePurchase).toBe("function");
  });

  it("should not throw when firePurchase is called (no-op)", () => {
    const { result } = renderHook(() =>
      useTrackingService({
        vendorId: "vendor-1",
        productId: "prod-1",
        productName: "Test Product",
        trackingConfig: {},
      })
    );

    expect(() => {
      result.current.firePurchase({
        orderId: "order-123",
        totalCents: 9900,
        customerData: { name: "John", email: "john@example.com", phone: "11999999999" },
      });
    }).not.toThrow();
  });

  it("should not throw when vendorId is null", () => {
    const { result } = renderHook(() =>
      useTrackingService({
        vendorId: null,
        productId: "prod-1",
        productName: "Test Product",
        trackingConfig: {},
      })
    );

    expect(() => {
      result.current.firePurchase({
        orderId: "order-123",
        totalCents: 9900,
        customerData: { name: "John", email: "john@example.com", phone: "11999999999" },
      });
    }).not.toThrow();
  });

  it("should accept null utmifyConfig", () => {
    expect(() => {
      renderHook(() =>
        useTrackingService({
          vendorId: "vendor-1",
          productId: "prod-1",
          productName: "Test Product",
          trackingConfig: { utmifyConfig: null },
        })
      );
    }).not.toThrow();
  });

  it("should not throw when fireInitiateCheckout is called (no-op)", () => {
    const { result } = renderHook(() =>
      useTrackingService({
        vendorId: "vendor-1",
        productId: "prod-1",
        productName: "Test Product",
        trackingConfig: {},
      })
    );

    expect(() => {
      result.current.fireInitiateCheckout(new Set(["bump-1"]), []);
    }).not.toThrow();
  });
});
