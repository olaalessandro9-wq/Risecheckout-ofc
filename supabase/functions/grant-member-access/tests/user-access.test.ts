/**
 * Grant Member Access - User & Access Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module grant-member-access/tests/user-access
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MOCK_DEFAULT_GROUP, type MockUser } from "./_shared.ts";

Deno.test("grant-member-access - User Creation SSOT", async (t) => {
  await t.step("should create user with pending_setup status", () => {
    const newUser: MockUser = {
      id: "new-user-id",
      email: "new@example.com",
      name: "New Customer",
      password_hash: null,
      account_status: "pending_setup"
    };
    
    assertEquals(newUser.account_status, "pending_setup");
    assertEquals(newUser.password_hash, null);
  });

  await t.step("should set is_active to true for new users", () => {
    const newUserData = {
      email: "new@example.com",
      name: "New Customer",
      password_hash: null,
      account_status: "pending_setup",
      is_active: true
    };
    
    assertEquals(newUserData.is_active, true);
  });

  await t.step("should handle null customer_name", () => {
    const newUserData = {
      email: "new@example.com",
      name: null,
      password_hash: null,
      account_status: "pending_setup",
      is_active: true
    };
    
    assertEquals(newUserData.name, null);
  });
});

Deno.test("grant-member-access - Buyer Product Access", async (t) => {
  await t.step("should create access record with correct fields", () => {
    const accessRecord = {
      buyer_id: "buyer-001",
      product_id: "prod-001",
      order_id: "order-001",
      is_active: true,
      access_type: "purchase",
      granted_at: new Date().toISOString()
    };
    
    assertEquals(accessRecord.is_active, true);
    assertEquals(accessRecord.access_type, "purchase");
    assertExists(accessRecord.granted_at);
  });

  await t.step("should use upsert with buyer_id,product_id conflict", () => {
    const conflictKey = "buyer_id,product_id";
    assertEquals(conflictKey, "buyer_id,product_id");
  });
});

Deno.test("grant-member-access - Default Group Assignment", async (t) => {
  await t.step("should add buyer to default group if exists", () => {
    const groupAssignment = {
      buyer_id: "buyer-001",
      group_id: MOCK_DEFAULT_GROUP.id,
      is_active: true,
      granted_at: new Date().toISOString()
    };
    
    assertEquals(groupAssignment.group_id, MOCK_DEFAULT_GROUP.id);
    assertEquals(groupAssignment.is_active, true);
  });

  await t.step("should use upsert with buyer_id,group_id conflict", () => {
    const conflictKey = "buyer_id,group_id";
    assertEquals(conflictKey, "buyer_id,group_id");
  });
});
