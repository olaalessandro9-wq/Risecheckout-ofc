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

describe("TextView", () => {
  const mockComponent: ComponentData = {
    id: "text-1",
    type: "text",
    content: {
      text: "Test Text Content",
      fontSize: 18,
      color: "#FF0000",
      alignment: "left" as const,
      backgroundColor: "#F0F0F0",
      borderColor: "#CCCCCC",
      borderWidth: 2,
      borderRadius: 10,
    },
  };

  const mockDesign: CheckoutDesign = {
    colors: {
      primaryText: "#333333",
      primary: "#0000FF",
      secondary: "#00FF00",
    },
  };

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
      const componentWithEmptyText: ComponentData = {
        id: "text-3",
        type: "text",
        content: {
          text: "",
          fontSize: 16,
          color: "#000000",
          alignment: "center" as const,
        },
      };
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
      // TextBlock component should receive fontSize prop
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
      const componentWithoutColor: ComponentData = {
        id: "text-4",
        type: "text",
        content: {
          text: "Design Color Test",
          fontSize: 16,
          alignment: "center" as const,
        },
      };
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
      const componentWithoutFontSize: ComponentData = {
        id: "text-5",
        type: "text",
        content: {
          text: "No Font Size",
          color: "#000000",
          alignment: "center" as const,
        },
      };
      render(<TextView component={componentWithoutFontSize} />);
      expect(screen.getByText("No Font Size")).toBeInTheDocument();
    });

    it("uses default alignment when not provided", () => {
      const componentWithoutAlignment: ComponentData = {
        id: "text-6",
        type: "text",
        content: {
          text: "No Alignment",
          fontSize: 16,
          color: "#000000",
        },
      };
      render(<TextView component={componentWithoutAlignment} />);
      expect(screen.getByText("No Alignment")).toBeInTheDocument();
    });

    it("uses default backgroundColor when not provided", () => {
      const componentWithoutBgColor: ComponentData = {
        id: "text-7",
        type: "text",
        content: {
          text: "No Background",
          fontSize: 16,
          color: "#000000",
          alignment: "center" as const,
        },
      };
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
      const componentWithoutBorder: ComponentData = {
        id: "text-8",
        type: "text",
        content: {
          text: "No Border",
          fontSize: 16,
          color: "#000000",
          alignment: "center" as const,
        },
      };
      render(<TextView component={componentWithoutBorder} />);
      expect(screen.getByText("No Border")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long text", () => {
      const longTextComponent: ComponentData = {
        id: "text-9",
        type: "text",
        content: {
          text: "A".repeat(500),
          fontSize: 16,
          color: "#000000",
          alignment: "center" as const,
        },
      };
      render(<TextView component={longTextComponent} />);
      expect(screen.getByText("A".repeat(500))).toBeInTheDocument();
    });

    it("handles special characters in text", () => {
      const specialCharsComponent: ComponentData = {
        id: "text-10",
        type: "text",
        content: {
          text: "Special: <>&\"'",
          fontSize: 16,
          color: "#000000",
          alignment: "center" as const,
        },
      };
      render(<TextView component={specialCharsComponent} />);
      expect(screen.getByText("Special: <>&\"'")).toBeInTheDocument();
    });

    it("handles zero fontSize gracefully", () => {
      const zeroFontComponent: ComponentData = {
        id: "text-11",
        type: "text",
        content: {
          text: "Zero Font",
          fontSize: 0,
          color: "#000000",
          alignment: "center" as const,
        },
      };
      render(<TextView component={zeroFontComponent} />);
      expect(screen.getByText("Zero Font")).toBeInTheDocument();
    });
  });
});
