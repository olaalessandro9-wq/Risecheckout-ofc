/**
 * Dialog Parts Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Dialog sub-components:
 * - DialogHeader: layout and responsive styling
 * - DialogFooter: layout and alignment
 * - DialogTitle: text rendering and typography
 * - DialogDescription: text rendering and muted styling
 *
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 *
 * @module components/ui/__tests__/dialog-parts.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { createRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../dialog";

describe("Dialog Parts Components", () => {
  describe("DialogHeader", () => {
    it("renders with flex layout", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader data-testid="header">
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId("header");
      expect(header).toHaveClass("flex", "flex-col", "space-y-1.5");
    });

    it("applies text-center on mobile (sm:text-left)", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader data-testid="header">
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId("header");
      expect(header).toHaveClass("text-center", "sm:text-left");
    });
  });

  describe("DialogFooter", () => {
    it("renders with flex layout", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
            <DialogFooter data-testid="footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("flex", "flex-col-reverse", "sm:flex-row", "sm:justify-end");
    });
  });

  describe("DialogTitle", () => {
    it("renders title text", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText("My Dialog Title")).toBeInTheDocument();
    });

    it("applies title styling", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle data-testid="title">Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("text-lg", "font-semibold", "leading-none", "tracking-tight");
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLHeadingElement>();
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle ref={ref}>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe("DialogDescription", () => {
    it("renders description text", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>This is a helpful description.</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText("This is a helpful description.")).toBeInTheDocument();
    });

    it("applies muted foreground color", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription data-testid="desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-sm", "text-muted-foreground");
    });
  });
});
