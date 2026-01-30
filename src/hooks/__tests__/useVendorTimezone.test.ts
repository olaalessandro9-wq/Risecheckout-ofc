/**
 * useVendorTimezone.test.ts
 * 
 * Tests for useVendorTimezone hook
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock dependencies
vi.mock("./useUnifiedAuth", () => ({
  useUnifiedAuth: vi.fn(() => ({
    user: { id: "test-user", timezone: "America/New_York" },
  })),
}));

vi.mock("@/lib/timezone", () => ({
  TimezoneService: vi.fn().mockImplementation(({ timezone }) => ({
    timezone,
    format: vi.fn(),
    getDateBoundaries: vi.fn(),
  })),
  DEFAULT_TIMEZONE: "America/Sao_Paulo",
}));

import { useVendorTimezone } from "../useVendorTimezone";
import { useUnifiedAuth } from "../useUnifiedAuth";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

describe("useVendorTimezone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user configured timezone", () => {
    const { result } = renderHook(() => useVendorTimezone());

    expect(result.current.timezone).toBe("America/New_York");
    expect(result.current.isDefaultTimezone).toBe(false);
  });

  it("should return default timezone when user has no timezone", () => {
    vi.mocked(useUnifiedAuth).mockReturnValueOnce({
      user: { id: "test-user" },
    } as ReturnType<typeof useUnifiedAuth>);

    const { result } = renderHook(() => useVendorTimezone());

    expect(result.current.timezone).toBe(DEFAULT_TIMEZONE);
    expect(result.current.isDefaultTimezone).toBe(true);
  });

  it("should return default timezone when user is null", () => {
    vi.mocked(useUnifiedAuth).mockReturnValueOnce({
      user: null,
    } as ReturnType<typeof useUnifiedAuth>);

    const { result } = renderHook(() => useVendorTimezone());

    expect(result.current.timezone).toBe(DEFAULT_TIMEZONE);
    expect(result.current.isDefaultTimezone).toBe(true);
  });

  it("should provide a TimezoneService instance", () => {
    const { result } = renderHook(() => useVendorTimezone());

    expect(result.current.service).toBeDefined();
    expect(result.current.service.timezone).toBe("America/New_York");
  });

  it("should memoize the service", () => {
    const { result, rerender } = renderHook(() => useVendorTimezone());

    const firstService = result.current.service;
    rerender();
    const secondService = result.current.service;

    // Service should be the same object reference
    expect(firstService).toBe(secondService);
  });

  it("should create new service when timezone changes", () => {
    const { result, rerender } = renderHook(() => useVendorTimezone());

    const firstService = result.current.service;

    // Change timezone
    vi.mocked(useUnifiedAuth).mockReturnValue({
      user: { id: "test-user", timezone: "Europe/London" },
    } as ReturnType<typeof useUnifiedAuth>);

    rerender();
    const secondService = result.current.service;

    // Service should be different (new instance)
    expect(secondService.timezone).toBe("Europe/London");
  });

  it("should handle various timezone formats", () => {
    const timezones = [
      "America/Sao_Paulo",
      "Europe/London",
      "Asia/Tokyo",
      "Pacific/Auckland",
    ];

    for (const tz of timezones) {
      vi.mocked(useUnifiedAuth).mockReturnValueOnce({
        user: { id: "test-user", timezone: tz },
      } as ReturnType<typeof useUnifiedAuth>);

      const { result } = renderHook(() => useVendorTimezone());

      expect(result.current.timezone).toBe(tz);
      expect(result.current.isDefaultTimezone).toBe(false);
    }
  });
});
