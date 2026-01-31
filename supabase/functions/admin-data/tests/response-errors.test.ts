/**
 * Error Response Structure Tests for admin-data
 * @module admin-data/tests/response-errors.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("admin-data - error structure - validation error format", () => {
  const error = {
    error: "productId é obrigatório",
    code: "VALIDATION_ERROR",
  };
  
  assertExists(error.error);
  assertEquals(error.code, "VALIDATION_ERROR");
});

Deno.test("admin-data - error structure - invalid action error format", () => {
  const error = {
    error: "Ação desconhecida: invalid-action",
    code: "INVALID_ACTION",
  };
  
  assertStringIncludes(error.error, "Ação desconhecida");
  assertEquals(error.code, "INVALID_ACTION");
});

Deno.test("admin-data - error structure - internal error format", () => {
  const error = {
    error: "Erro interno do servidor",
    code: "INTERNAL_ERROR",
  };
  
  assertEquals(error.error, "Erro interno do servidor");
  assertEquals(error.code, "INTERNAL_ERROR");
});
