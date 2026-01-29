/**
 * useTrackingService Hook Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTrackingService } from "./useTrackingService";
import * as UTMify from "@/integrations/tracking/utmify";

vi.mock("@/integrations/tracking/utmify", () => ({
  shouldRunUTMify: vi.fn(),
  extractUTMParameters: vi.fn(),
  trackPurchase: vi.fn(),
  formatDateForUTMify: vi.fn(),
}));

describe("useTrackingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UTMify.extractUTMParameters).mockReturnValue({
      src: "", sck: "", utm_source: "", utm_campaign: "", 
      utm_medium: "", utm_content: "", utm_term: "",
    });
    vi.mocked(UTMify.formatDateForUTMify).mockReturnValue("2024-01-15");
  });

  it("should not fire purchase if vendorId is null", () => {
    vi.mocked(UTMify.shouldRunUTMify).mockReturnValue(true);

    const { result } = renderHook(() =>
      useTrackingService({
        vendorId: null,
        productId: "prod-1",
        productName: "Test Product",
        trackingConfig: {},
      })
    );

    result.current.firePurchase({
      orderId: "order-123",
      totalCents: 9900,
      customerData: { name: "John", email: "john@example.com", phone: "11999999999" },
    });

    expect(UTMify.trackPurchase).not.toHaveBeenCalled();
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
});
