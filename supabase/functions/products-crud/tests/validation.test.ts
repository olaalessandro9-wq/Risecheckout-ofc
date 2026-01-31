/**
 * Validation & CRUD Tests for products-crud
 * @module products-crud/tests/validation.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidCrudAction } from "./_shared.ts";

Deno.test("products-crud - should accept list action", () => assertEquals(isValidCrudAction("list"), true));
Deno.test("products-crud - should accept get action", () => assertEquals(isValidCrudAction("get"), true));
Deno.test("products-crud - should accept get-settings action", () => assertEquals(isValidCrudAction("get-settings"), true));
Deno.test("products-crud - should accept get-offers action", () => assertEquals(isValidCrudAction("get-offers"), true));
Deno.test("products-crud - should accept get-checkouts action", () => assertEquals(isValidCrudAction("get-checkouts"), true));
Deno.test("products-crud - should reject invalid action", () => assertEquals(isValidCrudAction("invalid"), false));
