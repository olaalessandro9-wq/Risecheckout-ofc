/**
 * Dialog Core Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for core Dialog components:
 * - Dialog (Root): open/close state management
 * - DialogTrigger: user interaction
 * - DialogContent: rendering, styling, accessibility
 * - DialogContentWithoutClose: variant without close button
 *
 * Note: Uses fireEvent instead of userEvent due to clipboard compatibility
 *
 * @module components/ui/__tests__/dialog-core.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import { createRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogContentWithoutClose,
  DialogTitle,
  DialogDescription,
} from "../dialog";

describe("Dialog Core Components", () => {
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

    it("calls onOpenChange when state changes", () => {
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

    it("opens dialog on click", () => {
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
      expect(screen.getByText("Close")).toBeInTheDocument();
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

    it("closes on Escape key", () => {
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
});
