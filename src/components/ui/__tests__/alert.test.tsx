/**
 * Alert Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Alert components covering:
 * - Alert, AlertTitle, AlertDescription
 * - Rendering and ref forwarding
 * - Variants (default, destructive)
 * - Accessibility (role="alert")
 *
 * @module components/ui/__tests__/alert.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert Components", () => {
  describe("Alert", () => {
    it("renders with role='alert'", () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(<Alert ref={ref}>Test</Alert>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("applies default variant classes", () => {
      render(<Alert data-testid="alert">Default</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-background", "text-foreground");
    });

    it("applies destructive variant classes", () => {
      render(<Alert variant="destructive" data-testid="alert">Error</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("border-destructive/50", "text-destructive");
    });

    it("merges custom className", () => {
      render(<Alert className="custom-alert" data-testid="alert">Test</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("custom-alert");
    });

    it("applies base styling classes", () => {
      render(<Alert data-testid="alert">Styled</Alert>);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("relative", "w-full", "rounded-lg", "border", "p-4");
    });
  });

  describe("AlertTitle", () => {
    it("renders as h5 element", () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      const title = screen.getByRole("heading", { level: 5 });
      expect(title).toHaveTextContent("Alert Title");
    });

    it("applies font-medium styles", () => {
      render(<AlertTitle data-testid="title">Title</AlertTitle>);
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("mb-1", "font-medium", "leading-none", "tracking-tight");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLParagraphElement>();
      render(<AlertTitle ref={ref}>Test</AlertTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it("merges custom className", () => {
      render(<AlertTitle className="custom-title" data-testid="title">Title</AlertTitle>);
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("custom-title");
    });
  });

  describe("AlertDescription", () => {
    it("renders as div element", () => {
      render(<AlertDescription data-testid="desc">Description text</AlertDescription>);
      const desc = screen.getByTestId("desc");
      expect(desc.tagName).toBe("DIV");
    });

    it("applies text-sm styles", () => {
      render(<AlertDescription data-testid="desc">Description</AlertDescription>);
      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-sm");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLParagraphElement>();
      render(<AlertDescription ref={ref}>Test</AlertDescription>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("merges custom className", () => {
      render(
        <AlertDescription className="custom-desc" data-testid="desc">
          Description
        </AlertDescription>
      );
      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("custom-desc");
    });
  });

  describe("Composed Alert", () => {
    it("renders complete alert with title and description", () => {
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This is a warning message.</AlertDescription>
        </Alert>
      );
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 5 })).toHaveTextContent("Warning");
      expect(screen.getByText("This is a warning message.")).toBeInTheDocument();
    });
  });
});
