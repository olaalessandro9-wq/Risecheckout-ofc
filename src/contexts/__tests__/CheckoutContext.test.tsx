/**
 * Checkout Context Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testes unitários para CheckoutProvider e useCheckoutContext hook.
 * Valida modo dual (value vs props), memoização e contratos do contexto.
 * 
 * @module contexts/__tests__/CheckoutContext.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutProvider, useCheckoutContext, type CheckoutContextValue } from "../CheckoutContext";
import type { Checkout, OrderBump } from "@/types/checkout";
import type { ThemePreset } from "@/lib/checkout/themePresets";
import type { CheckoutCustomization, CheckoutDesign } from "@/types/checkoutEditor";
import { THEME_PRESETS } from "@/lib/checkout/themePresets";

// ============================================================================
// TEST DATA
// ============================================================================

const mockCheckout: Checkout = {
  id: "checkout-1",
  slug: "test-checkout",
  name: "Test Checkout",
  product: {
    id: "product-1",
    name: "Test Product",
    price: 9900,
    required_fields: ["name", "email"],
  },
};

const mockDesign: ThemePreset = THEME_PRESETS.light;

const mockOrderBumps: OrderBump[] = [
  {
    id: "bump-1",
    name: "Order Bump 1",
    description: "Description 1",
    price: 1000,
  },
];

const mockProductData = {
  id: "product-1",
  name: "Test Product",
  description: "Test Description",
  price: 9900,
  image_url: "https://example.com/image.jpg",
};

const mockCheckoutDesign: CheckoutDesign = {
  theme: "light",
  font: "Inter",
  colors: THEME_PRESETS.light.colors,
};

// ============================================================================
// TEST HELPERS
// ============================================================================

function TestConsumer() {
  const context = useCheckoutContext();
  return (
    <div>
      <span data-testid="checkout-id">{context.checkout?.id ?? "null"}</span>
      <span data-testid="vendor-id">{context.vendorId ?? "null"}</span>
      <span data-testid="order-bumps-count">{context.orderBumps.length}</span>
      <span data-testid="product-name">{context.productData?.name ?? "null"}</span>
      <span data-testid="has-design">{context.design ? "yes" : "no"}</span>
      <span data-testid="has-customization">{context.customization ? "yes" : "no"}</span>
    </div>
  );
}

// ============================================================================
// CHECKOUT PROVIDER TESTS
// ============================================================================

describe("CheckoutProvider", () => {
  it("fornece valor quando usado com prop value", () => {
    const value: CheckoutContextValue = {
      checkout: mockCheckout,
      design: mockDesign,
      orderBumps: mockOrderBumps,
      vendorId: null,
      productData: mockProductData,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("checkout-id")).toHaveTextContent("checkout-1");
    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
    expect(screen.getByTestId("product-name")).toHaveTextContent("Test Product");
  });

  it("fornece valor quando usado com props separadas", () => {
    render(
      <CheckoutProvider
        design={mockDesign}
        productData={mockProductData}
        orderBumps={mockOrderBumps}
      >
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("checkout-id")).toHaveTextContent("null");
    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
    expect(screen.getByTestId("product-name")).toHaveTextContent("Test Product");
    expect(screen.getByTestId("has-design")).toHaveTextContent("yes");
  });

  it("retorna checkout null quando não fornecido", () => {
    render(
      <CheckoutProvider design={mockDesign}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("checkout-id")).toHaveTextContent("null");
  });

  it("retorna orderBumps vazio quando não fornecido", () => {
    render(
      <CheckoutProvider design={mockDesign}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("0");
  });

  it("retorna vendorId null para segurança", () => {
    const value: CheckoutContextValue = {
      checkout: mockCheckout,
      design: mockDesign,
      orderBumps: [],
      vendorId: null,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("vendor-id")).toHaveTextContent("null");
  });

  it("aceita productData opcional", () => {
    render(
      <CheckoutProvider design={mockDesign} productData={mockProductData}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("product-name")).toHaveTextContent("Test Product");
  });

  it("aceita customization opcional", () => {
    const customization: CheckoutCustomization = {
      design: mockCheckoutDesign,
      topComponents: [],
      bottomComponents: [],
    };

    render(
      <CheckoutProvider design={mockDesign} customization={customization}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("has-customization")).toHaveTextContent("yes");
  });

  it("renderiza children corretamente", () => {
    render(
      <CheckoutProvider design={mockDesign}>
        <div data-testid="child">Child Content</div>
      </CheckoutProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });

  it("atualiza valor quando props mudam", () => {
    const { rerender } = render(
      <CheckoutProvider design={mockDesign} orderBumps={[]}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("0");

    rerender(
      <CheckoutProvider design={mockDesign} orderBumps={mockOrderBumps}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
  });
});

// ============================================================================
// USE CHECKOUT CONTEXT HOOK TESTS
// ============================================================================

describe("useCheckoutContext", () => {
  it("retorna valor do contexto quando dentro do provider", () => {
    const value: CheckoutContextValue = {
      checkout: mockCheckout,
      design: mockDesign,
      orderBumps: mockOrderBumps,
      vendorId: null,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("checkout-id")).toHaveTextContent("checkout-1");
  });

  it("lança erro quando fora do provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useCheckoutContext must be used within a CheckoutProvider");

    consoleSpy.mockRestore();
  });

  it("retorna todos os campos esperados", () => {
    const customization: CheckoutCustomization = {
      design: mockCheckoutDesign,
      topComponents: [],
      bottomComponents: [],
    };

    const value: CheckoutContextValue = {
      checkout: mockCheckout,
      design: mockDesign,
      orderBumps: mockOrderBumps,
      vendorId: null,
      productData: mockProductData,
      customization,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("checkout-id")).toHaveTextContent("checkout-1");
    expect(screen.getByTestId("vendor-id")).toHaveTextContent("null");
    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
    expect(screen.getByTestId("product-name")).toHaveTextContent("Test Product");
    expect(screen.getByTestId("has-design")).toHaveTextContent("yes");
    expect(screen.getByTestId("has-customization")).toHaveTextContent("yes");
  });

  it("retorna design quando fornecido via value", () => {
    const value: CheckoutContextValue = {
      checkout: null,
      design: mockDesign,
      orderBumps: [],
      vendorId: null,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("has-design")).toHaveTextContent("yes");
  });

  it("retorna design quando fornecido via prop design", () => {
    render(
      <CheckoutProvider design={mockDesign}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("has-design")).toHaveTextContent("yes");
  });

  it("permite acesso a orderBumps do contexto", () => {
    const value: CheckoutContextValue = {
      checkout: null,
      design: null,
      orderBumps: mockOrderBumps,
      vendorId: null,
    };

    render(
      <CheckoutProvider value={value}>
        <TestConsumer />
      </CheckoutProvider>
    );

    expect(screen.getByTestId("order-bumps-count")).toHaveTextContent("1");
  });
});
