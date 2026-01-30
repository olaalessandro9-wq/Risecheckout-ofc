/**
 * Toaster Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Toaster component covering:
 * - Rendering with toast hook
 * - Toast display
 * - Component structure
 *
 * @module components/ui/__tests__/toaster.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toaster } from "../toaster";

// Mock the useToast hook
const mockToasts: Array<{
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}> = [];

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toasts: mockToasts,
  }),
}));

describe("Toaster", () => {
  beforeEach(() => {
    mockToasts.length = 0;
  });

  describe("Rendering", () => {
    it("should render ToastProvider and ToastViewport", () => {
      render(<Toaster />);
      // ToastViewport is rendered with specific classes
      const viewport = document.querySelector("[class*='fixed']");
      expect(viewport).toBeInTheDocument();
    });

    it("should render without toasts initially", () => {
      render(<Toaster />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("With Toasts", () => {
    it("should render toast with title", () => {
      mockToasts.push({
        id: "1",
        title: "Success",
      });

      render(<Toaster />);
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("should render toast with description", () => {
      mockToasts.push({
        id: "1",
        description: "Your action was successful",
      });

      render(<Toaster />);
      expect(screen.getByText("Your action was successful")).toBeInTheDocument();
    });

    it("should render toast with title and description", () => {
      mockToasts.push({
        id: "1",
        title: "Saved",
        description: "Your changes have been saved.",
      });

      render(<Toaster />);
      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(screen.getByText("Your changes have been saved.")).toBeInTheDocument();
    });

    it("should render multiple toasts", () => {
      mockToasts.push(
        { id: "1", title: "First Toast" },
        { id: "2", title: "Second Toast" },
        { id: "3", title: "Third Toast" }
      );

      render(<Toaster />);
      expect(screen.getByText("First Toast")).toBeInTheDocument();
      expect(screen.getByText("Second Toast")).toBeInTheDocument();
      expect(screen.getByText("Third Toast")).toBeInTheDocument();
    });

    it("should render toast with action", () => {
      mockToasts.push({
        id: "1",
        title: "Deleted",
        action: <button>Undo</button>,
      });

      render(<Toaster />);
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    it("should render ToastClose button", () => {
      mockToasts.push({
        id: "1",
        title: "Closeable",
      });

      render(<Toaster />);
      // ToastClose has toast-close attribute
      const closeBtn = document.querySelector("[toast-close]");
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe("Toast Structure", () => {
    it("should render toast content in grid layout", () => {
      mockToasts.push({
        id: "1",
        title: "Title",
        description: "Description",
      });

      render(<Toaster />);
      const grid = document.querySelector(".grid.gap-1");
      expect(grid).toBeInTheDocument();
    });

    it("should assign unique keys to toasts", () => {
      mockToasts.push(
        { id: "toast-1", title: "Toast 1" },
        { id: "toast-2", title: "Toast 2" }
      );

      render(<Toaster />);
      // Both toasts should be rendered (different keys)
      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
    });
  });
});
