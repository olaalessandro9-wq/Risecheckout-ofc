/**
 * @file formSnapshot-merge.test.ts
 * @description Tests for Form Snapshot Merge and Normalize Functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
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

describe("formSnapshot - Merge and Normalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
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
});
