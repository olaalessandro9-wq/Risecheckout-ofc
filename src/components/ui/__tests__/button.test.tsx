/**
 * Button Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Button component covering:
 * - Rendering and ref forwarding
 * - All 6 variants (default, destructive, outline, secondary, ghost, link)
 * - All 4 sizes (default, sm, lg, icon)
 * - States (disabled, onClick)
 * - asChild (Slot) behavior
 * - Accessibility
 *
 * @module components/ui/__tests__/button.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Button } from "../button";

describe("Button", () => {
  describe("Rendering", () => {
    it("renders with children", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Button.displayName).toBe("Button");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Variants", () => {
    it("applies default variant classes", () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("applies destructive variant classes", () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");
    });

    it("applies outline variant classes", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border", "border-input", "bg-background");
    });

    it("applies secondary variant classes", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("applies ghost variant classes", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent", "hover:text-accent-foreground");
    });

    it("applies link variant classes", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary", "underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("applies default size classes", () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "px-4", "py-2");
    });

    it("applies sm size classes", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "px-3");
    });

    it("applies lg size classes", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-11", "px-8");
    });

    it("applies icon size classes", () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "w-10");
    });
  });

  describe("States", () => {
    it("applies disabled styles when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");
    });

    it("prevents click when disabled", async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole("button");
      button.click();
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("handles onClick callback", async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole("button");
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("asChild (Slot)", () => {
    it("renders as Slot when asChild=true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("passes className to Slot child", () => {
      render(
        <Button asChild variant="destructive">
          <a href="/test">Styled Link</a>
        </Button>
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-destructive");
    });
  });

  describe("Accessibility", () => {
    it("renders as button element by default", () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("merges custom className", () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });
});
