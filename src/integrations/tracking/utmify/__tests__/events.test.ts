/**
 * @file events.test.ts
 * @description Tests for UTMify events (re-exports)
 * 
 * @version 5.0.0 - RISE Protocol V3 - Arquitetura Híbrida
 * 
 * Arquitetura Híbrida UTMify:
 * - Eventos transacionais no backend (SSOT) via _shared/utmify/dispatcher.ts
 * - Eventos comportamentais (InitiateCheckout) no frontend via Pixel CDN
 * 
 * Este arquivo testa apenas os re-exports de utils.
 */

import { describe, it, expect } from "vitest";
import { extractUTMParameters, formatDateForUTMify, convertToCents, convertToReais } from "../events";

describe("UTMify Events (Re-exports)", () => {
  describe("extractUTMParameters", () => {
    it("should be a function", () => {
      expect(typeof extractUTMParameters).toBe("function");
    });
  });

  describe("formatDateForUTMify", () => {
    it("should be a function", () => {
      expect(typeof formatDateForUTMify).toBe("function");
    });
  });

  describe("convertToCents", () => {
    it("should be a function", () => {
      expect(typeof convertToCents).toBe("function");
    });
  });

  describe("convertToReais", () => {
    it("should be a function", () => {
      expect(typeof convertToReais).toBe("function");
    });
  });
});
