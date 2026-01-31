/**
 * Checkout Type-Safe Mock Factories
 * 
 * @module test/factories/checkout
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import type { TextContent, ImageContent } from "@/types/checkout-components.types";
import type { CheckoutDesign } from "@/types/checkoutEditor";
import type { 
  CheckoutColors, 
  ButtonColors, 
  BoxColors, 
  FieldColors,
  OrderSummaryColors,
  FooterColors,
  SecurePurchaseColors,
  OrderBumpColors,
  InfoBoxColors,
} from "@/types/checkoutColors";

// ============================================================================
// HELPER FACTORIES
// ============================================================================

function createMockButtonColors(overrides: Partial<ButtonColors> = {}): ButtonColors {
  return {
    background: "#F5F5F5",
    text: "#333333",
    icon: "#666666",
    ...overrides,
  };
}

function createMockBoxColors(overrides: Partial<BoxColors> = {}): BoxColors {
  return {
    headerBg: "#F0F0F0",
    headerPrimaryText: "#333333",
    headerSecondaryText: "#666666",
    bg: "#FFFFFF",
    primaryText: "#333333",
    secondaryText: "#666666",
    ...overrides,
  };
}

function createMockFieldColors(overrides: Partial<FieldColors> = {}): FieldColors {
  return {
    textColor: "#333333",
    placeholderColor: "#999999",
    borderColor: "#DDDDDD",
    backgroundColor: "#FFFFFF",
    focusBorderColor: "#4CAF50",
    focusTextColor: "#333333",
    ...overrides,
  };
}

function createMockOrderSummaryColors(
  overrides: Partial<OrderSummaryColors> = {}
): OrderSummaryColors {
  return {
    background: "#F5F5F5",
    titleText: "#333333",
    productName: "#333333",
    priceText: "#4CAF50",
    labelText: "#666666",
    borderColor: "#DDDDDD",
    ...overrides,
  };
}

function createMockFooterColors(overrides: Partial<FooterColors> = {}): FooterColors {
  return {
    background: "#333333",
    primaryText: "#FFFFFF",
    secondaryText: "#CCCCCC",
    border: "#444444",
    ...overrides,
  };
}

function createMockSecurePurchaseColors(
  overrides: Partial<SecurePurchaseColors> = {}
): SecurePurchaseColors {
  return {
    headerBackground: "#E8F5E9",
    headerText: "#4CAF50",
    cardBackground: "#FFFFFF",
    primaryText: "#333333",
    secondaryText: "#666666",
    linkText: "#4CAF50",
    ...overrides,
  };
}

function createMockOrderBumpColors(
  overrides: Partial<OrderBumpColors> = {}
): OrderBumpColors {
  return {
    headerBackground: "#FFF3E0",
    headerText: "#E65100",
    footerBackground: "#FFFFFF",
    footerText: "#333333",
    contentBackground: "#FFFBF5",
    titleText: "#333333",
    descriptionText: "#666666",
    priceText: "#4CAF50",
    ...overrides,
  };
}

function createMockInfoBoxColors(overrides: Partial<InfoBoxColors> = {}): InfoBoxColors {
  return {
    background: "#E3F2FD",
    border: "#90CAF9",
    text: "#1565C0",
    ...overrides,
  };
}

// ============================================================================
// CONTENT FACTORIES
// ============================================================================

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

// ============================================================================
// CHECKOUT COLORS FACTORY
// ============================================================================

export function createMockCheckoutColors(
  overrides: Partial<CheckoutColors> = {}
): CheckoutColors {
  return {
    background: "#FFFFFF",
    primaryText: "#333333",
    secondaryText: "#666666",
    active: "#4CAF50",
    icon: "#333333",
    formBackground: "#F5F5F5",
    border: "#DDDDDD",
    placeholder: "#999999",
    inputBackground: "#FFFFFF",
    unselectedButton: createMockButtonColors(),
    selectedButton: createMockButtonColors({ background: "#4CAF50", text: "#FFFFFF" }),
    box: createMockBoxColors(),
    unselectedBox: createMockBoxColors(),
    selectedBox: createMockBoxColors({ bg: "#E8F5E9" }),
    button: { background: "#000000", text: "#FFFFFF" },
    orderSummary: createMockOrderSummaryColors(),
    footer: createMockFooterColors(),
    securePurchase: createMockSecurePurchaseColors(),
    orderBump: createMockOrderBumpColors(),
    creditCardFields: createMockFieldColors(),
    personalDataFields: createMockFieldColors(),
    infoBox: createMockInfoBoxColors(),
    productPrice: "#4CAF50",
    ...overrides,
  };
}

// ============================================================================
// CHECKOUT DESIGN FACTORY
// ============================================================================

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
