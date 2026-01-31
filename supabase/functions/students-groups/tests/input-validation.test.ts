/**
 * Students Groups - Input Validation Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module students-groups/tests/input-validation
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateGroupRequest, type GroupAction } from "./_shared.ts";

Deno.test("students-groups - Input Validation", async (t) => {
  await t.step("should require action", () => {
    const error = validateGroupRequest({});
    assertExists(error);
    assertStringIncludes(error, "action");
  });

  await t.step("should reject invalid action", () => {
    const error = validateGroupRequest({ action: "invalid" as GroupAction });
    assertExists(error);
    assertStringIncludes(error, "Invalid action");
  });

  await t.step("should require buyer_id and group_id for add-to-group", () => {
    const error = validateGroupRequest({ action: "add-to-group" });
    assertExists(error);
    assertStringIncludes(error, "buyer_id and group_id");
  });

  await t.step("should require buyer_id and group_id for remove-from-group", () => {
    const error = validateGroupRequest({ action: "remove-from-group", buyer_id: "b1" });
    assertExists(error);
    assertStringIncludes(error, "group_id");
  });

  await t.step("should require buyer_id and group_ids for assign-groups", () => {
    const error = validateGroupRequest({ action: "assign-groups", buyer_id: "b1" });
    assertExists(error);
    assertStringIncludes(error, "group_ids");
  });

  await t.step("should require product_id for list-groups", () => {
    const error = validateGroupRequest({ action: "list-groups" });
    assertExists(error);
    assertStringIncludes(error, "product_id");
  });

  await t.step("should pass for valid add-to-group", () => {
    const error = validateGroupRequest({
      action: "add-to-group",
      buyer_id: "b1",
      group_id: "g1"
    });
    assertEquals(error, null);
  });

  await t.step("should pass for valid assign-groups", () => {
    const error = validateGroupRequest({
      action: "assign-groups",
      buyer_id: "b1",
      group_ids: ["g1", "g2"]
    });
    assertEquals(error, null);
  });

  await t.step("should pass for valid list-groups", () => {
    const error = validateGroupRequest({
      action: "list-groups",
      product_id: "p1"
    });
    assertEquals(error, null);
  });
});
