/**
 * useIsUltrawide.test.ts
 * 
 * Tests for useIsUltrawide and useUltrawidePerformance hooks
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsUltrawide, useUltrawidePerformance } from "../useIsUltrawide";

describe("useIsUltrawide", () => {
  const ULTRAWIDE_BREAKPOINT = 2560;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];
  let mockMatches = false;

  beforeEach(() => {
    mediaQueryListeners = [];
    mockMatches = false;

    // Mock window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: mockMatches,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === "change") {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mediaQueryListeners = [];
  });

  it("should return false for standard viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true });
    mockMatches = false;

    const { result } = renderHook(() => useIsUltrawide());
    expect(result.current).toBe(false);
  });

  it("should return true for ultrawide viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 3440, writable: true });
    mockMatches = true;

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn((_, listener) => mediaQueryListeners.push(listener)),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsUltrawide());
    expect(result.current).toBe(true);
  });

  it("should return true at exactly 2560px", () => {
    Object.defineProperty(window, "innerWidth", { value: ULTRAWIDE_BREAKPOINT, writable: true });
    mockMatches = true;

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn((_, listener) => mediaQueryListeners.push(listener)),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsUltrawide());
    expect(result.current).toBe(true);
  });

  it("should return false just below breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: ULTRAWIDE_BREAKPOINT - 1, writable: true });
    mockMatches = false;

    const { result } = renderHook(() => useIsUltrawide());
    expect(result.current).toBe(false);
  });

  it("should update when media query changes", () => {
    const { result } = renderHook(() => useIsUltrawide());
    expect(result.current).toBe(false);

    // Simulate resize to ultrawide
    act(() => {
      mediaQueryListeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it("should cleanup listener on unmount", () => {
    const mockRemoveListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn((_, listener) => mediaQueryListeners.push(listener)),
      removeEventListener: mockRemoveListener,
    }));

    const { unmount } = renderHook(() => useIsUltrawide());
    unmount();

    expect(mockRemoveListener).toHaveBeenCalled();
  });
});

describe("useUltrawidePerformance", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1920,
    });

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return performance config for standard viewport", () => {
    const { result } = renderHook(() => useUltrawidePerformance());

    expect(result.current.isUltrawide).toBe(false);
    expect(result.current.disableAnimations).toBe(false);
    expect(result.current.disableBlur).toBe(false);
    expect(result.current.disableHoverEffects).toBe(false);
    expect(result.current.simplifyTransitions).toBe(false);
  });

  it("should return performance config for ultrawide viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 3440, writable: true });
    
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useUltrawidePerformance());

    expect(result.current.isUltrawide).toBe(true);
    expect(result.current.disableAnimations).toBe(true);
    expect(result.current.disableBlur).toBe(true);
    expect(result.current.disableHoverEffects).toBe(true);
    expect(result.current.simplifyTransitions).toBe(true);
  });

  it("should memoize the config object", () => {
    const { result, rerender } = renderHook(() => useUltrawidePerformance());

    const firstConfig = result.current;
    rerender();
    const secondConfig = result.current;

    // Should be the same object reference due to useMemo
    expect(firstConfig).toBe(secondConfig);
  });
});
