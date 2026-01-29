/**
 * Progress Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Progress component covering:
 * - Rendering and ref forwarding
 * - Value binding (0-100)
 * - Styling and transform calculation
 *
 * @module components/ui/__tests__/progress.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Progress } from "../progress";

describe("Progress", () => {
  describe("Rendering", () => {
    it("renders progress element", () => {
      render(<Progress data-testid="progress" value={50} />);
      expect(screen.getByTestId("progress")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Progress ref={ref} value={50} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("renders indicator element", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.querySelector("[data-state]");
      expect(indicator).toBeInTheDocument();
    });
  });

  describe("Value Binding", () => {
    it("applies correct transform for 0%", () => {
      render(<Progress data-testid="progress" value={0} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ transform: "translateX(-100%)" });
    });

    it("applies correct transform for 50%", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ transform: "translateX(-50%)" });
    });

    it("applies correct transform for 100%", () => {
      render(<Progress data-testid="progress" value={100} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ transform: "translateX(-0%)" });
    });

    it("handles undefined value as 0", () => {
      render(<Progress data-testid="progress" />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveStyle({ transform: "translateX(-100%)" });
    });
  });

  describe("Styling", () => {
    it("applies base container classes", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("relative", "h-4", "w-full", "overflow-hidden", "rounded-full");
    });

    it("applies bg-secondary to container", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("bg-secondary");
    });

    it("applies bg-primary to indicator", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveClass("bg-primary");
    });

    it("applies transition-all to indicator", () => {
      render(<Progress data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      const indicator = progress.firstChild as HTMLElement;
      expect(indicator).toHaveClass("transition-all");
    });

    it("merges custom className", () => {
      render(<Progress className="custom-progress" data-testid="progress" value={50} />);
      const progress = screen.getByTestId("progress");
      expect(progress).toHaveClass("custom-progress");
      expect(progress).toHaveClass("relative");
    });
  });
});
