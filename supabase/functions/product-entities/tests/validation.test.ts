/**
 * Validation Tests for product-entities
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidEntityAction, verifyOwnership } from "./_shared.ts";

Deno.test("product-entities - should accept offers action", () => assertEquals(isValidEntityAction("offers"), true));
Deno.test("product-entities - should accept order-bumps action", () => assertEquals(isValidEntityAction("order-bumps"), true));
Deno.test("product-entities - should accept all action", () => assertEquals(isValidEntityAction("all"), true));
Deno.test("product-entities - should reject invalid action", () => assertEquals(isValidEntityAction("invalid"), false));
Deno.test("product-entities - should verify ownership", () => assertEquals(verifyOwnership("prod-1", "user-123"), true));
Deno.test("product-entities - should reject invalid ownership", () => assertEquals(verifyOwnership("prod-1", "user-456"), false));
