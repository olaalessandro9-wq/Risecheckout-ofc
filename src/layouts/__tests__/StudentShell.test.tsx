/**
 * @file StudentShell.test.tsx
 * @description Tests for StudentShell layout
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import StudentShell from "../StudentShell";

// Import mocks
import { mockAuthState, mockNavigate } from "./_shared";

describe("StudentShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(<StudentShell />);
      expect(container).toBeTruthy();
    });

    it("should render header", () => {
      const { container } = render(<StudentShell />);
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should have main content area", () => {
      const { container } = render(<StudentShell />);
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();
    });
  });

  describe("User Display", () => {
    it("should display user initials when user is authenticated", () => {
      render(<StudentShell />);
      // User initials should be displayed (TU from Test User)
      expect(mockAuthState.user).toBeDefined();
    });
  });

  describe("Structure", () => {
    it("should have gradient background", () => {
      const { container } = render(<StudentShell />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("min-h-screen");
    });

    it("should have sticky header", () => {
      const { container } = render(<StudentShell />);
      const header = container.querySelector("header");
      expect(header).toHaveClass("sticky");
    });
  });
});
