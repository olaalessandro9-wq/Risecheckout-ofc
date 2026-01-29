/**
 * Dialog Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Dialog components covering:
 * - Dialog open/close state
 * - DialogTrigger interaction
 * - DialogContent rendering
 * - DialogHeader, DialogFooter, DialogTitle, DialogDescription
 * - DialogContentWithoutClose variant
 *
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 *
 * @module components/ui/__tests__/dialog.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogContentWithoutClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../dialog";

describe("Dialog Components", () => {
  describe("Dialog (Root)", () => {
    it("controls open state", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not render content when closed", () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Hidden Dialog</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("calls onOpenChange when state changes", async () => {
      const handleChange = vi.fn();
      
      render(
        <Dialog onOpenChange={handleChange}>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      fireEvent.click(screen.getByTestId("trigger"));
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe("DialogTrigger", () => {
    it("renders trigger button", () => {
      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
        </Dialog>
      );
      expect(screen.getByTestId("trigger")).toBeInTheDocument();
      expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    });

    it("opens dialog on click", async () => {
      render(
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("DialogContent", () => {
    it("renders content with close button", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Description</DialogDescription>
            <p>Dialog body content</p>
          </DialogContent>
        </Dialog>
      );
      
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Dialog body content")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument(); // sr-only close button
    });

    it("forwards ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Dialog open>
          <DialogContent ref={ref}>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("applies base styling classes", () => {
      render(
        <Dialog open>
          <DialogContent data-testid="content">
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("fixed", "z-50", "grid", "gap-4", "border", "bg-background", "p-6", "shadow-lg");
    });

    it("merges custom className", () => {
      render(
        <Dialog open>
          <DialogContent className="max-w-xl" data-testid="content">
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const content = screen.getByTestId("content");
      expect(content).toHaveClass("max-w-xl");
    });

    it("closes on Escape key", async () => {
      const handleChange = vi.fn();
      
      render(
        <Dialog open onOpenChange={handleChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  describe("DialogContentWithoutClose", () => {
    it("renders without close button", () => {
      render(
        <Dialog open>
          <DialogContentWithoutClose data-testid="content">
            <DialogTitle>No Close Button</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContentWithoutClose>
        </Dialog>
      );
      
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.queryByText("Close")).not.toBeInTheDocument();
    });
  });

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
