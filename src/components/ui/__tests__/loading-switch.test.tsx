/**
 * LoadingSwitch Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for LoadingSwitch component covering:
 * - Rendering and states
 * - Loading behavior
 * - Label display
 *
 * @module components/ui/__tests__/loading-switch.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { LoadingSwitch } from "../loading-switch";

describe("LoadingSwitch", () => {
  describe("Rendering", () => {
    it("should render switch element", () => {
      render(<LoadingSwitch />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<LoadingSwitch ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("should merge custom className", () => {
      render(<LoadingSwitch className="custom-switch" data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveClass("custom-switch");
    });
  });

  describe("Checked State", () => {
    it("should show active label when checked", () => {
      render(<LoadingSwitch checked={true} />);
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });

    it("should show inactive label when unchecked", () => {
      render(<LoadingSwitch checked={false} />);
      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });

    it("should use custom active label", () => {
      render(<LoadingSwitch checked={true} activeLabel="Enabled" />);
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });

    it("should use custom inactive label", () => {
      render(<LoadingSwitch checked={false} inactiveLabel="Disabled" />);
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading", () => {
      render(<LoadingSwitch isLoading={true} />);
      // Loader2 icon has animate-spin class
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show loading label when loading", () => {
      render(<LoadingSwitch isLoading={true} loadingLabel="Saving..." />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should disable switch when loading", () => {
      render(<LoadingSwitch isLoading={true} />);
      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should apply pulse animation when loading", () => {
      render(<LoadingSwitch isLoading={true} data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveClass("animate-pulse");
    });

    it("should apply cursor-wait when loading", () => {
      render(<LoadingSwitch isLoading={true} data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveClass("cursor-wait");
    });

    it("should reduce opacity when loading", () => {
      render(<LoadingSwitch isLoading={true} data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveClass("opacity-70");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<LoadingSwitch disabled={true} />);
      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should be disabled when loading", () => {
      render(<LoadingSwitch isLoading={true} />);
      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should apply reduced opacity to label when disabled", () => {
      render(<LoadingSwitch disabled={true} />);
      const label = screen.getByText("Inativo");
      expect(label.closest("label")).toHaveClass("opacity-70");
    });

    it("should apply cursor-not-allowed to label when disabled", () => {
      render(<LoadingSwitch disabled={true} />);
      const label = screen.getByText("Inativo");
      expect(label.closest("label")).toHaveClass("cursor-not-allowed");
    });
  });

  describe("Label Display", () => {
    it("should show label by default", () => {
      render(<LoadingSwitch checked={true} />);
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });

    it("should hide label when showLabel is false", () => {
      render(<LoadingSwitch checked={true} showLabel={false} />);
      expect(screen.queryByText("Ativo")).not.toBeInTheDocument();
    });

    it("should apply min-width to label", () => {
      render(<LoadingSwitch checked={true} />);
      const label = screen.getByText("Ativo").closest("label");
      expect(label).toHaveClass("min-w-[100px]");
    });

    it("should apply text-sm to label", () => {
      render(<LoadingSwitch checked={true} />);
      const label = screen.getByText("Ativo").closest("label");
      expect(label).toHaveClass("text-sm");
    });
  });

  describe("Interactions", () => {
    it("should call onCheckedChange when toggled", () => {
      const onCheckedChange = vi.fn();
      render(<LoadingSwitch checked={false} onCheckedChange={onCheckedChange} />);

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("should not call onCheckedChange when disabled", () => {
      const onCheckedChange = vi.fn();
      render(<LoadingSwitch disabled onCheckedChange={onCheckedChange} />);

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("should not call onCheckedChange when loading", () => {
      const onCheckedChange = vi.fn();
      render(<LoadingSwitch isLoading onCheckedChange={onCheckedChange} />);

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("should have flex container with gap", () => {
      const { container } = render(<LoadingSwitch />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex", "items-center", "gap-3");
    });

    it("should apply primary background when checked", () => {
      render(<LoadingSwitch checked={true} data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveAttribute("data-state", "checked");
    });

    it("should apply input background when unchecked", () => {
      render(<LoadingSwitch checked={false} data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveAttribute("data-state", "unchecked");
    });

    it("should apply focus ring styles", () => {
      render(<LoadingSwitch data-testid="switch" />);
      expect(screen.getByTestId("switch")).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring"
      );
    });
  });

  describe("Thumb", () => {
    it("should render thumb element", () => {
      render(<LoadingSwitch />);
      const thumb = document.querySelector("[class*='pointer-events-none']");
      expect(thumb).toBeInTheDocument();
    });

    it("should have rounded-full class", () => {
      render(<LoadingSwitch />);
      const thumb = document.querySelector("[class*='pointer-events-none']");
      expect(thumb).toHaveClass("rounded-full");
    });

    it("should have shadow", () => {
      render(<LoadingSwitch />);
      const thumb = document.querySelector("[class*='pointer-events-none']");
      expect(thumb).toHaveClass("shadow-lg");
    });
  });

  describe("Loading Label Styling", () => {
    it("should apply primary color to label when loading", () => {
      render(<LoadingSwitch isLoading loadingLabel="Loading" />);
      const label = screen.getByText("Loading").closest("label");
      expect(label).toHaveClass("text-primary", "font-medium");
    });

    it("should show spinner with label", () => {
      render(<LoadingSwitch isLoading loadingLabel="Processing" />);
      expect(screen.getByText("Processing")).toBeInTheDocument();
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });
});
