/**
 * useDebouncedWidth.test.ts
 * 
 * Tests for useDebouncedWidth hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedWidth } from "../useDebouncedWidth";

describe("useDebouncedWidth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return initial width immediately on first render", () => {
    const { result } = renderHook(() => useDebouncedWidth(1000));

    expect(result.current).toBe(1000);
  });

  it("should debounce width changes", () => {
    const { result, rerender } = renderHook(
      ({ width }) => useDebouncedWidth(width),
      { initialProps: { width: 1000 } }
    );

    expect(result.current).toBe(1000);

    // Change width
    rerender({ width: 1200 });

    // Should still be old value before delay
    expect(result.current).toBe(1000);

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current).toBe(1200);
  });

  it("should use custom delay", () => {
    const { result, rerender } = renderHook(
      ({ width, delay }) => useDebouncedWidth(width, delay),
      { initialProps: { width: 1000, delay: 500 } }
    );

    rerender({ width: 1200, delay: 500 });

    // Should still be old value after default delay
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current).toBe(1000);

    // Should update after custom delay
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(1200);
  });

  it("should reset debounce on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ width }) => useDebouncedWidth(width),
      { initialProps: { width: 1000 } }
    );

    // Rapid changes
    rerender({ width: 1100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ width: 1200 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ width: 1300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be original value
    expect(result.current).toBe(1000);

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Should have final value
    expect(result.current).toBe(1300);
  });

  it("should cleanup timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { unmount, rerender } = renderHook(
      ({ width }) => useDebouncedWidth(width),
      { initialProps: { width: 1000 } }
    );

    // Trigger a change to create a timeout
    rerender({ width: 1200 });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should handle zero width", () => {
    const { result } = renderHook(() => useDebouncedWidth(0));

    expect(result.current).toBe(0);
  });

  it("should handle negative width", () => {
    const { result } = renderHook(() => useDebouncedWidth(-100));

    expect(result.current).toBe(-100);
  });

  it("should update immediately after debounce completes for subsequent changes", () => {
    const { result, rerender } = renderHook(
      ({ width }) => useDebouncedWidth(width),
      { initialProps: { width: 1000 } }
    );

    // First change
    rerender({ width: 1200 });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current).toBe(1200);

    // Second change
    rerender({ width: 1400 });
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current).toBe(1400);
  });
});
