/**
 * Theme Provider Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testes unitários para ThemeProvider e useTheme hook.
 * Valida persistência localStorage, manipulação classList e fallbacks.
 * 
 * @module providers/__tests__/theme.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../theme";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme("dark")} data-testid="set-dark">
        Dark
      </button>
      <button onClick={() => setTheme("light")} data-testid="set-light">
        Light
      </button>
    </div>
  );
}

// ============================================================================
// THEME PROVIDER TESTS
// ============================================================================

describe("ThemeProvider", () => {
  let originalLocalStorage: Storage;
  let originalClassList: DOMTokenList;

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalClassList = document.documentElement.classList;

    // Mock localStorage
    const storage: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete storage[key];
        }),
        clear: vi.fn(() => {
          Object.keys(storage).forEach((key) => delete storage[key]);
        }),
      },
      writable: true,
    });

    // Mock classList
    const classes = new Set<string>();
    Object.defineProperty(document.documentElement, "classList", {
      value: {
        add: vi.fn((cls: string) => classes.add(cls)),
        remove: vi.fn((...cls: string[]) => cls.forEach((c) => classes.delete(c))),
        contains: vi.fn((cls: string) => classes.has(cls)),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", { value: originalLocalStorage });
    Object.defineProperty(document.documentElement, "classList", { value: originalClassList });
    vi.clearAllMocks();
  });

  it("inicializa com tema do localStorage", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("inicializa com 'light' se localStorage vazio", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("inicializa com 'light' se localStorage inválido", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("invalid-theme");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("aplica classe ao documentElement", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.add).toHaveBeenCalledWith("dark");
  });

  it("remove classe anterior ao mudar tema", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("light");

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("set-dark").click();
    });

    expect(document.documentElement.classList.remove).toHaveBeenCalledWith("light", "dark");
    expect(document.documentElement.classList.add).toHaveBeenCalledWith("dark");
  });

  it("salva tema no localStorage ao mudar", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("set-dark").click();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("trata erro de localStorage graciosamente", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("localStorage disabled");
    });

    // Should not throw
    expect(() => {
      render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("renderiza children corretamente", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });
});

// ============================================================================
// USE THEME HOOK TESTS
// ============================================================================

describe("useTheme", () => {
  beforeEach(() => {
    const storage: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => storage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage[key] = value;
        }),
      },
      writable: true,
    });
  });

  it("retorna tema atual", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("permite mudar tema via setTheme", () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("set-dark").click();
    });

    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
  });

  it("retorna fallback fora do provider", () => {
    // Render without provider
    render(<TestConsumer />);

    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });

  it("fallback setTheme é no-op seguro", () => {
    render(<TestConsumer />);

    // Should not throw
    expect(() => {
      act(() => {
        screen.getByTestId("set-dark").click();
      });
    }).not.toThrow();

    // Theme should remain light (fallback)
    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
  });
});
