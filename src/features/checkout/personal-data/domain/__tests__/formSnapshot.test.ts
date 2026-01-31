/**
 * @file formSnapshot.test.ts
 * @description Tests for Form Snapshot Utility
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readPersonalDataFromForm,
  readFieldFromDOM,
  readAllFieldsFromDOM,
  mergeWithDOMSnapshot,
  normalizePersonalData,
  getSubmitSnapshot,
} from "../formSnapshot";
import type { PersonalData } from "../../types";

// Mock masks module
vi.mock("../masks", () => ({
  maskPersonalField: vi.fn((field: string, value: string) => {
    if (field === "cpf") {
      const cleaned = value.replace(/\D/g, "");
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (field === "phone") {
      const cleaned = value.replace(/\D/g, "");
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  }),
}));

describe("formSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // ========== readPersonalDataFromForm ==========

  describe("readPersonalDataFromForm", () => {
    it("should read all fields from form", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="name" value="João Silva" />
          <input name="email" value="joao@example.com" />
          <input name="cpf" value="12345678901" />
          <input name="phone" value="11987654321" />
        </form>
      `;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const result = readPersonalDataFromForm(form);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      });
    });

    it("should return empty strings for missing fields", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="name" value="João Silva" />
        </form>
      `;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const result = readPersonalDataFromForm(form);

      expect(result).toEqual({
        name: "João Silva",
        email: "",
        cpf: "",
        phone: "",
      });
    });

    it("should handle empty form", () => {
      document.body.innerHTML = `<form id="test-form"></form>`;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const result = readPersonalDataFromForm(form);

      expect(result).toEqual({
        name: "",
        email: "",
        cpf: "",
        phone: "",
      });
    });
  });

  // ========== readFieldFromDOM ==========

  describe("readFieldFromDOM", () => {
    it("should read field value by name", () => {
      document.body.innerHTML = `
        <input name="email" value="test@example.com" />
      `;

      const result = readFieldFromDOM("email");
      expect(result).toBe("test@example.com");
    });

    it("should return empty string for missing field", () => {
      const result = readFieldFromDOM("nonexistent");
      expect(result).toBe("");
    });

    it("should return empty string for field with no value", () => {
      document.body.innerHTML = `<input name="name" />`;

      const result = readFieldFromDOM("name");
      expect(result).toBe("");
    });
  });

  // ========== readAllFieldsFromDOM ==========

  describe("readAllFieldsFromDOM", () => {
    it("should read all personal data fields", () => {
      document.body.innerHTML = `
        <input name="name" value="João Silva" />
        <input name="email" value="joao@example.com" />
        <input name="cpf" value="12345678901" />
        <input name="phone" value="11987654321" />
      `;

      const result = readAllFieldsFromDOM();

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      });
    });

    it("should return empty data when no fields exist", () => {
      const result = readAllFieldsFromDOM();

      expect(result).toEqual({
        name: "",
        email: "",
        cpf: "",
        phone: "",
      });
    });
  });

  // ========== mergeWithDOMSnapshot ==========

  describe("mergeWithDOMSnapshot", () => {
    it("should prioritize DOM data over state data", () => {
      const stateData: Partial<PersonalData> = {
        name: "State Name",
        email: "state@example.com",
      };

      const domData: PersonalData = {
        name: "DOM Name",
        email: "dom@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const result = mergeWithDOMSnapshot(stateData, domData);

      expect(result).toEqual({
        name: "DOM Name",
        email: "dom@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      });
    });

    it("should use state data as fallback when DOM is empty", () => {
      const stateData: Partial<PersonalData> = {
        name: "State Name",
        email: "state@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const domData: PersonalData = {
        name: "",
        email: "",
        cpf: "",
        phone: "",
      };

      const result = mergeWithDOMSnapshot(stateData, domData);

      expect(result).toEqual({
        name: "State Name",
        email: "state@example.com",
        cpf: "12345678901",
        phone: "11987654321",
      });
    });

    it("should trim all values", () => {
      const stateData: Partial<PersonalData> = {
        name: "  State Name  ",
      };

      const domData: PersonalData = {
        name: "",
        email: "  dom@example.com  ",
        cpf: "  12345678901  ",
        phone: "",
      };

      const result = mergeWithDOMSnapshot(stateData, domData);

      expect(result).toEqual({
        name: "State Name",
        email: "dom@example.com",
        cpf: "12345678901",
        phone: "",
      });
    });

    it("should handle partial state data", () => {
      const stateData: Partial<PersonalData> = {
        name: "State Name",
      };

      const domData: PersonalData = {
        name: "",
        email: "dom@example.com",
        cpf: "",
        phone: "",
      };

      const result = mergeWithDOMSnapshot(stateData, domData);

      expect(result).toEqual({
        name: "State Name",
        email: "dom@example.com",
        cpf: "",
        phone: "",
      });
    });
  });

  // ========== normalizePersonalData ==========

  describe("normalizePersonalData", () => {
    it("should apply masks to all fields", () => {
      const data: PersonalData = {
        name: "João Silva",
        email: "  joao@example.com  ",
        cpf: "12345678901",
        phone: "11987654321",
      };

      const result = normalizePersonalData(data);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        cpf: "123.456.789-01",
        phone: "(11) 98765-4321",
      });
    });

    it("should handle empty data", () => {
      const data: PersonalData = {
        name: "",
        email: "",
        cpf: "",
        phone: "",
      };

      const result = normalizePersonalData(data);

      expect(result).toEqual({
        name: "",
        email: "",
        cpf: "",
        phone: "",
      });
    });
  });

  // ========== getSubmitSnapshot ==========

  describe("getSubmitSnapshot", () => {
    it("should read from form when provided", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="name" value="João Silva" />
          <input name="email" value="joao@example.com" />
          <input name="cpf" value="12345678901" />
          <input name="phone" value="11987654321" />
        </form>
      `;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const stateData: Partial<PersonalData> = {};

      const result = getSubmitSnapshot(form, stateData);

      expect(result.name).toBe("João Silva");
      expect(result.email).toBe("joao@example.com");
    });

    it("should use fallback when form is null", () => {
      document.body.innerHTML = `
        <input name="name" value="João Silva" />
        <input name="email" value="joao@example.com" />
      `;

      const stateData: Partial<PersonalData> = {};

      const result = getSubmitSnapshot(null, stateData);

      expect(result.name).toBe("João Silva");
      expect(result.email).toBe("joao@example.com");
    });

    it("should merge and normalize data", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="name" value="João Silva" />
          <input name="email" value="joao@example.com" />
        </form>
      `;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const stateData: Partial<PersonalData> = {
        cpf: "12345678901",
        phone: "11987654321",
      };

      const result = getSubmitSnapshot(form, stateData);

      expect(result).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        cpf: "123.456.789-01",
        phone: "(11) 98765-4321",
      });
    });
  });

  // ========== Edge Cases ==========

  describe("Edge Cases", () => {
    it("should handle form with disabled inputs", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="name" value="João Silva" disabled />
          <input name="email" value="joao@example.com" />
        </form>
      `;

      const form = document.getElementById("test-form") as HTMLFormElement;
      const result = readPersonalDataFromForm(form);

      // FormData ignores disabled inputs
      expect(result.name).toBe("");
      expect(result.email).toBe("joao@example.com");
    });

    it("should handle multiple inputs with same name", () => {
      document.body.innerHTML = `
        <input name="email" value="first@example.com" />
        <input name="email" value="second@example.com" />
      `;

      const result = readFieldFromDOM("email");

      // querySelector returns first match
      expect(result).toBe("first@example.com");
    });
  });
});
