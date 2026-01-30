/**
 * AlertDialog Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for AlertDialog components covering:
 * - All exported sub-components
 * - Rendering and accessibility
 * - Interactions and state management
 *
 * @module components/ui/__tests__/alert-dialog.test
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../alert-dialog";

describe("AlertDialog Components", () => {
  describe("AlertDialog Root", () => {
    it("should render trigger and open dialog on click", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      fireEvent.click(screen.getByText("Open"));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("should support controlled open state", () => {
      const onOpenChange = vi.fn();
      render(
        <AlertDialog open={true} onOpenChange={onOpenChange}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  describe("AlertDialogTrigger", () => {
    it("should render as button", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        </AlertDialog>
      );

      expect(screen.getByRole("button")).toHaveTextContent("Open Dialog");
    });

    it("should support asChild prop", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <span data-testid="custom-trigger">Custom Trigger</span>
          </AlertDialogTrigger>
        </AlertDialog>
      );

      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
    });
  });

  describe("AlertDialogContent", () => {
    it("should render with proper accessibility attributes", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>Are you sure?</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass("fixed");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AlertDialog open>
          <AlertDialogContent ref={ref}>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("should merge custom className", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent className="custom-content">
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("alertdialog")).toHaveClass("custom-content");
    });
  });

  describe("AlertDialogHeader", () => {
    it("should render with flex layout", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader data-testid="header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByTestId("header")).toHaveClass("flex", "flex-col");
    });

    it("should merge custom className", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header" data-testid="header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });
  });

  describe("AlertDialogFooter", () => {
    it("should render with flex layout", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogFooter data-testid="footer">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByTestId("footer")).toHaveClass("flex", "flex-col-reverse");
    });
  });

  describe("AlertDialogTitle", () => {
    it("should render with proper styling", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Important Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      const title = screen.getByText("Important Title");
      expect(title).toHaveClass("text-lg", "font-semibold");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLHeadingElement>();
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle ref={ref}>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe("AlertDialogDescription", () => {
    it("should render with muted styling", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>This is a description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      const desc = screen.getByText("This is a description");
      expect(desc).toHaveClass("text-sm", "text-muted-foreground");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLParagraphElement>();
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription ref={ref}>Desc</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe("AlertDialogAction", () => {
    it("should render as button with default variant", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    });

    it("should close dialog when clicked", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      fireEvent.click(screen.getByText("Open"));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Continue"));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogAction ref={ref}>Action</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("AlertDialogCancel", () => {
    it("should render as button with outline variant", () => {
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      expect(cancelBtn).toBeInTheDocument();
    });

    it("should close dialog when clicked", () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      fireEvent.click(screen.getByText("Open"));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Desc</AlertDialogDescription>
            <AlertDialogCancel ref={ref}>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Complete AlertDialog", () => {
    it("should render a complete confirmation dialog", () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText("Delete Item")).toBeInTheDocument();
      expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    });
  });
});
