/**
 * @file BenefitBlock.test.tsx
 * @description Tests for BenefitBlock Component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { BenefitBlock, type BenefitBlockProps } from "../BenefitBlock";

// Mock CheckIconCakto component
vi.mock("@/components/icons/CheckIconCakto", () => ({
  CheckIconCakto: ({ size, color }: { size: number; color: string }) => (
    <div data-testid="check-icon" data-size={size} data-color={color}>
      CheckIcon
    </div>
  ),
}));

describe("BenefitBlock", () => {
  const defaultProps: BenefitBlockProps = {
    title: "Entrega Rápida",
    description: "Receba em até 24 horas",
    icon: "check",
    primaryColor: "#10B981",
    titleColor: "#1F2937",
    descriptionColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    darkMode: false,
    verticalMode: false,
    size: "original",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== Rendering ==========

  describe("Rendering", () => {
    it("should render correctly with default props", () => {
      render(<BenefitBlock {...defaultProps} />);

      expect(screen.getByText("Entrega Rápida")).toBeInTheDocument();
      expect(screen.getByText("Receba em até 24 horas")).toBeInTheDocument();
      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });

    it("should render with custom content", () => {
      render(
        <BenefitBlock
          {...defaultProps}
          title="Custom Title"
          description="Custom Description"
        />
      );

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom Description")).toBeInTheDocument();
    });

    it("should render with empty strings", () => {
      render(
        <BenefitBlock
          {...defaultProps}
          title=""
          description=""
        />
      );

      // Component should render without crashing
      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });
  });

  // ========== Icon Configuration ==========

  describe("Icon Configuration", () => {
    it("should render icon with correct color", () => {
      render(<BenefitBlock {...defaultProps} primaryColor="#FF0000" />);

      const icon = screen.getByTestId("check-icon");
      expect(icon).toHaveAttribute("data-color", "#FF0000");
    });

    it("should render small icon", () => {
      render(<BenefitBlock {...defaultProps} size="small" />);

      const icon = screen.getByTestId("check-icon");
      expect(icon).toHaveAttribute("data-size", "32");
    });

    it("should render original icon", () => {
      render(<BenefitBlock {...defaultProps} size="original" />);

      const icon = screen.getByTestId("check-icon");
      expect(icon).toHaveAttribute("data-size", "40");
    });

    it("should render large icon", () => {
      render(<BenefitBlock {...defaultProps} size="large" />);

      const icon = screen.getByTestId("check-icon");
      expect(icon).toHaveAttribute("data-size", "56");
    });
  });

  // ========== Styling ==========

  describe("Styling", () => {
    it("should apply title color in light mode", () => {
      render(<BenefitBlock {...defaultProps} titleColor="#000000" />);

      const title = screen.getByText("Entrega Rápida");
      expect(title).toHaveStyle({ color: "#000000" });
    });

    it("should apply description color in light mode", () => {
      render(<BenefitBlock {...defaultProps} descriptionColor="#999999" />);

      const description = screen.getByText("Receba em até 24 horas");
      expect(description).toHaveStyle({ color: "#999999" });
    });

    it("should apply white title color in dark mode", () => {
      render(<BenefitBlock {...defaultProps} darkMode={true} />);

      const title = screen.getByText("Entrega Rápida");
      expect(title).toHaveStyle({ color: "#FFFFFF" });
    });

    it("should apply gray description color in dark mode", () => {
      render(<BenefitBlock {...defaultProps} darkMode={true} />);

      const description = screen.getByText("Receba em até 24 horas");
      expect(description).toHaveStyle({ color: "#D1D5DB" });
    });

    it("should apply background color in light mode", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} backgroundColor="#F0F0F0" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#F0F0F0" });
    });

    it("should apply dark background in dark mode", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} darkMode={true} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ backgroundColor: "#1F2937" });
    });

    it("should apply custom className", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  // ========== Layout Modes ==========

  describe("Layout Modes", () => {
    it("should apply horizontal layout", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} verticalMode={false} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).not.toHaveClass("flex-col");
    });

    it("should apply vertical layout", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} verticalMode={true} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex-col");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("text-center");
    });
  });

  // ========== Size Variants ==========

  describe("Size Variants", () => {
    it("should apply small text size", () => {
      render(<BenefitBlock {...defaultProps} size="small" />);

      const title = screen.getByText("Entrega Rápida");
      expect(title).toHaveClass("text-xs");
    });

    it("should apply original text size", () => {
      render(<BenefitBlock {...defaultProps} size="original" />);

      const title = screen.getByText("Entrega Rápida");
      expect(title).toHaveClass("text-sm");
    });

    it("should apply large text size", () => {
      render(<BenefitBlock {...defaultProps} size="large" />);

      const title = screen.getByText("Entrega Rápida");
      expect(title).toHaveClass("text-lg");
    });
  });

  // ========== Interactions ==========

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <BenefitBlock {...defaultProps} onClick={handleClick} />
      );

      const wrapper = container.firstChild as HTMLElement;
      wrapper.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not crash when onClick is undefined", () => {
      const { container } = render(
        <BenefitBlock {...defaultProps} onClick={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      
      expect(() => wrapper.click()).not.toThrow();
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle very long text", () => {
      const longTitle = "A".repeat(200);
      const longDescription = "B".repeat(500);

      render(
        <BenefitBlock
          {...defaultProps}
          title={longTitle}
          description={longDescription}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const specialTitle = "<>&'\"@";
      const specialDescription = "!#$%^&*()";

      render(
        <BenefitBlock
          {...defaultProps}
          title={specialTitle}
          description={specialDescription}
        />
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialDescription)).toBeInTheDocument();
    });

    it("should handle multiline text", () => {
      render(
        <BenefitBlock
          {...defaultProps}
          title="Line 1\nLine 2"
          description="Para 1\nPara 2"
        />
      );

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Para 1/)).toBeInTheDocument();
    });
  });
});
