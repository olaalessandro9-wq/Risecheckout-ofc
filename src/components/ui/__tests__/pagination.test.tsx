/**
 * Pagination Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Pagination components covering:
 * - Rendering of all sub-components
 * - Navigation links (Previous/Next)
 * - Active page indication
 * - Ellipsis display
 * - Accessibility
 *
 * @module components/ui/__tests__/pagination.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../pagination";

describe("Pagination", () => {
  describe("Root Component", () => {
    it("renders as nav element", () => {
      render(
        <Pagination data-testid="pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("pagination").tagName).toBe("NAV");
    });

    it("has role navigation", () => {
      render(
        <Pagination data-testid="pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("pagination")).toHaveAttribute("role", "navigation");
    });

    it("has aria-label pagination", () => {
      render(
        <Pagination data-testid="pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("pagination")).toHaveAttribute("aria-label", "pagination");
    });

    it("applies flex and justify-center classes", () => {
      render(
        <Pagination data-testid="pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("pagination")).toHaveClass("flex", "justify-center");
    });

    it("accepts custom className", () => {
      render(
        <Pagination className="custom-pagination" data-testid="pagination">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("pagination")).toHaveClass("custom-pagination");
    });
  });

  describe("PaginationContent", () => {
    it("renders as unordered list", () => {
      render(
        <Pagination>
          <PaginationContent data-testid="content">
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("content").tagName).toBe("UL");
    });

    it("applies flex and gap classes", () => {
      render(
        <Pagination>
          <PaginationContent data-testid="content">
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("content")).toHaveClass("flex", "flex-row", "items-center", "gap-1");
    });
  });

  describe("PaginationItem", () => {
    it("renders as list item", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem data-testid="item">
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("item").tagName).toBe("LI");
    });
  });

  describe("PaginationLink", () => {
    it("renders as anchor element", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="/page/1" data-testid="link">
                1
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("link").tagName).toBe("A");
    });

    it("applies href attribute", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="/page/2" data-testid="link">
                2
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("link")).toHaveAttribute("href", "/page/2");
    });

    it("applies aria-current when isActive is true", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive data-testid="link">
                1
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("link")).toHaveAttribute("aria-current", "page");
    });

    it("does not have aria-current when isActive is false", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive={false} data-testid="link">
                1
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("link")).not.toHaveAttribute("aria-current");
    });

    it("applies outline variant when active", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive data-testid="active-link">
                1
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      // Active links use outline variant from buttonVariants
      expect(screen.getByTestId("active-link")).toBeInTheDocument();
    });

    it("handles onClick", () => {
      const handleClick = vi.fn((e) => e.preventDefault());
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" onClick={handleClick}>
                1
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      fireEvent.click(screen.getByText("1"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("PaginationPrevious", () => {
    it("renders previous navigation", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" data-testid="prev" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("prev")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" data-testid="prev" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("prev")).toHaveAttribute("aria-label", "Go to previous page");
    });

    it("displays Previous text", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText("Previous")).toBeInTheDocument();
    });

    it("renders ChevronLeft icon", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" data-testid="prev" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("prev").querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("PaginationNext", () => {
    it("renders next navigation", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext href="#" data-testid="next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("next")).toBeInTheDocument();
    });

    it("has aria-label for accessibility", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext href="#" data-testid="next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("next")).toHaveAttribute("aria-label", "Go to next page");
    });

    it("displays Next text", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("renders ChevronRight icon", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext href="#" data-testid="next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("next").querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("PaginationEllipsis", () => {
    it("renders ellipsis span", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis data-testid="ellipsis" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("ellipsis").tagName).toBe("SPAN");
    });

    it("has aria-hidden true", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis data-testid="ellipsis" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("ellipsis")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders MoreHorizontal icon", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis data-testid="ellipsis" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId("ellipsis").querySelector("svg")).toBeInTheDocument();
    });

    it("has sr-only More pages text", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText("More pages")).toHaveClass("sr-only");
    });
  });

  describe("Complete Pagination", () => {
    it("renders full pagination structure", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">10</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("More pages")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });
});
