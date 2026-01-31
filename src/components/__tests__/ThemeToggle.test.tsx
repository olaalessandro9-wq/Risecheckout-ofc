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
// TYPES
// ============================================================================

type Theme = "light" | "dark";

interface MockThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("@/providers/theme", () => ({
  useTheme: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Moon: ({ className }: { className?: string }) => <div data-testid="moon-icon" className={className}>Moon</div>,
  Sun: ({ className }: { className?: string }) => <div data-testid="sun-icon" className={className}>Sun</div>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// ============================================================================
// FACTORY
// ============================================================================

function createMockTheme(theme: Theme): MockThemeReturn {
  return {
    theme,
    setTheme: vi.fn() as (theme: Theme) => void,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render toggle button", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: /alternar tema/i });
      expect(button).toBeInTheDocument();
    });

    it("should render with light theme styling", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema escuro");
    });

    it("should render with dark theme styling", () => {
      const mockTheme = createMockTheme("dark");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema claro");
    });

    it("should render sun and moon icons", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const moonIcons = screen.getAllByTestId("moon-icon");
      const sunIcons = screen.getAllByTestId("sun-icon");

      expect(moonIcons.length).toBeGreaterThan(0);
      expect(sunIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Interactions", () => {
    it("should toggle from light to dark when clicked", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(mockTheme.setTheme).toHaveBeenCalledWith("dark");
    });

    it("should toggle from dark to light when clicked", () => {
      const mockTheme = createMockTheme("dark");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(mockTheme.setTheme).toHaveBeenCalledWith("light");
    });

    it("should call setTheme only once per click", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();

      expect(mockTheme.setTheme).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Alternar tema");
    });

    it("should have descriptive title for light theme", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema escuro");
    });

    it("should have descriptive title for dark theme", () => {
      const mockTheme = createMockTheme("dark");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Ir para tema claro");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid clicks", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      button.click();
      button.click();
      button.click();

      expect(mockTheme.setTheme).toHaveBeenCalledTimes(3);
    });

    it("should render correctly when theme is light (default)", () => {
      const mockTheme = createMockTheme("light");
      vi.mocked(ThemeProvider.useTheme).mockReturnValue(mockTheme);

      render(<ThemeToggle />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });
});
