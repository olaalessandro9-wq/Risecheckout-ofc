/**
 * ScrollArea Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for ScrollArea and ScrollBar components covering:
 * - Rendering
 * - Styling
 * - Content overflow behavior
 *
 * Note: ScrollBar is rendered internally by ScrollArea, 
 * so we test the ScrollArea component as a whole.
 *
 * @module components/ui/__tests__/scroll-area.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { ScrollArea } from "../scroll-area";

describe("ScrollArea", () => {
  describe("Rendering", () => {
    it("renders scroll area container", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId("scroll-area")).toBeInTheDocument();
    });

    it("renders children content", () => {
      render(
        <ScrollArea>
          <div data-testid="content">Scrollable Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByText("Scrollable Content")).toBeInTheDocument();
    });

    it("applies overflow-hidden class", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId("scroll-area")).toHaveClass("overflow-hidden");
    });

    it("applies relative positioning", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId("scroll-area")).toHaveClass("relative");
    });
  });

  describe("Custom ClassName", () => {
    it("accepts custom className", () => {
      render(
        <ScrollArea className="h-72 w-48" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId("scroll-area");
      expect(scrollArea).toHaveClass("h-72", "w-48");
    });

    it("merges custom className with default classes", () => {
      render(
        <ScrollArea className="custom-class" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId("scroll-area");
      expect(scrollArea).toHaveClass("custom-class", "relative", "overflow-hidden");
    });
  });

  describe("Long Content", () => {
    it("handles long content list", () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
      render(
        <ScrollArea className="h-72">
          {items.map((item) => (
            <div key={item} className="p-2">
              {item}
            </div>
          ))}
        </ScrollArea>
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 50")).toBeInTheDocument();
    });
  });

  describe("Props Forwarding", () => {
    it("forwards additional HTML attributes", () => {
      render(
        <ScrollArea data-testid="scroll-area" id="main-scroll" aria-label="Main content area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId("scroll-area");
      expect(scrollArea).toHaveAttribute("id", "main-scroll");
      expect(scrollArea).toHaveAttribute("aria-label", "Main content area");
    });
  });

  describe("Viewport", () => {
    it("renders viewport with proper attributes", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = screen.getByTestId("scroll-area").querySelector("[data-radix-scroll-area-viewport]");
      expect(viewport).toBeInTheDocument();
    });

    it("viewport has h-full w-full classes", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const viewport = screen.getByTestId("scroll-area").querySelector("[data-radix-scroll-area-viewport]");
      expect(viewport).toHaveClass("h-full", "w-full");
    });
  });

  describe("Dir Attribute", () => {
    it("has dir attribute for RTL support", () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId("scroll-area")).toHaveAttribute("dir");
    });
  });

  describe("Complex Content", () => {
    it("renders nested elements correctly", () => {
      render(
        <ScrollArea>
          <div className="p-4">
            <h3 data-testid="title">Title</h3>
            <p data-testid="paragraph">Paragraph content</p>
            <ul>
              <li data-testid="list-item">List item</li>
            </ul>
          </div>
        </ScrollArea>
      );

      expect(screen.getByTestId("title")).toBeInTheDocument();
      expect(screen.getByTestId("paragraph")).toBeInTheDocument();
      expect(screen.getByTestId("list-item")).toBeInTheDocument();
    });

    it("renders with fixed height for scrollable content", () => {
      render(
        <ScrollArea className="h-48" data-testid="scroll-area">
          <div style={{ height: "500px" }}>
            <p>Tall content that needs scrolling</p>
          </div>
        </ScrollArea>
      );

      expect(screen.getByTestId("scroll-area")).toHaveClass("h-48");
      expect(screen.getByText("Tall content that needs scrolling")).toBeInTheDocument();
    });
  });
});
