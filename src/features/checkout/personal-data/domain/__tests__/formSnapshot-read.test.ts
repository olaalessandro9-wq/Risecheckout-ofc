/**
 * @file formSnapshot-read.test.ts
 * @description Tests for Form Snapshot Read Functions
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readPersonalDataFromForm,
  readFieldFromDOM,
  readAllFieldsFromDOM,
} from "../formSnapshot";

describe("formSnapshot - Read Functions", () => {
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
});
