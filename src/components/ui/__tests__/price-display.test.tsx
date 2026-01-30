/**
 * PriceDisplay Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for PriceDisplay components covering:
 * - PriceDisplay, PriceDisplayWithDiscount, PriceDisplayNumeric
 * - usePriceFormatter hook
 * - Currency formatting
 *
 * @module components/ui/__tests__/price-display.test
 */

import { describe, it, expect } from "vitest";
import { render, screen, renderHook } from "@testing-library/react";
import {
  PriceDisplay,
  PriceDisplayWithDiscount,
  PriceDisplayNumeric,
  usePriceFormatter,
} from "../price-display";

describe("PriceDisplay", () => {
  describe("Basic Rendering", () => {
    it("should render price from cents", () => {
      render(<PriceDisplay cents={2990} />);
      expect(screen.getByText(/29,90/)).toBeInTheDocument();
    });

    it("should render zero cents", () => {
      render(<PriceDisplay cents={0} />);
      expect(screen.getByText(/0,00/)).toBeInTheDocument();
    });

    it("should render small amounts", () => {
      render(<PriceDisplay cents={50} />);
      expect(screen.getByText(/0,50/)).toBeInTheDocument();
    });

    it("should render large amounts", () => {
      render(<PriceDisplay cents={99999} />);
      expect(screen.getByText(/999,99/)).toBeInTheDocument();
    });

    it("should include R$ symbol", () => {
      render(<PriceDisplay cents={1000} />);
      expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should merge custom className", () => {
      render(<PriceDisplay cents={100} className="text-lg font-bold" />);
      const element = screen.getByText(/R\$/);
      expect(element).toHaveClass("text-lg", "font-bold");
    });

    it("should apply inline style", () => {
      render(<PriceDisplay cents={100} style={{ color: "red" }} />);
      const element = screen.getByText(/R\$/);
      expect(element).toHaveStyle({ color: "rgb(255, 0, 0)" });
    });
  });

  describe("Edge Cases", () => {
    it("should handle single digit cents", () => {
      render(<PriceDisplay cents={1} />);
      expect(screen.getByText(/0,01/)).toBeInTheDocument();
    });

    it("should handle exact real amounts", () => {
      render(<PriceDisplay cents={10000} />);
      expect(screen.getByText(/100,00/)).toBeInTheDocument();
    });
  });
});

