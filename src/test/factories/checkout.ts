/**
 * Checkout Type-Safe Mock Factories
 * 
 * @module test/factories/checkout
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { TextContent, ImageContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";
import type { CheckoutColors } from "@/types/checkoutColors";

export function createMockTextContent(
  overrides: Partial<TextContent> = {}
): TextContent {
  return {
    text: "Default text",
    fontSize: 16,
    color: "#000000",
    alignment: "center",
    ...overrides,
  };
}

export function createMockImageContent(
  overrides: Partial<ImageContent> = {}
): ImageContent {
  return {
    imageUrl: "https://example.com/image.jpg",
    alignment: "center",
    maxWidth: 720,
    ...overrides,
  };
}

export function createMockCheckoutColors(
  overrides: Partial<CheckoutColors> = {}
): CheckoutColors {
  return {
    primaryText: "#333333",
    secondaryText: "#666666",
    background: "#FFFFFF",
    formBackground: "#F5F5F5",
    buttonBackground: "#000000",
    buttonText: "#FFFFFF",
    iconColor: "#333333",
    activeText: "#000000",
    selectedPayment: "#4CAF50",
    boxBg: "#FFFFFF",
    boxHeaderBg: "#F0F0F0",
    boxHeaderPrimaryText: "#333333",
    boxHeaderSecondaryText: "#666666",
    boxPrimaryText: "#333333",
    boxSecondaryText: "#666666",
    ...overrides,
  };
}

export function createMockCheckoutDesign(
  overrides: Partial<CheckoutDesign> = {}
): CheckoutDesign {
  return {
    theme: "default",
    font: "Inter",
    colors: createMockCheckoutColors(overrides.colors),
    ...overrides,
  };
}
