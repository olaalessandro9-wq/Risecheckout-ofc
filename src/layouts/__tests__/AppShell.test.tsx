/**
 * @file AppShell.test.tsx
 * @description Tests for AppShell layout
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import AppShell from "../AppShell";

// Import mocks
import "./_shared";

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<AppShell />);
      expect(container).toBeTruthy();
    });

    it("should render layout structure", () => {
      const { container } = render(<AppShell />);
      expect(container.firstChild).toBeTruthy();
    });

    it("should have main content area", () => {
      const { container } = render(<AppShell />);
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("Structure", () => {
    it("should have main container", () => {
      const { container } = render(<AppShell />);
      const mainContainer = container.querySelector("main");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should apply correct layout classes", () => {
      const { container } = render(<AppShell />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
    });
  });
});