describe("PriceDisplayWithDiscount", () => {
  describe("Basic Rendering", () => {
    it("should render original and discount prices", () => {
      render(
        <PriceDisplayWithDiscount originalCents={2990} discountCents={1990} />
      );
      expect(screen.getByText(/29,90/)).toBeInTheDocument();
      expect(screen.getByText(/19,90/)).toBeInTheDocument();
    });

    it("should apply line-through to original price", () => {
      render(
        <PriceDisplayWithDiscount originalCents={2990} discountCents={1990} />
      );
      const originalPrice = screen.getByText(/29,90/);
      expect(originalPrice).toHaveClass("line-through");
    });

    it("should apply font-bold to discount price", () => {
      render(
        <PriceDisplayWithDiscount originalCents={2990} discountCents={1990} />
      );
      const discountPrice = screen.getByText(/19,90/);
      expect(discountPrice).toHaveClass("font-bold");
    });

    it("should apply muted-foreground to original price", () => {
      render(
        <PriceDisplayWithDiscount originalCents={2990} discountCents={1990} />
      );
      const originalPrice = screen.getByText(/29,90/);
      expect(originalPrice).toHaveClass("text-muted-foreground");
    });

    it("should apply primary color to discount price", () => {
      render(
        <PriceDisplayWithDiscount originalCents={2990} discountCents={1990} />
      );
      const discountPrice = screen.getByText(/19,90/);
      expect(discountPrice).toHaveClass("text-primary");
    });
  });

  describe("Layout", () => {
    it("should use horizontal layout by default", () => {
      const { container } = render(
        <PriceDisplayWithDiscount originalCents={100} discountCents={50} />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
    });

    it("should support vertical layout", () => {
      const { container } = render(
        <PriceDisplayWithDiscount
          originalCents={100}
          discountCents={50}
          layout="vertical"
        />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "flex-col", "gap-1");
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom className for original price", () => {
      render(
        <PriceDisplayWithDiscount
          originalCents={100}
          discountCents={50}
          originalClassName="text-sm"
        />
      );
      const originalPrice = screen.getByText(/1,00/);
      expect(originalPrice).toHaveClass("text-sm");
    });

    it("should merge custom className for discount price", () => {
      render(
        <PriceDisplayWithDiscount
          originalCents={100}
          discountCents={50}
          discountClassName="text-xl"
        />
      );
      const discountPrice = screen.getByText(/0,50/);
      expect(discountPrice).toHaveClass("text-xl");
    });
  });
});

describe("PriceDisplayNumeric", () => {
  describe("Basic Rendering", () => {
    it("should render price without R$ symbol", () => {
      render(<PriceDisplayNumeric cents={2990} />);
      const element = screen.getByText("29,90");
      expect(element).toBeInTheDocument();
      expect(element.textContent).not.toContain("R$");
    });

    it("should render zero correctly", () => {
      render(<PriceDisplayNumeric cents={0} />);
      expect(screen.getByText("0,00")).toBeInTheDocument();
    });

    it("should render small amounts", () => {
      render(<PriceDisplayNumeric cents={99} />);
      expect(screen.getByText("0,99")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should merge custom className", () => {
      render(<PriceDisplayNumeric cents={100} className="text-2xl" />);
      const element = screen.getByText("1,00");
      expect(element).toHaveClass("text-2xl");
    });

    it("should apply inline style", () => {
      render(<PriceDisplayNumeric cents={100} style={{ fontWeight: "bold" }} />);
      const element = screen.getByText("1,00");
      expect(element).toHaveStyle({ fontWeight: "bold" });
    });
  });
});

describe("usePriceFormatter", () => {
  describe("formatPrice", () => {
    it("should format cents to BRL", () => {
      const { result } = renderHook(() => usePriceFormatter());
      expect(result.current.formatPrice(2990)).toContain("29,90");
    });

    it("should include R$ symbol", () => {
      const { result } = renderHook(() => usePriceFormatter());
      expect(result.current.formatPrice(1000)).toContain("R$");
    });

    it("should format zero", () => {
      const { result } = renderHook(() => usePriceFormatter());
      expect(result.current.formatPrice(0)).toContain("0,00");
    });
  });

  describe("formatPriceNumeric", () => {
    it("should format cents without R$ symbol", () => {
      const { result } = renderHook(() => usePriceFormatter());
      const formatted = result.current.formatPriceNumeric(2990);
      expect(formatted).toBe("29,90");
      expect(formatted).not.toContain("R$");
    });

    it("should format zero without symbol", () => {
      const { result } = renderHook(() => usePriceFormatter());
      expect(result.current.formatPriceNumeric(0)).toBe("0,00");
    });

    it("should trim whitespace", () => {
      const { result } = renderHook(() => usePriceFormatter());
      const formatted = result.current.formatPriceNumeric(100);
      expect(formatted).not.toMatch(/^\s|\s$/);
    });
  });
});

describe("Price Formatting Consistency", () => {
  it("should format same value identically across components", () => {
    const cents = 12345;

    const { rerender } = render(<PriceDisplay cents={cents} />);
    const displayText = screen.getByText(/123,45/).textContent;

    rerender(<PriceDisplayNumeric cents={cents} />);
    const numericText = screen.getByText("123,45").textContent;

    // Both should have same numeric value
    expect(displayText).toContain("123,45");
    expect(numericText).toBe("123,45");
  });

  it("should use Brazilian number format", () => {
    render(<PriceDisplay cents={123456} />);
    // Brazilian format uses comma for decimal separator
    expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
  });
});
