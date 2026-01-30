/**
 * Sonner Toaster Component Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for Sonner Toaster component covering:
 * - Toast function exports
 * - Component rendering
 *
 * @module components/ui/__tests__/sonner.test
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Toaster, toast } from "../sonner";

// Mock the ThemeProvider hook
vi.mock("@/providers/theme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

// Mock the logger
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("Sonner Toaster", () => {
  describe("Rendering", () => {
    it("should render Sonner Toaster", () => {
      const { container } = render(<Toaster />);
      expect(container).toBeInTheDocument();
    });

    it("should render section element", () => {
      const { container } = render(<Toaster />);
      expect(container.querySelector("section") || container.querySelector("ol")).toBeInTheDocument();
    });
  });

  describe("Toast Export", () => {
    it("should export toast function", () => {
      expect(toast).toBeDefined();
      expect(typeof toast).toBe("function");
    });

    it("toast should have success method", () => {
      expect(toast.success).toBeDefined();
      expect(typeof toast.success).toBe("function");
    });

    it("toast should have error method", () => {
      expect(toast.error).toBeDefined();
      expect(typeof toast.error).toBe("function");
    });

    it("toast should have warning method", () => {
      expect(toast.warning).toBeDefined();
      expect(typeof toast.warning).toBe("function");
    });

    it("toast should have info method", () => {
      expect(toast.info).toBeDefined();
      expect(typeof toast.info).toBe("function");
    });

    it("toast should have promise method", () => {
      expect(toast.promise).toBeDefined();
      expect(typeof toast.promise).toBe("function");
    });

    it("toast should have dismiss method", () => {
      expect(toast.dismiss).toBeDefined();
      expect(typeof toast.dismiss).toBe("function");
    });

    it("toast should have loading method", () => {
      expect(toast.loading).toBeDefined();
      expect(typeof toast.loading).toBe("function");
    });

    it("toast should have message method", () => {
      expect(toast.message).toBeDefined();
      expect(typeof toast.message).toBe("function");
    });

    it("toast should have custom method", () => {
      expect(toast.custom).toBeDefined();
      expect(typeof toast.custom).toBe("function");
    });
  });
});
