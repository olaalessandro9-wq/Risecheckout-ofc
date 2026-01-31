/**
 * @file index.test.ts
 * @description Tests for UTMify barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as UTMify from "../index";

describe("UTMify Barrel Exports", () => {
  describe("Module Exports", () => {
    it("should export utility functions", () => {
      expect(UTMify.extractUTMParameters).toBeDefined();
      expect(typeof UTMify.extractUTMParameters).toBe("function");

      expect(UTMify.formatDateForUTMify).toBeDefined();
      expect(typeof UTMify.formatDateForUTMify).toBe("function");
    });

    it("should export event functions", () => {
      expect(UTMify.sendUTMifyConversion).toBeDefined();
      expect(typeof UTMify.sendUTMifyConversion).toBe("function");
    });
  });

  describe("Export Count", () => {
    it("should export expected number of members", () => {
      const exports = Object.keys(UTMify);
      expect(exports.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(UTMify);
      const expectedExports = [
        "extractUTMParameters",
        "formatDateForUTMify",
        "sendUTMifyConversion",
        "Tracker",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });
});
