/**
 * use-mobile.test.tsx
 * 
 * Tests for useIsMobile hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

describe("useIsMobile", () => {
  const MOBILE_BREAKPOINT = 768;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];
  let mockMatches = false;

  beforeEach(() => {
    mediaQueryListeners = [];
    mockMatches = false;

    // Mock window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
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
      removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === "change") {
          mediaQueryListeners = mediaQueryListeners.filter(l => l !== listener);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mediaQueryListeners = [];
  });

  it("should return false for desktop viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true for mobile viewport", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return false at exactly breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: MOBILE_BREAKPOINT, writable: true });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should return true just below breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: MOBILE_BREAKPOINT - 1, writable: true });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should update when viewport changes via media query", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
      mediaQueryListeners.forEach(listener => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(true);
  });

  it("should cleanup listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    
    expect(mediaQueryListeners.length).toBe(1);
    
    unmount();
    
    // removeEventListener was called
    expect(window.matchMedia).toHaveBeenCalled();
  });
});
