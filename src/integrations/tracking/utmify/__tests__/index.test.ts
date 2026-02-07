/**
 * @file index.test.ts
 * @description Tests for UTMify barrel exports
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Eventos transacionais no backend (SSOT) via _shared/utmify/dispatcher.ts
 * - Eventos comportamentais (InitiateCheckout) no frontend via Pixel CDN
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

    it("should export conversion functions", () => {
      expect(UTMify.convertToCents).toBeDefined();
      expect(typeof UTMify.convertToCents).toBe("function");

      expect(UTMify.convertToReais).toBeDefined();
      expect(typeof UTMify.convertToReais).toBe("function");
    });

    it("should export hooks", () => {
      expect(UTMify.useUTMifyConfig).toBeDefined();
      expect(typeof UTMify.useUTMifyConfig).toBe("function");

      expect(UTMify.shouldRunUTMify).toBeDefined();
      expect(typeof UTMify.shouldRunUTMify).toBe("function");
    });

    it("should export Pixel component", () => {
      expect(UTMify.Pixel).toBeDefined();
    });
  });

  describe("Export Count", () => {
    it("should export expected number of members", () => {
      const exports = Object.keys(UTMify);
      // Utils: extractUTMParameters, formatDateForUTMify, convertToCents, convertToReais
      // Hooks: useUTMifyConfig, shouldRunUTMify, useUTMifyForProduct, isEventEnabledForUTMify
      // Component: Pixel
      // Types are not counted as they are not runtime values
      expect(exports.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Export Names", () => {
    it("should have correct export names", () => {
      const exports = Object.keys(UTMify);
      const expectedExports = [
        "extractUTMParameters",
        "formatDateForUTMify",
        "convertToCents",
        "convertToReais",
        "useUTMifyConfig",
        "shouldRunUTMify",
        "Pixel",
      ];

      expectedExports.forEach((exportName) => {
        expect(exports).toContain(exportName);
      });
    });
  });

  describe("Removed Exports (Backend SSOT)", () => {
    it("should NOT export sendUTMifyConversion (now backend-only)", () => {
      // @ts-expect-error - Verificando que não existe
      expect(UTMify.sendUTMifyConversion).toBeUndefined();
    });

    it("should NOT export trackPurchase (now backend-only)", () => {
      // @ts-expect-error - Verificando que não existe
      expect(UTMify.trackPurchase).toBeUndefined();
    });

    it("should NOT export trackRefund (now backend-only)", () => {
      // @ts-expect-error - Verificando que não existe
      expect(UTMify.trackRefund).toBeUndefined();
    });
  });
});
