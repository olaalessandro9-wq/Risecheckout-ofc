/**
 * Table Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Table components covering:
 * - Rendering of all sub-components
 * - Semantic HTML structure
 * - Styling and className merging
 * - Row selection state
 * - Caption support
 *
 * @module components/ui/__tests__/table.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../table";

describe("Table", () => {
  describe("Root Component", () => {
    it("renders table element", () => {
      render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("table").tagName).toBe("TABLE");
    });

    it("wraps table in overflow container", () => {
      render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = screen.getByTestId("table");
      const wrapper = table.parentElement;
      expect(wrapper).toHaveClass("relative", "w-full", "overflow-auto");
    });

    it("applies w-full and text-sm classes", () => {
      render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("table")).toHaveClass("w-full", "text-sm");
    });

    it("accepts custom className", () => {
      render(
        <Table className="custom-table" data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("table")).toHaveClass("custom-table");
    });
  });

  describe("TableHeader", () => {
    it("renders thead element", () => {
      render(
        <Table>
          <TableHeader data-testid="header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("header").tagName).toBe("THEAD");
    });

    it("applies border-b class to rows", () => {
      render(
        <Table>
          <TableHeader data-testid="header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("header")).toHaveClass("[&_tr]:border-b");
    });
  });

  describe("TableBody", () => {
    it("renders tbody element", () => {
      render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("body").tagName).toBe("TBODY");
    });

    it("removes border from last row", () => {
      render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("body")).toHaveClass("[&_tr:last-child]:border-0");
    });
  });

  describe("TableFooter", () => {
    it("renders tfoot element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByTestId("footer").tagName).toBe("TFOOT");
    });

    it("applies border-t and bg-muted classes", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByTestId("footer")).toHaveClass("border-t", "bg-muted/50", "font-medium");
    });
  });

  describe("TableRow", () => {
    it("renders tr element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("row").tagName).toBe("TR");
    });

    it("applies border-b and transition-colors classes", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("row")).toHaveClass("border-b", "transition-colors");
    });

    it("applies hover:bg-muted/50 class", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("row")).toHaveClass("hover:bg-muted/50");
    });

    it("supports data-state selected styling", () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row" data-state="selected">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("row")).toHaveClass("data-[state=selected]:bg-muted");
    });
  });

  describe("TableHead", () => {
    it("renders th element", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("head").tagName).toBe("TH");
    });

    it("applies h-12 and px-4 classes", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("head")).toHaveClass("h-12", "px-4");
    });

    it("applies text-left and font-medium classes", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("head")).toHaveClass("text-left", "font-medium", "text-muted-foreground");
    });
  });

  describe("TableCell", () => {
    it("renders td element", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("cell").tagName).toBe("TD");
    });

    it("applies p-4 and align-middle classes", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("cell")).toHaveClass("p-4", "align-middle");
    });
  });

  describe("TableCaption", () => {
    it("renders caption element", () => {
      render(
        <Table>
          <TableCaption data-testid="caption">Table caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("caption").tagName).toBe("CAPTION");
    });

    it("applies mt-4 and text-sm classes", () => {
      render(
        <Table>
          <TableCaption data-testid="caption">Table caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId("caption")).toHaveClass("mt-4", "text-sm", "text-muted-foreground");
    });

    it("displays caption text", () => {
      render(
        <Table>
          <TableCaption>A list of recent invoices</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("A list of recent invoices")).toBeInTheDocument();
    });
  });

  describe("Complete Table", () => {
    it("renders full table structure", () => {
      render(
        <Table>
          <TableCaption>Invoice list</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>$250.00</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>INV002</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>$150.00</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell>$400.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText("Invoice list")).toBeInTheDocument();
      expect(screen.getByText("Invoice")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("INV001")).toBeInTheDocument();
      expect(screen.getByText("INV002")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("$400.00")).toBeInTheDocument();
    });
  });
});
