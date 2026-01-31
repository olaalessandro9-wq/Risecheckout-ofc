/**
 * @file simple-pages.test.tsx
 * @description Tests for simple page components
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";

// Import mocks
import "./_shared";

// ============================================================================
// PixPaymentPage
// ============================================================================

describe("PixPaymentPage", () => {
  it("should export PixPaymentPage component", async () => {
    const module = await import("../PixPaymentPage");
    expect(module.PixPaymentPage).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../PixPaymentPage");
    expect(typeof module.PixPaymentPage).toBe("function");
  });
});

// ============================================================================
// MercadoPagoPayment
// ============================================================================

describe("MercadoPagoPayment", () => {
  it("should export MercadoPagoPayment component", async () => {
    const module = await import("../MercadoPagoPayment");
    expect(module.MercadoPagoPayment).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../MercadoPagoPayment");
    expect(typeof module.MercadoPagoPayment).toBe("function");
  });
});

// ============================================================================
// PaymentLinkRedirect
// ============================================================================

describe("PaymentLinkRedirect", () => {
  it("should export default component", async () => {
    const module = await import("../PaymentLinkRedirect");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../PaymentLinkRedirect");
    expect(typeof module.default).toBe("function");
  });
});

// ============================================================================
// CheckoutCustomizer
// ============================================================================

describe("CheckoutCustomizer", () => {
  it("should export default component", async () => {
    const module = await import("../CheckoutCustomizer");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../CheckoutCustomizer");
    expect(typeof module.default).toBe("function");
  });
});

// ============================================================================
// Rastreamento
// ============================================================================

describe("Rastreamento", () => {
  it("should export default component", async () => {
    const module = await import("../Rastreamento");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../Rastreamento");
    expect(typeof module.default).toBe("function");
  });
});

// ============================================================================
// Webhooks
// ============================================================================

describe("Webhooks", () => {
  it("should export default component", async () => {
    const module = await import("../Webhooks");
    expect(module.default).toBeDefined();
  });

  it("should be a valid React component", async () => {
    const module = await import("../Webhooks");
    expect(typeof module.default).toBe("function");
  });
});
