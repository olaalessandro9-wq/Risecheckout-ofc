/**
 * Card Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Card components covering:
 * - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 * - Rendering and ref forwarding
 * - Styling and className merge
 *
 * @module components/ui/__tests__/card.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders with children", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("renders with displayName", () => {
      expect(Card.displayName).toBe("Card");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Card ref={ref}>Test</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("merges custom className", () => {
      render(<Card className="custom-card" data-testid="card">Test</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-card");
    });

    it("applies base styling classes", () => {
      render(<Card data-testid="card">Test</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("rounded-lg", "border", "bg-card", "shadow-sm");
    });
  });

  describe("CardHeader", () => {
    it("renders with children", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("applies flex layout", () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId("header");
      expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<CardHeader ref={ref}>Test</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardTitle", () => {
    it("renders as h3 element", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveTextContent("Title");
    });

    it("applies text styles", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("text-2xl", "font-semibold", "leading-none");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLParagraphElement>();
      render(<CardTitle ref={ref}>Test</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe("CardDescription", () => {
    it("renders as p element", () => {
      render(<CardDescription>Description text</CardDescription>);
      const desc = screen.getByText("Description text");
      expect(desc.tagName).toBe("P");
    });

    it("applies muted foreground color", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-sm", "text-muted-foreground");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLParagraphElement>();
      render(<CardDescription ref={ref}>Test</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe("CardContent", () => {
    it("renders with children", () => {
      render(<CardContent>Content here</CardContent>);
      expect(screen.getByText("Content here")).toBeInTheDocument();
    });

    it("applies padding styles", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("p-6", "pt-0");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<CardContent ref={ref}>Test</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("CardFooter", () => {
    it("renders with children", () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("applies flex layout with items-center", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<CardFooter ref={ref}>Test</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
