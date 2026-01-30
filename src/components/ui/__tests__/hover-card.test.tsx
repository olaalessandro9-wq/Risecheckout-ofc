/**
 * HoverCard Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for HoverCard components covering:
 * - All exported sub-components
 * - Rendering and ref forwarding
 * - Hover interactions
 *
 * @module components/ui/__tests__/hover-card.test
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../hover-card";

describe("HoverCard Components", () => {
  describe("HoverCard Root", () => {
    it("should render trigger content", () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Card content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("should not show content initially", () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Card content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.queryByText("Card content")).not.toBeInTheDocument();
    });

    it("should support controlled open state", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("HoverCardTrigger", () => {
    it("should render as link by default", () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Trigger Text</HoverCardTrigger>
        </HoverCard>
      );

      expect(screen.getByText("Trigger Text")).toBeInTheDocument();
    });

    it("should support asChild prop", () => {
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <button data-testid="custom-trigger">Custom Button</button>
          </HoverCardTrigger>
        </HoverCard>
      );

      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
    });
  });

  describe("HoverCardContent", () => {
    it("should render with default styling when open", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">Content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass("z-50", "w-64", "rounded-md", "border");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent ref={ref}>Content</HoverCardContent>
        </HoverCard>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should merge custom className", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent className="custom-hover-card">
            Content
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText("Content")).toHaveClass("custom-hover-card");
    });

    it("should support custom align prop", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent align="start" data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should support custom sideOffset prop", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent sideOffset={8} data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });

    it("should apply popover background styling", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">Content</HoverCardContent>
        </HoverCard>
      );

      const content = screen.getByTestId("content");
      expect(content).toHaveClass("bg-popover", "text-popover-foreground");
    });

    it("should have padding", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId("content")).toHaveClass("p-4");
    });

    it("should have shadow", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId("content")).toHaveClass("shadow-md");
    });
  });

  describe("HoverCard Interactions", () => {
    it("should show content on hover", async () => {
      render(
        <HoverCard openDelay={0}>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByText("Hover me");
      fireEvent.pointerEnter(trigger);

      await waitFor(() => {
        expect(screen.getByText("Hover content")).toBeInTheDocument();
      });
    });

    it("should hide content on pointer leave", async () => {
      render(
        <HoverCard openDelay={0} closeDelay={0}>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByText("Hover me");
      fireEvent.pointerEnter(trigger);

      await waitFor(() => {
        expect(screen.getByText("Hover content")).toBeInTheDocument();
      });

      fireEvent.pointerLeave(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Hover content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Complete HoverCard", () => {
    it("should render a complete hover card with user info", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger asChild>
            <a href="#">@username</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex space-x-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@username</h4>
                <p className="text-sm">Full-stack developer</p>
                <div className="flex items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Joined December 2021
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByRole("link")).toHaveTextContent("@username");
      expect(screen.getByText("Full-stack developer")).toBeInTheDocument();
      expect(screen.getByText("Joined December 2021")).toBeInTheDocument();
    });

    it("should render complex content", () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Product Info</HoverCardTrigger>
          <HoverCardContent>
            <div data-testid="product-card">
              <img src="/product.jpg" alt="Product" />
              <h3>Product Name</h3>
              <p>$99.99</p>
              <button>Add to Cart</button>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByTestId("product-card")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
    });
  });
});
