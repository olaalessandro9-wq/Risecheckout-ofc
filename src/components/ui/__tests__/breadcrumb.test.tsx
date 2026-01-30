/**
 * Breadcrumb Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Breadcrumb components covering:
 * - Rendering of all sub-components
 * - Accessibility (aria-label, aria-current, aria-disabled)
 * - Navigation structure
 * - Custom separators
 * - Link behavior (asChild pattern)
 *
 * @module components/ui/__tests__/breadcrumb.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "../breadcrumb";

describe("Breadcrumb", () => {
  describe("Root Component", () => {
    it("renders as nav element", () => {
      render(
        <Breadcrumb data-testid="breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const nav = screen.getByTestId("breadcrumb");
      expect(nav.tagName).toBe("NAV");
    });

    it("has aria-label breadcrumb for accessibility", () => {
      render(
        <Breadcrumb data-testid="breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("breadcrumb")).toHaveAttribute("aria-label", "breadcrumb");
    });

    it("accepts custom className", () => {
      render(
        <Breadcrumb className="custom-class" data-testid="breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("breadcrumb")).toHaveClass("custom-class");
    });
  });

  describe("BreadcrumbList", () => {
    it("renders as ordered list", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList data-testid="list">
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("list").tagName).toBe("OL");
    });

    it("applies flex layout classes", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList data-testid="list">
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("list")).toHaveClass("flex", "flex-wrap", "items-center");
    });

    it("accepts custom className", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList className="custom-list" data-testid="list">
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("list")).toHaveClass("custom-list");
    });
  });

  describe("BreadcrumbItem", () => {
    it("renders as list item", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem data-testid="item">Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("item").tagName).toBe("LI");
    });

    it("applies inline-flex classes", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem data-testid="item">Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("item")).toHaveClass("inline-flex", "items-center");
    });
  });

  describe("BreadcrumbLink", () => {
    it("renders as anchor by default", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" data-testid="link">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const link = screen.getByTestId("link");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/");
    });

    it("applies hover transition classes", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" data-testid="link">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("link")).toHaveClass("transition-colors");
    });

    it("renders children correctly", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  describe("BreadcrumbPage", () => {
    it("renders as span element", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("page").tagName).toBe("SPAN");
    });

    it("has aria-current page attribute", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("page")).toHaveAttribute("aria-current", "page");
    });

    it("has aria-disabled true", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("page")).toHaveAttribute("aria-disabled", "true");
    });

    it("has role link", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("page")).toHaveAttribute("role", "link");
    });

    it("applies font-normal and text-foreground classes", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const page = screen.getByTestId("page");
      expect(page).toHaveClass("font-normal", "text-foreground");
    });
  });

  describe("BreadcrumbSeparator", () => {
    it("renders as list item", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbSeparator data-testid="separator" />
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("separator").tagName).toBe("LI");
    });

    it("has role presentation", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbSeparator data-testid="separator" />
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("separator")).toHaveAttribute("role", "presentation");
    });

    it("has aria-hidden true", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbSeparator data-testid="separator" />
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders default ChevronRight icon", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbSeparator data-testid="separator" />
          </BreadcrumbList>
        </Breadcrumb>
      );
      const separator = screen.getByTestId("separator");
      expect(separator.querySelector("svg")).toBeInTheDocument();
    });

    it("accepts custom separator content", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbSeparator data-testid="separator">/</BreadcrumbSeparator>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("separator")).toHaveTextContent("/");
    });
  });

  describe("BreadcrumbEllipsis", () => {
    it("renders as span element", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("ellipsis").tagName).toBe("SPAN");
    });

    it("has role presentation", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("ellipsis")).toHaveAttribute("role", "presentation");
    });

    it("has aria-hidden true", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId("ellipsis")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders MoreHorizontal icon", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const ellipsis = screen.getByTestId("ellipsis");
      expect(ellipsis.querySelector("svg")).toBeInTheDocument();
    });

    it("has sr-only 'More' text", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText("More")).toHaveClass("sr-only");
    });
  });

  describe("Complete Breadcrumb Navigation", () => {
    it("renders full navigation structure", () => {
      render(
        <Breadcrumb data-testid="breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current Product</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Current Product")).toBeInTheDocument();
    });
  });
});
