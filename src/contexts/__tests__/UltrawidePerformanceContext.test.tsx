/**
 * Ultrawide Performance Context Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testes unitários para UltrawidePerformanceProvider e hooks relacionados.
 * Valida detecção de monitores ultrawide via matchMedia e configurações de performance.
 * 
 * @module contexts/__tests__/UltrawidePerformanceContext.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  UltrawidePerformanceProvider,
  useUltrawidePerformance,
  useChartPerformanceConfig,
} from "../UltrawidePerformanceContext";

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

type MediaQueryListener = (e: MediaQueryListEvent) => void;

function createMatchMediaMock(matches: boolean) {
  const listeners: MediaQueryListener[] = [];

  const mediaQueryList = {
    matches,
    media: "(min-width: 2560px)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, listener: MediaQueryListener) => {
      if (event === "change") listeners.push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: MediaQueryListener) => {
      if (event === "change") {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    // Helper para simular mudanças
    _triggerChange: (newMatches: boolean) => {
      mediaQueryList.matches = newMatches;
      listeners.forEach((l) => l({ matches: newMatches } as MediaQueryListEvent));
    },
  };

  return vi.fn().mockReturnValue(mediaQueryList);
}

function TestConsumer() {
  const { isUltrawide, disableAnimations, disableBlur, disableHoverEffects } =
    useUltrawidePerformance();

  return (
    <div>
      <span data-testid="is-ultrawide">{isUltrawide ? "yes" : "no"}</span>
      <span data-testid="disable-animations">{disableAnimations ? "yes" : "no"}</span>
      <span data-testid="disable-blur">{disableBlur ? "yes" : "no"}</span>
      <span data-testid="disable-hover">{disableHoverEffects ? "yes" : "no"}</span>
    </div>
  );
}

function ChartConfigConsumer() {
  const chartConfig = useChartPerformanceConfig();

  return (
    <div>
      <span data-testid="animation-active">{chartConfig.isAnimationActive ? "yes" : "no"}</span>
      <span data-testid="animation-duration">{chartConfig.animationDuration}</span>
      <span data-testid="stroke-width">{chartConfig.strokeWidth}</span>
      <span data-testid="debounce">{chartConfig.debounce}</span>
      <span data-testid="has-dot">{chartConfig.dot ? "yes" : "no"}</span>
    </div>
  );
}

// ============================================================================
// ULTRAWIDE PERFORMANCE PROVIDER TESTS
// ============================================================================

describe("UltrawidePerformanceProvider", () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "innerWidth", { value: originalInnerWidth, writable: true });
    vi.clearAllMocks();
  });

  it("detecta monitor ultrawide (≥2560px)", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("yes");
  });

  it("detecta monitor normal (<2560px)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true });
    window.matchMedia = createMatchMediaMock(false);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("no");
  });

  it("responde a mudanças de media query", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true });
    const mockMatchMedia = createMatchMediaMock(false);
    window.matchMedia = mockMatchMedia;

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("no");

    // Simulate resize to ultrawide
    act(() => {
      mockMatchMedia()._triggerChange(true);
    });

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("yes");
  });

  it("disableAnimations é true para ultrawide", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("disable-animations")).toHaveTextContent("yes");
  });

  it("disableBlur é true para ultrawide", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("disable-blur")).toHaveTextContent("yes");
  });

  it("disableHoverEffects é true para ultrawide", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("disable-hover")).toHaveTextContent("yes");
  });

  it("renderiza children corretamente", () => {
    window.matchMedia = createMatchMediaMock(false);

    render(
      <UltrawidePerformanceProvider>
        <div data-testid="child">Child Content</div>
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });
});

// ============================================================================
// CHART CONFIG TESTS
// ============================================================================

describe("Chart Performance Config", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("retorna chartConfig padrão para normal", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true });
    window.matchMedia = createMatchMediaMock(false);

    render(
      <UltrawidePerformanceProvider>
        <ChartConfigConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("animation-active")).toHaveTextContent("yes");
    expect(screen.getByTestId("animation-duration")).toHaveTextContent("250");
    expect(screen.getByTestId("stroke-width")).toHaveTextContent("3");
    expect(screen.getByTestId("debounce")).toHaveTextContent("400");
    expect(screen.getByTestId("has-dot")).toHaveTextContent("yes");
  });

  it("retorna chartConfig otimizado para ultrawide", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <ChartConfigConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("animation-active")).toHaveTextContent("no");
    expect(screen.getByTestId("animation-duration")).toHaveTextContent("0");
    expect(screen.getByTestId("stroke-width")).toHaveTextContent("2");
    expect(screen.getByTestId("debounce")).toHaveTextContent("600");
    expect(screen.getByTestId("has-dot")).toHaveTextContent("no");
  });
});

// ============================================================================
// HOOKS TESTS
// ============================================================================

describe("useUltrawidePerformance", () => {
  it("retorna valor padrão fora do provider", () => {
    render(<TestConsumer />);

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("no");
    expect(screen.getByTestId("disable-animations")).toHaveTextContent("no");
  });

  it("retorna valor correto dentro do provider", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <TestConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("is-ultrawide")).toHaveTextContent("yes");
  });
});

describe("useChartPerformanceConfig", () => {
  it("retorna apenas chartConfig", () => {
    window.matchMedia = createMatchMediaMock(false);

    render(
      <UltrawidePerformanceProvider>
        <ChartConfigConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("animation-active")).toBeInTheDocument();
    expect(screen.getByTestId("debounce")).toBeInTheDocument();
  });

  it("retorna config correto baseado em ultrawide", () => {
    Object.defineProperty(window, "innerWidth", { value: 2560, writable: true });
    window.matchMedia = createMatchMediaMock(true);

    render(
      <UltrawidePerformanceProvider>
        <ChartConfigConsumer />
      </UltrawidePerformanceProvider>
    );

    expect(screen.getByTestId("animation-active")).toHaveTextContent("no");
  });
});
