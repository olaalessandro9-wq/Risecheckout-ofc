/**
 * Form Data Adapter Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the adapter that converts between XState FormData and Public API CheckoutFormData.
 * This adapter is the SINGLE SOURCE OF TRUTH for translating between these two data models.
 * 
 * @module test/checkout-public/adapters
 */

import { describe, it, expect } from "vitest";
import {
  toCheckoutFormData,
  fromCheckoutFormData,
  areFormDataEqual,
} from "../formDataAdapter";
import type { FormData as XStateFormData } from "../../machines/checkoutPublicMachine.types";
import type { CheckoutFormData as PublicFormData } from "@/types/checkout";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createXStateFormData(
  overrides: Partial<XStateFormData> = {}
): XStateFormData {
  return {
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 98765-4321",
    cpf: "123.456.789-00",
    document: "123.456.789-00",
    ...overrides,
  };
}

function createPublicFormData(
  overrides: Partial<PublicFormData> = {}
): PublicFormData {
  return {
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 98765-4321",
    cpf: "123.456.789-00",
    document: "123.456.789-00",
    ...overrides,
  };
}

// ============================================================================
// TESTS: toCheckoutFormData
// ============================================================================

describe("toCheckoutFormData", () => {
  describe("basic field mapping", () => {
    it("should map all fields correctly when all data is present", () => {
      const xstateData = createXStateFormData();
      const result = toCheckoutFormData(xstateData);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        phone: "(11) 98765-4321",
        document: "123.456.789-00",
        cpf: "123.456.789-00",
      });
    });

    it("should preserve name field", () => {
      const xstateData = createXStateFormData({ name: "Maria Santos" });
      const result = toCheckoutFormData(xstateData);

      expect(result.name).toBe("Maria Santos");
    });

    it("should preserve email field", () => {
      const xstateData = createXStateFormData({ email: "maria@test.com" });
      const result = toCheckoutFormData(xstateData);

      expect(result.email).toBe("maria@test.com");
    });
  });

  describe("phone field handling", () => {
    it("should preserve phone when present", () => {
      const xstateData = createXStateFormData({ phone: "(21) 99999-8888" });
      const result = toCheckoutFormData(xstateData);

      expect(result.phone).toBe("(21) 99999-8888");
    });

    it("should default to empty string when phone is empty", () => {
      const xstateData = createXStateFormData({ phone: "" });
      const result = toCheckoutFormData(xstateData);

      expect(result.phone).toBe("");
    });

    it("should default to empty string when phone is undefined", () => {
      const xstateData = createXStateFormData({ phone: undefined });
      const result = toCheckoutFormData(xstateData);

      expect(result.phone).toBe("");
    });
  });

  describe("cpf/document field synchronization", () => {
    it("should use cpf value for both document and cpf when cpf is present", () => {
      const xstateData = createXStateFormData({
        cpf: "111.222.333-44",
        document: "",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.cpf).toBe("111.222.333-44");
      expect(result.document).toBe("111.222.333-44");
    });

    it("should use document value for both when cpf is empty", () => {
      const xstateData = createXStateFormData({
        cpf: "",
        document: "555.666.777-88",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.cpf).toBe("555.666.777-88");
      expect(result.document).toBe("555.666.777-88");
    });

    it("should prefer cpf over document when both are present", () => {
      const xstateData = createXStateFormData({
        cpf: "111.111.111-11",
        document: "222.222.222-22",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.cpf).toBe("111.111.111-11");
      expect(result.document).toBe("111.111.111-11");
    });

    it("should default to empty string when both cpf and document are empty", () => {
      const xstateData = createXStateFormData({
        cpf: "",
        document: "",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.cpf).toBe("");
      expect(result.document).toBe("");
    });

    it("should default to empty string when both cpf and document are undefined", () => {
      const xstateData = createXStateFormData({
        cpf: undefined,
        document: undefined,
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.cpf).toBe("");
      expect(result.document).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle minimal data with only required fields", () => {
      const xstateData: XStateFormData = {
        name: "Test User",
        email: "test@example.com",
        phone: "",
        cpf: "",
        document: "",
      };
      const result = toCheckoutFormData(xstateData);

      expect(result).toEqual({
        name: "Test User",
        email: "test@example.com",
        phone: "",
        document: "",
        cpf: "",
      });
    });

    it("should handle special characters in name", () => {
      const xstateData = createXStateFormData({
        name: "José María Ñoño",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.name).toBe("José María Ñoño");
    });

    it("should handle email with special characters", () => {
      const xstateData = createXStateFormData({
        email: "user+tag@sub.domain.com",
      });
      const result = toCheckoutFormData(xstateData);

      expect(result.email).toBe("user+tag@sub.domain.com");
    });
  });
});

// ============================================================================
// TESTS: fromCheckoutFormData
// ============================================================================

describe("fromCheckoutFormData", () => {
  describe("basic field mapping", () => {
    it("should map all fields correctly when all data is present", () => {
      const publicData = createPublicFormData();
      const result = fromCheckoutFormData(publicData);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        phone: "(11) 98765-4321",
        cpf: "123.456.789-00",
        document: "123.456.789-00",
      });
    });

    it("should preserve name field", () => {
      const publicData = createPublicFormData({ name: "Pedro Costa" });
      const result = fromCheckoutFormData(publicData);

      expect(result.name).toBe("Pedro Costa");
    });

    it("should preserve email field", () => {
      const publicData = createPublicFormData({ email: "pedro@test.com" });
      const result = fromCheckoutFormData(publicData);

      expect(result.email).toBe("pedro@test.com");
    });
  });

  describe("phone field handling", () => {
    it("should preserve phone when present", () => {
      const publicData = createPublicFormData({ phone: "(31) 91111-2222" });
      const result = fromCheckoutFormData(publicData);

      expect(result.phone).toBe("(31) 91111-2222");
    });

    it("should default to empty string when phone is empty", () => {
      const publicData = createPublicFormData({ phone: "" });
      const result = fromCheckoutFormData(publicData);

      expect(result.phone).toBe("");
    });

    it("should default to empty string when phone is undefined", () => {
      const publicData = createPublicFormData({ phone: undefined });
      const result = fromCheckoutFormData(publicData);

      expect(result.phone).toBe("");
    });
  });

  describe("cpf/document field synchronization", () => {
    it("should use cpf value for both document and cpf when cpf is present", () => {
      const publicData = createPublicFormData({
        cpf: "999.888.777-66",
        document: "",
      });
      const result = fromCheckoutFormData(publicData);

      expect(result.cpf).toBe("999.888.777-66");
      expect(result.document).toBe("999.888.777-66");
    });

    it("should use document value for both when cpf is empty", () => {
      const publicData = createPublicFormData({
        cpf: "",
        document: "444.333.222-11",
      });
      const result = fromCheckoutFormData(publicData);

      expect(result.cpf).toBe("444.333.222-11");
      expect(result.document).toBe("444.333.222-11");
    });

    it("should prefer cpf over document when both are present", () => {
      const publicData = createPublicFormData({
        cpf: "777.777.777-77",
        document: "888.888.888-88",
      });
      const result = fromCheckoutFormData(publicData);

      expect(result.cpf).toBe("777.777.777-77");
      expect(result.document).toBe("777.777.777-77");
    });

    it("should default to empty string when both are empty", () => {
      const publicData = createPublicFormData({
        cpf: "",
        document: "",
      });
      const result = fromCheckoutFormData(publicData);

      expect(result.cpf).toBe("");
      expect(result.document).toBe("");
    });
  });

  describe("bidirectional conversion", () => {
    it("should maintain data integrity through round-trip conversion", () => {
      const original = createXStateFormData();
      const converted = toCheckoutFormData(original);
      const backConverted = fromCheckoutFormData(converted);

      expect(backConverted).toEqual(original);
    });

    it("should maintain data through reverse round-trip", () => {
      const original = createPublicFormData();
      const converted = fromCheckoutFormData(original);
      const backConverted = toCheckoutFormData(converted);

      expect(backConverted).toEqual(original);
    });
  });
});

// ============================================================================
// TESTS: areFormDataEqual
// ============================================================================

describe("areFormDataEqual", () => {
  describe("equality checks", () => {
    it("should return true when all fields are equal", () => {
      const dataA = createXStateFormData();
      const dataB = createXStateFormData();

      expect(areFormDataEqual(dataA, dataB)).toBe(true);
    });

    it("should return true when comparing same object", () => {
      const data = createXStateFormData();

      expect(areFormDataEqual(data, data)).toBe(true);
    });

    it("should return true for empty data objects", () => {
      const dataA: XStateFormData = {
        name: "",
        email: "",
        phone: "",
        cpf: "",
        document: "",
      };
      const dataB: XStateFormData = {
        name: "",
        email: "",
        phone: "",
        cpf: "",
        document: "",
      };

      expect(areFormDataEqual(dataA, dataB)).toBe(true);
    });
  });

  describe("inequality checks", () => {
    it("should return false when name differs", () => {
      const dataA = createXStateFormData({ name: "João" });
      const dataB = createXStateFormData({ name: "Maria" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should return false when email differs", () => {
      const dataA = createXStateFormData({ email: "a@test.com" });
      const dataB = createXStateFormData({ email: "b@test.com" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should return false when phone differs", () => {
      const dataA = createXStateFormData({ phone: "111111111" });
      const dataB = createXStateFormData({ phone: "222222222" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should return false when cpf differs", () => {
      const dataA = createXStateFormData({ cpf: "111.111.111-11" });
      const dataB = createXStateFormData({ cpf: "222.222.222-22" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should return false when document differs", () => {
      const dataA = createXStateFormData({ document: "333.333.333-33" });
      const dataB = createXStateFormData({ document: "444.444.444-44" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle undefined vs empty string as different", () => {
      const dataA = createXStateFormData({ phone: undefined });
      const dataB = createXStateFormData({ phone: "" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should be case-sensitive for string comparisons", () => {
      const dataA = createXStateFormData({ name: "João" });
      const dataB = createXStateFormData({ name: "joão" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });

    it("should detect whitespace differences", () => {
      const dataA = createXStateFormData({ name: "João Silva" });
      const dataB = createXStateFormData({ name: "João  Silva" });

      expect(areFormDataEqual(dataA, dataB)).toBe(false);
    });
  });
});
