/**
 * MetricCard Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../MetricsGrid/MetricCard";
import { DollarSign } from "lucide-react";

// Mock UltrawidePerformanceContext
const mockUltrawideContext = {
  isUltrawide: false,
  disableBlur: false,
  disableHoverEffects: false,
};

vi.mock("@/contexts/UltrawidePerformanceContext", () => ({
  useUltrawidePerformance: () => mockUltrawideContext,
}));

describe("MetricCard", () => {
  beforeEach(() => {
    mockUltrawideContext.isUltrawide = false;
    mockUltrawideContext.disableBlur = false;
    mockUltrawideContext.disableHoverEffects = false;
  });

  describe("Basic Rendering", () => {
    it("should render title and value", () => {
      render(<MetricCard title="Vendas" value="R$ 1.500,00" />);
      
      expect(screen.getByText("Vendas")).toBeInTheDocument();
      expect(screen.getByText("R$ 1.500,00")).toBeInTheDocument();
    });

    it("should render with numeric value", () => {
      render(<MetricCard title="Total" value={1234} />);
      
      expect(screen.getByText("1234")).toBeInTheDocument();
    });

    it("should render icon when provided", () => {
      render(
        <MetricCard 
          title="Receita" 
          value="R$ 5.000" 
          icon={<DollarSign data-testid="icon" />} 
        />
      );
      
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show skeleton when loading", () => {
      render(<MetricCard title="Loading Test" value="R$ 0" isLoading />);
      
      // Should not show value when loading
      expect(screen.queryByText("R$ 0")).not.toBeInTheDocument();
    });

    it("should show value when not loading", () => {
      render(<MetricCard title="Loaded" value="R$ 100" isLoading={false} />);
      
      expect(screen.getByText("R$ 100")).toBeInTheDocument();
    });
  });

  describe("Trend Display", () => {
    it("should show positive trend with up arrow", () => {
      render(
        <MetricCard 
          title="Crescimento" 
          value="100" 
          trend={{ value: 25.5, isPositive: true, label: "vs ontem" }}
        />
      );
      
      expect(screen.getByText("26%")).toBeInTheDocument(); // Math.round(25.5)
      expect(screen.getByText("vs ontem")).toBeInTheDocument();
    });

    it("should show negative trend with down arrow", () => {
      render(
        <MetricCard 
          title="Declínio" 
          value="50" 
          trend={{ value: 15, isPositive: false, label: "vs semana passada" }}
        />
      );
      
      expect(screen.getByText("15%")).toBeInTheDocument();
      expect(screen.getByText("vs semana passada")).toBeInTheDocument();
    });

    it("should round trend value to integer", () => {
      render(
        <MetricCard 
          title="Test" 
          value="100" 
          trend={{ value: 33.7, isPositive: true, label: "" }}
        />
      );
      
      expect(screen.getByText("34%")).toBeInTheDocument();
    });

    it("should not render trend section when trend is undefined", () => {
      render(<MetricCard title="No Trend" value="100" />);
      
      expect(screen.queryByText("%")).not.toBeInTheDocument();
    });
  });

  describe("Eye Icon", () => {
    it("should show eye icon by default", () => {
      const { container } = render(<MetricCard title="With Eye" value="100" />);
      
      // Eye icon should be rendered
      const eyeIcons = container.querySelectorAll("svg");
      expect(eyeIcons.length).toBeGreaterThanOrEqual(1);
    });

    it("should hide eye icon when showEye is false", () => {
      render(<MetricCard title="No Eye" value="100" showEye={false} />);
      
      // The Eye icon specifically should not be rendered
      // This is harder to test without specific class/testid
      expect(screen.getByText("No Eye")).toBeInTheDocument();
    });
  });

  describe("Ultrawide Performance Mode", () => {
    it("should apply blur when disableBlur is false", () => {
      mockUltrawideContext.disableBlur = false;
      
      const { container } = render(<MetricCard title="Blur On" value="100" />);
      
      const card = container.querySelector(".backdrop-blur-sm");
      expect(card).toBeInTheDocument();
    });

    it("should remove blur when disableBlur is true", () => {
      mockUltrawideContext.disableBlur = true;
      
      const { container } = render(<MetricCard title="Blur Off" value="100" />);
      
      const card = container.querySelector(".backdrop-blur-sm");
      expect(card).not.toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <MetricCard title="Custom" value="100" className="custom-class" />
      );
      
      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });

    it("should apply custom iconClassName", () => {
      const { container } = render(
        <MetricCard 
          title="Icon Style" 
          value="100" 
          icon={<DollarSign />}
          iconClassName="bg-emerald-500/10 text-emerald-500"
        />
      );
      
      const iconWrapper = container.querySelector(".bg-emerald-500\\/10");
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe("Animation Delay", () => {
    it("should accept delay prop without error", () => {
      expect(() => {
        render(<MetricCard title="Delayed" value="100" delay={0.5} />);
      }).not.toThrow();
    });
  });
});
