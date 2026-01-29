/**
 * Upload Utils Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for upload utility functions:
 * - Get all components from customization
 * - Check for pending uploads
 * - Wait for uploads to finish
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAllComponentsFromCustomization,
  hasPendingUploads,
  waitForUploadsToFinish,
} from "../uploadUtils";

describe("uploadUtils", () => {
  // ========== GET ALL COMPONENTS FROM CUSTOMIZATION ==========

  describe("getAllComponentsFromCustomization", () => {
    it("should get components from topComponents", () => {
      const customization = {
        topComponents: [
          { type: "header", content: {} },
          { type: "banner", content: {} },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("header");
    });

    it("should get components from bottomComponents", () => {
      const customization = {
        bottomComponents: [
          { type: "footer", content: {} },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("footer");
    });

    it("should get components from rows with columns as array", () => {
      const customization = {
        rows: [
          {
            columns: [
              [{ type: "image", content: {} }, { type: "text", content: {} }],
              [{ type: "button", content: {} }],
            ],
          },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toHaveLength(3);
    });

    it("should get components from rows with single column", () => {
      const customization = {
        rows: [
          {
            columns: [
              { type: "single", content: {} },
            ],
          },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toHaveLength(1);
    });

    it("should handle empty customization", () => {
      const customization = {};

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toEqual([]);
    });

    it("should combine all sources", () => {
      const customization = {
        topComponents: [{ type: "top", content: {} }],
        bottomComponents: [{ type: "bottom", content: {} }],
        rows: [
          {
            columns: [
              [{ type: "row", content: {} }],
            ],
          },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toHaveLength(3);
    });

    it("should handle null columns", () => {
      const customization = {
        rows: [
          {
            columns: [null, undefined],
          },
        ],
      };

      const result = getAllComponentsFromCustomization(customization);

      expect(result).toEqual([]);
    });
  });

  // ========== HAS PENDING UPLOADS ==========

  describe("hasPendingUploads", () => {
    it("should return true when component has _uploading flag", () => {
      const customization = {
        topComponents: [
          { type: "image", content: { _uploading: true } },
        ],
      };

      expect(hasPendingUploads(customization)).toBe(true);
    });

    it("should return false when no components are uploading", () => {
      const customization = {
        topComponents: [
          { type: "image", content: { url: "image.jpg" } },
        ],
      };

      expect(hasPendingUploads(customization)).toBe(false);
    });

    it("should return false when _uploading is false", () => {
      const customization = {
        topComponents: [
          { type: "image", content: { _uploading: false } },
        ],
      };

      expect(hasPendingUploads(customization)).toBe(false);
    });

    it("should return true if any component is uploading", () => {
      const customization = {
        topComponents: [
          { type: "image", content: { url: "done.jpg" } },
        ],
        bottomComponents: [
          { type: "image", content: { _uploading: true } },
        ],
      };

      expect(hasPendingUploads(customization)).toBe(true);
    });

    it("should return false for empty customization", () => {
      const customization = {};

      expect(hasPendingUploads(customization)).toBe(false);
    });

    it("should handle components without content", () => {
      const customization = {
        topComponents: [
          { type: "spacer" },
        ],
      };

      expect(hasPendingUploads(customization)).toBe(false);
    });
  });

  // ========== WAIT FOR UPLOADS TO FINISH ==========

  describe("waitForUploadsToFinish", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve when no uploads pending", async () => {
      const getCustomization = vi.fn().mockReturnValue({
        topComponents: [{ type: "text", content: {} }],
      });

      const promise = waitForUploadsToFinish(getCustomization, 5000);
      
      // Run the first interval check
      await vi.runOnlyPendingTimersAsync();
      
      await expect(promise).resolves.toBe(true);
    });

    it("should poll until uploads complete", async () => {
      let uploading = true;
      const getCustomization = vi.fn().mockImplementation(() => ({
        topComponents: [{ type: "image", content: { _uploading: uploading } }],
      }));

      const promise = waitForUploadsToFinish(getCustomization, 5000);

      // First poll - still uploading
      await vi.advanceTimersByTimeAsync(300);
      expect(getCustomization).toHaveBeenCalled();

      // Second poll - still uploading
      await vi.advanceTimersByTimeAsync(300);

      // Complete upload
      uploading = false;
      
      // Third poll - should detect completion
      await vi.advanceTimersByTimeAsync(300);

      await expect(promise).resolves.toBe(true);
    });

    it("should reject on timeout", async () => {
      const getCustomization = vi.fn().mockReturnValue({
        topComponents: [{ type: "image", content: { _uploading: true } }],
      });

      const promise = waitForUploadsToFinish(getCustomization, 1000);

      // Catch early to avoid unhandled rejection warning
      const resultPromise = promise.catch((err) => err);

      // Advance past timeout
      await vi.advanceTimersByTimeAsync(1200);

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Timeout waiting for uploads to finish");
    });

    it("should use default timeout of 45000ms", async () => {
      const getCustomization = vi.fn().mockReturnValue({
        topComponents: [{ type: "image", content: { _uploading: true } }],
      });

      const promise = waitForUploadsToFinish(getCustomization);

      // Catch early to avoid unhandled rejection warning
      const resultPromise = promise.catch((err) => err);

      // Advance past default timeout
      await vi.advanceTimersByTimeAsync(45500);

      const error = await resultPromise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Timeout");
    });

    it("should poll at 300ms intervals", async () => {
      let callCount = 0;
      let uploading = true;
      
      const getCustomization = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 3) {
          uploading = false;
        }
        return { 
          topComponents: [{ type: "image", content: { _uploading: uploading } }] 
        };
      });

      const promise = waitForUploadsToFinish(getCustomization, 5000);

      // Run enough intervals for upload to complete
      await vi.advanceTimersByTimeAsync(900);
      
      await expect(promise).resolves.toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(3);
    });
  });
});
