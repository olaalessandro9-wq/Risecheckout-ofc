/**
 * @file events.test.ts
 * @description Tests for UTMify events (re-exports)
 * 
 * @version 4.0.0 - RISE Protocol V3 - Backend SSOT
 * 
 * IMPORTANTE: O tracking UTMify é agora feito EXCLUSIVAMENTE no backend
 * via _shared/utmify-dispatcher.ts nos webhooks de pagamento.
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
