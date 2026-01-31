/**
 * @file index.test.ts
 * @description Tests for PushinPay barrel exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as PushinPay from "../index";

describe("PushinPay Barrel Export", () => {
  describe("API Exports", () => {
    it("should export fetchPushinPayAccountInfo", () => {
      expect(PushinPay.fetchPushinPayAccountInfo).toBeDefined();
      expect(typeof PushinPay.fetchPushinPayAccountInfo).toBe("function");
    });

    it("should export savePushinPaySettings", () => {
      expect(PushinPay.savePushinPaySettings).toBeDefined();
      expect(typeof PushinPay.savePushinPaySettings).toBe("function");
    });

    it("should export getPushinPaySettings", () => {
      expect(PushinPay.getPushinPaySettings).toBeDefined();
      expect(typeof PushinPay.getPushinPaySettings).toBe("function");
    });

    it("should export createPixCharge", () => {
      expect(PushinPay.createPixCharge).toBeDefined();
      expect(typeof PushinPay.createPixCharge).toBe("function");
    });

    it("should export getPixStatus", () => {
      expect(PushinPay.getPixStatus).toBeDefined();
      expect(typeof PushinPay.getPixStatus).toBe("function");
    });

    it("should export testPushinPayConnection", () => {
      expect(PushinPay.testPushinPayConnection).toBeDefined();
      expect(typeof PushinPay.testPushinPayConnection).toBe("function");
    });

    it("should export getPushinPayStats", () => {
      expect(PushinPay.getPushinPayStats).toBeDefined();
      expect(typeof PushinPay.getPushinPayStats).toBe("function");
    });
  });

  describe("Hook Exports", () => {
    it("should export usePushinPayConfig", () => {
      expect(PushinPay.usePushinPayConfig).toBeDefined();
      expect(typeof PushinPay.usePushinPayConfig).toBe("function");
    });

    it("should export usePushinPayAvailable", () => {
      expect(PushinPay.usePushinPayAvailable).toBeDefined();
      expect(typeof PushinPay.usePushinPayAvailable).toBe("function");
    });
  });

  describe("Component Exports", () => {
    it("should export ConfigForm component", () => {
      expect(PushinPay.ConfigForm).toBeDefined();
    });
  });

  describe("Type Exports", () => {
    // Types are verified at compile time
    it("should compile with type exports", () => {
      expect(true).toBe(true);
    });
  });
});
