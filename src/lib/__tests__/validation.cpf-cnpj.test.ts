/**
 * Validation Library - CPF/CNPJ Validation Unit Tests
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for CPF, CNPJ, and auto-detect document validation.
 * Single Responsibility: Only document validation tests.
 *
 * @module lib/__tests__/validation.cpf-cnpj.test
 */

import { describe, it, expect } from "vitest";
import {
  validateCPF,
  validateCNPJ,
  validateDocument,
} from "../validation";

// ============================================================================
// CPF VALIDATION TESTS
// ============================================================================

describe("CPF Validation", () => {
  const validCPFs = [
    "529.982.247-25",
    "52998224725",
    "111.444.777-35",
    "11144477735",
  ];

  const invalidCPFs = [
    "000.000.000-00",
    "111.111.111-11",
    "222.222.222-22",
    "123.456.789-00",
    "123.456.789-10",
    "12345678",
    "1234567890123",
  ];

  it.each(validCPFs)("should validate valid CPF: %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(true);
  });

  it.each(invalidCPFs)("should reject invalid CPF: %s", (cpf) => {
    expect(validateCPF(cpf)).toBe(false);
  });

  it("should reject empty string", () => {
    expect(validateCPF("")).toBe(false);
  });

  it("should reject CPF with all same digits", () => {
    for (let i = 0; i <= 9; i++) {
      const sameCPF = String(i).repeat(11);
      expect(validateCPF(sameCPF)).toBe(false);
    }
  });
});

// ============================================================================
// CNPJ VALIDATION TESTS
// ============================================================================

describe("CNPJ Validation", () => {
  const validCNPJs = [
    "11.222.333/0001-81",
    "11222333000181",
    "45.997.418/0001-53",
    "45997418000153",
  ];

  const invalidCNPJs = [
    "00.000.000/0000-00",
    "11.111.111/1111-11",
    "12.345.678/0001-00",
    "1234567800019",
    "123456780001990",
  ];

  it.each(validCNPJs)("should validate valid CNPJ: %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(true);
  });

  it.each(invalidCNPJs)("should reject invalid CNPJ: %s", (cnpj) => {
    expect(validateCNPJ(cnpj)).toBe(false);
  });

  it("should reject empty string", () => {
    expect(validateCNPJ("")).toBe(false);
  });

  it("should reject CNPJ with all same digits", () => {
    for (let i = 0; i <= 9; i++) {
      const sameCNPJ = String(i).repeat(14);
      expect(validateCNPJ(sameCNPJ)).toBe(false);
    }
  });
});

// ============================================================================
// VALIDATE DOCUMENT (AUTO-DETECT CPF/CNPJ) TESTS
// ============================================================================

describe("validateDocument (auto-detect)", () => {
  it("should validate CPF when <= 11 digits", () => {
    expect(validateDocument("529.982.247-25")).toBe(true);
    expect(validateDocument("52998224725")).toBe(true);
  });

  it("should validate CNPJ when > 11 digits", () => {
    expect(validateDocument("11.222.333/0001-81")).toBe(true);
    expect(validateDocument("11222333000181")).toBe(true);
  });

  it("should reject invalid CPF", () => {
    expect(validateDocument("123.456.789-00")).toBe(false);
  });

  it("should reject invalid CNPJ", () => {
    expect(validateDocument("12.345.678/0001-00")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(validateDocument("")).toBe(false);
  });
});
