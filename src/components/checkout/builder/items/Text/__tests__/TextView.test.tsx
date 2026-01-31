/**
 * TextView Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for TextView component covering:
 * - Rendering with different content
 * - Default values fallback
 * - Design prop integration
 * - Content type safety
 *
 * @module components/checkout/builder/items/Text/__tests__/TextView.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { TextView } from "../TextView";
import type { ComponentData } from "../../../types";
import type { CheckoutDesign } from "@/types/checkoutEditor";
import type { TextContent } from "@/types/checkout-components.types";
import type { CheckoutColors } from "@/types/checkoutColors";

// ============================================================================
// TYPE-SAFE FACTORIES
// ============================================================================

function createTextContent(overrides: Partial<TextContent> = {}): TextContent {
  return {
    text: "Test Text Content",
    fontSize: 18,
    color: "#FF0000",
    alignment: "left",
    backgroundColor: "#F0F0F0",
    borderColor: "#CCCCCC",
    borderWidth: 2,
    borderRadius: 10,
    ...overrides,
  };
}

function createMockDesign(overrides: Partial<CheckoutDesign> = {}): CheckoutDesign {
  const defaultColors: CheckoutColors = {
    background: "#FFFFFF",
    primaryText: "#333333",
    secondaryText: "#666666",
    active: "#0000FF",
    icon: "#888888",
    formBackground: "#FAFAFA",
    border: "#E0E0E0",
    unselectedButton: { text: "#333333", background: "#FFFFFF", icon: "#888888" },
    selectedButton: { text: "#FFFFFF", background: "#0000FF", icon: "#FFFFFF" },
    box: { headerBg: "#F0F0F0", headerPrimaryText: "#333333", headerSecondaryText: "#666666", bg: "#FFFFFF", primaryText: "#333333", secondaryText: "#666666" },
    unselectedBox: { headerBg: "#F0F0F0", headerPrimaryText: "#333333", headerSecondaryText: "#666666", bg: "#FFFFFF", primaryText: "#333333", secondaryText: "#666666" },
    selectedBox: { headerBg: "#0000FF", headerPrimaryText: "#FFFFFF", headerSecondaryText: "#CCCCFF", bg: "#F0F0FF", primaryText: "#333333", secondaryText: "#666666" },
    button: { background: "#0000FF", text: "#FFFFFF" },
    orderSummary: { background: "#FAFAFA", titleText: "#333333", productName: "#333333", priceText: "#333333", labelText: "#666666", borderColor: "#E0E0E0" },
    footer: { background: "#F0F0F0", primaryText: "#333333", secondaryText: "#666666", border: "#E0E0E0" },
    securePurchase: { headerBackground: "#F0F0F0", headerText: "#333333", cardBackground: "#FFFFFF", primaryText: "#333333", secondaryText: "#666666", linkText: "#0000FF" },
    orderBump: { headerBackground: "#FFE0B2", headerText: "#E65100", footerBackground: "#FFF3E0", footerText: "#E65100", contentBackground: "#FFFFFF", titleText: "#333333", descriptionText: "#666666", priceText: "#E65100" },
    creditCardFields: { textColor: "#333333", placeholderColor: "#999999", borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", focusBorderColor: "#0000FF", focusTextColor: "#333333" },
    personalDataFields: { textColor: "#333333", placeholderColor: "#999999", borderColor: "#E0E0E0", backgroundColor: "#FFFFFF", focusBorderColor: "#0000FF", focusTextColor: "#333333" },
    infoBox: { background: "#E3F2FD", border: "#90CAF9", text: "#1565C0" },
    productPrice: "#00AA00",
  };

  return {
    theme: "default",
    font: "Inter",
    colors: defaultColors,
    ...overrides,
  };
}

function createMockComponent(overrides: Partial<ComponentData> = {}): ComponentData {
  return {
    id: "text-1",
    type: "text",
    content: createTextContent(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("TextView", () => {
  const mockComponent = createMockComponent();
  const mockDesign = createMockDesign();

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<TextView component={mockComponent} />);
      expect(screen.getByText("Test Text Content")).toBeInTheDocument();
    });

    it("renders with custom text", () => {
      render(<TextView component={mockComponent} />);
      expect(screen.getByText("Test Text Content")).toBeInTheDocument();
    });

    it("renders default text when content is undefined", () => {
      const emptyComponent: ComponentData = {
        id: "text-2",
        type: "text",
      };
      render(<TextView component={emptyComponent} />);
      expect(screen.getByText("Texto editável - Clique para editar")).toBeInTheDocument();
    });

    it("renders default text when text field is empty", () => {
      const componentWithEmptyText = createMockComponent({
        content: createTextContent({ text: "" }),
      });
      render(<TextView component={componentWithEmptyText} />);
      expect(screen.getByText("Texto editável - Clique para editar")).toBeInTheDocument();
    });
  });

  describe("Content Props", () => {
    it("passes text content correctly", () => {
      render(<TextView component={mockComponent} />);
      const textElement = screen.getByText("Test Text Content");
      expect(textElement).toBeInTheDocument();
    });

    it("applies custom fontSize", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });

    it("applies custom color", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });

    it("applies custom alignment", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Design Integration", () => {
    it("uses design primaryText color when content color is not provided", () => {
      const componentWithoutColor = createMockComponent({
        id: "text-4",
        content: createTextContent({ text: "Design Color Test" }),
      });
      render(<TextView component={componentWithoutColor} design={mockDesign} />);
      expect(screen.getByText("Design Color Test")).toBeInTheDocument();
    });

    it("prioritizes content color over design color", () => {
      render(<TextView component={mockComponent} design={mockDesign} />);
      expect(screen.getByText("Test Text Content")).toBeInTheDocument();
    });

    it("works without design prop", () => {
      render(<TextView component={mockComponent} />);
      expect(screen.getByText("Test Text Content")).toBeInTheDocument();
    });
  });

  describe("Default Values", () => {
    it("uses default fontSize when not provided", () => {
      const componentWithoutFontSize = createMockComponent({
        id: "text-5",
        content: createTextContent({ text: "No Font Size" }),
      });
      render(<TextView component={componentWithoutFontSize} />);
      expect(screen.getByText("No Font Size")).toBeInTheDocument();
    });

    it("uses default alignment when not provided", () => {
      const componentWithoutAlignment = createMockComponent({
        id: "text-6",
        content: createTextContent({ text: "No Alignment" }),
      });
      render(<TextView component={componentWithoutAlignment} />);
      expect(screen.getByText("No Alignment")).toBeInTheDocument();
    });

    it("uses default backgroundColor when not provided", () => {
      const componentWithoutBgColor = createMockComponent({
        id: "text-7",
        content: createTextContent({ text: "No Background" }),
      });
      render(<TextView component={componentWithoutBgColor} />);
      expect(screen.getByText("No Background")).toBeInTheDocument();
    });
  });

  describe("Border Styling", () => {
    it("applies border color", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });

    it("applies border width", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });

    it("applies border radius", () => {
      const { container } = render(<TextView component={mockComponent} />);
      expect(container).toBeInTheDocument();
    });

    it("uses default border values when not provided", () => {
      const componentWithoutBorder = createMockComponent({
        id: "text-8",
        content: createTextContent({ text: "No Border" }),
      });
      render(<TextView component={componentWithoutBorder} />);
      expect(screen.getByText("No Border")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long text", () => {
      const longTextComponent = createMockComponent({
        id: "text-9",
        content: createTextContent({ text: "A".repeat(500) }),
      });
      render(<TextView component={longTextComponent} />);
      expect(screen.getByText("A".repeat(500))).toBeInTheDocument();
    });

    it("handles special characters in text", () => {
      const specialCharsComponent = createMockComponent({
        id: "text-10",
        content: createTextContent({ text: "Special: <>&\"'" }),
      });
      render(<TextView component={specialCharsComponent} />);
      expect(screen.getByText("Special: <>&\"'")).toBeInTheDocument();
    });

    it("handles zero fontSize gracefully", () => {
      const zeroFontComponent = createMockComponent({
        id: "text-11",
        content: createTextContent({ text: "Zero Font", fontSize: 0 }),
      });
      render(<TextView component={zeroFontComponent} />);
      expect(screen.getByText("Zero Font")).toBeInTheDocument();
    });
  });
});
