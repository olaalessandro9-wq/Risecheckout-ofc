/**
 * @file ThemeToggle.test.tsx
 * @description Tests for ThemeToggle component
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import ThemeToggle from "../ThemeToggle";
import * as ThemeProvider from "@/providers/theme";

// ============================================================================
// MOCKS
// ============================================================================

// Mock theme provider
vi.mock("@/providers/theme", () => ({
  useTheme: vi.fn(),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Moon: ({ className }: any) => <div data-testid="moon-icon" className={className}>Moon</div>,
  Sun: ({ className }: any) => <div data-testid="sun-icon" className={className}>Sun</div>,
}));

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// ============================================================================
// TESTS
// ============================================================================

describe("ThemeToggle", () => {
  let setThemeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setThemeMock = vi.fn();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render toggle button", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: /alternar tema/i });
      expect(button).toBeInTheDocument();
    });

    it("should render with light theme styling", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema escuro");
    });

    it("should render with dark theme styling", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "dark",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema claro");
    });

    it("should render sun and moon icons", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const moonIcons = screen.getAllByTestId("moon-icon");
      const sunIcons = screen.getAllByTestId("sun-icon");

      expect(moonIcons.length).toBeGreaterThan(0);
      expect(sunIcons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should toggle from light to dark when clicked", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(setThemeMock).toHaveBeenCalledWith("dark");
    });

    it("should toggle from dark to light when clicked", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "dark",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(setThemeMock).toHaveBeenCalledWith("light");
    });

    it("should call setTheme only once per click", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(setThemeMock).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have aria-label", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Alternar tema");
    });

    it("should have descriptive title for light theme", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema escuro");
    });

    it("should have descriptive title for dark theme", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "dark",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema claro");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle multiple rapid clicks", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: "light",
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();
      button.click();
      button.click();

      expect(setThemeMock).toHaveBeenCalledTimes(3);
    });

    it("should render correctly when theme is undefined", () => {
      vi.mocked(ThemeProvider.useTheme).mockReturnValue({
        theme: undefined as any,
        setTheme: setThemeMock,
      } as any);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });
});
