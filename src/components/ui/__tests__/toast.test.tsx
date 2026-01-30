/**
 * Toast Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Toast components covering:
 * - All exported sub-components
 * - Rendering and accessibility
 * - Variants and styling
 *
 * @module components/ui/__tests__/toast.test
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "../toast";

describe("Toast Components", () => {
  describe("ToastProvider", () => {
    it("should render children", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child Content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("ToastViewport", () => {
    it("should render viewport", () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );

      expect(screen.getByTestId("viewport")).toBeInTheDocument();
    });

    it("should apply fixed positioning", () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );

      expect(screen.getByTestId("viewport")).toHaveClass("fixed", "top-0", "z-[100]");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLOListElement>();
      render(
        <ToastProvider>
          <ToastViewport ref={ref} />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLOListElement);
    });

    it("should merge custom className", () => {
      render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" data-testid="viewport" />
        </ToastProvider>
      );

      expect(screen.getByTestId("viewport")).toHaveClass("custom-viewport");
    });
  });

  describe("Toast", () => {
    it("should render toast with default variant", () => {
      render(
        <ToastProvider>
          <Toast data-testid="toast">
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const toast = screen.getByTestId("toast");
      expect(toast).toHaveClass("border", "bg-background");
    });

    it("should render toast with destructive variant", () => {
      render(
        <ToastProvider>
          <Toast variant="destructive" data-testid="toast">
            <ToastTitle>Error</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const toast = screen.getByTestId("toast");
      expect(toast).toHaveClass("destructive", "border-destructive", "bg-destructive");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLLIElement>();
      render(
        <ToastProvider>
          <Toast ref={ref}>
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });

    it("should merge custom className", () => {
      render(
        <ToastProvider>
          <Toast className="custom-toast" data-testid="toast">
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("toast")).toHaveClass("custom-toast");
    });

    it("should apply flex layout", () => {
      render(
        <ToastProvider>
          <Toast data-testid="toast">
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const toast = screen.getByTestId("toast");
      expect(toast).toHaveClass("flex", "items-center", "justify-between");
    });
  });

  describe("ToastTitle", () => {
    it("should render title", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Success!</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText("Success!")).toBeInTheDocument();
    });

    it("should apply font styling", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle data-testid="title">Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("title")).toHaveClass("text-sm", "font-semibold");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle ref={ref}>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ToastDescription", () => {
    it("should render description", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription>This is a description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should apply styling", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription data-testid="desc">Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("desc")).toHaveClass("text-sm", "opacity-90");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ToastProvider>
          <Toast>
            <ToastDescription ref={ref}>Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("ToastClose", () => {
    it("should render close button", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Title</ToastTitle>
            <ToastClose data-testid="close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("close")).toBeInTheDocument();
    });

    it("should contain X icon", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastClose data-testid="close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const closeBtn = screen.getByTestId("close");
      expect(closeBtn.querySelector("svg")).toBeInTheDocument();
    });

    it("should apply positioning", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastClose data-testid="close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("close")).toHaveClass("absolute", "right-2", "top-2");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ToastProvider>
          <Toast>
            <ToastClose ref={ref} />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("should have toast-close attribute", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastClose data-testid="close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("close")).toHaveAttribute("toast-close");
    });
  });

  describe("ToastAction", () => {
    it("should render action button", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastAction altText="Undo">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("should apply button styling", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastAction altText="Retry" data-testid="action">
              Retry
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const action = screen.getByTestId("action");
      expect(action).toHaveClass("inline-flex", "h-8", "shrink-0", "items-center");
    });

    it("should forward ref correctly", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ToastProvider>
          <Toast>
            <ToastAction ref={ref} altText="Action">
              Action
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("should merge custom className", () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastAction altText="Custom" className="custom-action">
              Custom
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText("Custom")).toHaveClass("custom-action");
    });
  });

  describe("Complete Toast", () => {
    it("should render a complete toast notification", () => {
      render(
        <ToastProvider>
          <Toast>
            <div className="grid gap-1">
              <ToastTitle>Scheduled: Catch up</ToastTitle>
              <ToastDescription>Friday, February 10, 2023 at 5:57 PM</ToastDescription>
            </div>
            <ToastAction altText="Undo action">Undo</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText("Scheduled: Catch up")).toBeInTheDocument();
      expect(screen.getByText("Friday, February 10, 2023 at 5:57 PM")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("should render destructive toast", () => {
      render(
        <ToastProvider>
          <Toast variant="destructive" data-testid="toast">
            <div className="grid gap-1">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Something went wrong.</ToastDescription>
            </div>
            <ToastAction altText="Try again">Try again</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId("toast")).toHaveClass("destructive");
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });
});
