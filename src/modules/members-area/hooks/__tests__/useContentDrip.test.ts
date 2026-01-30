/**
 * useContentDrip Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests content drip/release settings and access calculations
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useContentDrip } from "../useContentDrip";
import { api } from "@/lib/api";
import type { ContentReleaseSettings, ContentAccessStatus } from "../../types";

// Mock api
vi.mock("@/lib/api", () => ({
  api: {
    call: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Factory for complete ContentReleaseSettings
function createMockReleaseSettings(
  overrides: Partial<ContentReleaseSettings> = {}
): ContentReleaseSettings {
  return {
    id: "drip-1",
    content_id: "content-1",
    release_type: "immediate",
    days_after_purchase: null,
    fixed_date: null,
    after_content_id: null,
    ...overrides,
  };
}

describe("useContentDrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with isLoading false", () => {
      const { result } = renderHook(() => useContentDrip());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("getDripSettings", () => {
    it("should fetch and map drip settings", async () => {
      const mockSettings = [
        {
          id: "drip-1",
          content_id: "content-1",
          release_type: "days_after_purchase",
          days_after_purchase: 7,
          fixed_date: null,
          after_content_id: null,
        },
        {
          id: "drip-2",
          content_id: "content-2",
          release_type: "fixed_date",
          days_after_purchase: null,
          fixed_date: "2025-06-01",
          after_content_id: null,
        },
      ];

      (api.call as Mock).mockResolvedValueOnce({
        data: { settings: mockSettings },
        error: null,
      });

      const { result } = renderHook(() => useContentDrip());

      let settingsMap: Map<string, ContentReleaseSettings> = new Map();
      await act(async () => {
        settingsMap = await result.current.getDripSettings("product-1");
      });

      expect(settingsMap.size).toBe(2);
      expect(settingsMap.get("content-1")).toEqual({
        id: "drip-1",
        content_id: "content-1",
        release_type: "days_after_purchase",
        days_after_purchase: 7,
        fixed_date: null,
        after_content_id: null,
      });
      expect(settingsMap.get("content-2")?.release_type).toBe("fixed_date");
    });

    it("should return empty map on error", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Failed to fetch" },
      });

      const { result } = renderHook(() => useContentDrip());

      let settingsMap: Map<string, ContentReleaseSettings> = new Map();
      await act(async () => {
        settingsMap = await result.current.getDripSettings("product-1");
      });

      expect(settingsMap.size).toBe(0);
    });
  });

  describe("calculateUnlockDate", () => {
    it("should return null for immediate release", () => {
      const { result } = renderHook(() => useContentDrip());

      const settings = createMockReleaseSettings({
        release_type: "immediate",
      });

      const unlockDate = result.current.calculateUnlockDate(settings, "2025-01-01");
      expect(unlockDate).toBeNull();
    });

    it("should calculate days after purchase correctly", () => {
      const { result } = renderHook(() => useContentDrip());

      const settings = createMockReleaseSettings({
        release_type: "days_after_purchase",
        days_after_purchase: 7,
      });

      const unlockDate = result.current.calculateUnlockDate(settings, "2025-01-01T00:00:00Z");
      
      expect(unlockDate).not.toBeNull();
      expect(unlockDate?.getDate()).toBe(8); // Jan 1 + 7 days = Jan 8
    });

    it("should return fixed date for fixed_date release", () => {
      const { result } = renderHook(() => useContentDrip());

      const settings = createMockReleaseSettings({
        release_type: "fixed_date",
        fixed_date: "2025-06-15T00:00:00Z",
      });

      const unlockDate = result.current.calculateUnlockDate(settings, "2025-01-01");
      
      expect(unlockDate).not.toBeNull();
      expect(unlockDate?.getMonth()).toBe(5); // June (0-indexed)
      expect(unlockDate?.getDate()).toBe(15);
    });

    it("should return null for after_content release type", () => {
      const { result } = renderHook(() => useContentDrip());

      const settings = createMockReleaseSettings({
        release_type: "after_content",
        after_content_id: "prev-content",
      });

      const unlockDate = result.current.calculateUnlockDate(settings, "2025-01-01");
      expect(unlockDate).toBeNull();
    });

    it("should return null for days_after without days value", () => {
      const { result } = renderHook(() => useContentDrip());

      const settings = createMockReleaseSettings({
        release_type: "days_after_purchase",
        days_after_purchase: null,
      });

      const unlockDate = result.current.calculateUnlockDate(settings, "2025-01-01");
      expect(unlockDate).toBeNull();
    });
  });

  describe("checkContentAccess", () => {
    it("should check content access successfully", async () => {
      const mockAccess: ContentAccessStatus = {
        content_id: "content-1",
        is_accessible: true,
        unlock_date: null,
        reason: "available",
      };

      (api.call as Mock).mockResolvedValueOnce({
        data: mockAccess,
        error: null,
      });

      const { result } = renderHook(() => useContentDrip());

      let accessStatus: ContentAccessStatus | null = null;
      await act(async () => {
        accessStatus = await result.current.checkContentAccess(
          "content-1",
          "buyer-1",
          "2025-01-01"
        );
      });

      expect(accessStatus).toEqual(mockAccess);
      expect(api.call).toHaveBeenCalledWith("admin-data", {
        action: "content-access-check",
        contentId: "content-1",
        buyerId: "buyer-1",
        purchaseDate: "2025-01-01",
      });
    });

    it("should return default accessible status on error", async () => {
      (api.call as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Failed" },
      });

      const { result } = renderHook(() => useContentDrip());

      let accessStatus: ContentAccessStatus | null = null;
      await act(async () => {
        accessStatus = await result.current.checkContentAccess(
          "content-1",
          "buyer-1",
          "2025-01-01"
        );
      });

      expect(accessStatus).toEqual({
        content_id: "content-1",
        is_accessible: true,
        unlock_date: null,
        reason: "available",
      });
    });
  });
});
