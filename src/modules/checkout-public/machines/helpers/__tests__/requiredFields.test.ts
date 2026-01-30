/**
 * Required Fields Helper Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the requiredFields helper that supports both formats.
 * 
 * @module test/checkout-public/machines/helpers
 */

import { describe, it, expect } from "vitest";
import { isFieldRequired } from "../requiredFields";
import type { RequiredFieldsConfig } from "../../../mappers";

// ============================================================================
// TESTS
// ============================================================================

describe("isFieldRequired", () => {
  describe("with object format", () => {
    it("should return true when field is required", () => {
      const config: RequiredFieldsConfig = {
        name: true,
        email: true,
        cpf: true,
        phone: false,
      };

      expect(isFieldRequired(config, "cpf")).toBe(true);
    });

    it("should return false when field is not required", () => {
      const config: RequiredFieldsConfig = {
        name: true,
        email: true,
        cpf: false,
        phone: false,
      };

      expect(isFieldRequired(config, "cpf")).toBe(false);
    });

    it("should return false for undefined field", () => {
      const config = { name: true } as RequiredFieldsConfig;

      expect(isFieldRequired(config, "cpf")).toBe(false);
    });
  });

  describe("with array format", () => {
    it("should return true when field is in array", () => {
      const config = ["cpf", "phone"];

      expect(isFieldRequired(config, "cpf")).toBe(true);
    });

    it("should return false when field is not in array", () => {
      const config = ["phone"];

      expect(isFieldRequired(config, "cpf")).toBe(false);
    });

    it("should handle empty array", () => {
      const config: string[] = [];

      expect(isFieldRequired(config, "cpf")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return false for null config", () => {
      expect(isFieldRequired(null, "cpf")).toBe(false);
    });

    it("should return false for undefined config", () => {
      expect(isFieldRequired(undefined, "cpf")).toBe(false);
    });

    it("should handle all field types", () => {
      const config: RequiredFieldsConfig = {
        name: true,
        email: true,
        cpf: true,
        phone: true,
      };

      expect(isFieldRequired(config, "name")).toBe(true);
      expect(isFieldRequired(config, "email")).toBe(true);
      expect(isFieldRequired(config, "cpf")).toBe(true);
      expect(isFieldRequired(config, "phone")).toBe(true);
    });
  });
});
