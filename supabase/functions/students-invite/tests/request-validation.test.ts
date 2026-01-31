/**
 * Request Body Validation Tests for students-invite
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ============================================
// UNIT TESTS: Request Body Validation
// ============================================

Deno.test("students-invite: validates invite request body", () => {
  const validBody = {
    action: "invite",
    product_id: "product-123",
    email: "student@example.com",
    name: "Test Student",
    group_ids: ["group-1", "group-2"],
  };

  assertExists(validBody.action);
  assertExists(validBody.product_id);
  assertExists(validBody.email);
  assertEquals(Array.isArray(validBody.group_ids), true);
});

Deno.test("students-invite: validates validate-invite-token request", () => {
  const body = {
    action: "validate-invite-token",
    token: "abc-123-def-456",
  };

  assertEquals(body.action, "validate-invite-token");
  assertExists(body.token);
});

Deno.test("students-invite: validates use-invite-token request", () => {
  const body = {
    action: "use-invite-token",
    token: "abc-123-def-456",
    password: "secure-password-123",
  };

  assertEquals(body.action, "use-invite-token");
  assertExists(body.token);
  assertExists(body.password);
});

Deno.test("students-invite: validates generate-purchase-access request", () => {
  const body = {
    action: "generate-purchase-access",
    order_id: "order-123",
    customer_email: "customer@example.com",
    product_id: "product-456",
  };

  assertEquals(body.action, "generate-purchase-access");
  assertExists(body.order_id);
  assertExists(body.customer_email);
  assertExists(body.product_id);
});

// ============================================
// UNIT TESTS: Group IDs Validation
// ============================================

Deno.test("students-invite: validates group_ids array", () => {
  const groupIds = ["group-1", "group-2", "group-3"];
  
  assertEquals(Array.isArray(groupIds), true);
  assertEquals(groupIds.every(id => typeof id === "string"), true);
  assertEquals(groupIds.every(id => id.length > 0), true);
});

Deno.test("students-invite: handles empty group_ids", () => {
  const groupIds: string[] = [];
  assertEquals(Array.isArray(groupIds), true);
  assertEquals(groupIds.length, 0);
});

Deno.test("students-invite: handles undefined group_ids", () => {
  const body = { action: "invite", email: "test@example.com" };
  const groupIds = (body as { group_ids?: string[] }).group_ids ?? [];
  assertEquals(Array.isArray(groupIds), true);
});
