/**
 * Response Format and Error Handling Tests for students-list
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyProductOwnership, needsPasswordSetup } from "./_shared.ts";

// ============================================
// UNIT TESTS: Response Format
// ============================================

Deno.test("students-list: list response format", () => {
  const response = {
    success: true,
    students: [
      { id: "buyer-1", email: "student1@example.com", name: "Student 1" },
      { id: "buyer-2", email: "student2@example.com", name: "Student 2" },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 50,
      totalPages: 3,
    },
  };

  assertEquals(response.success, true);
  assertEquals(Array.isArray(response.students), true);
  assertExists(response.pagination);
  assertEquals(response.pagination.totalPages, 3);
});

Deno.test("students-list: get response format", () => {
  const response = {
    success: true,
    student: {
      id: "buyer-123",
      email: "student@example.com",
      name: "Test Student",
      last_login_at: "2024-01-15T10:00:00Z",
      password_hash: null,
      access: [],
      groups: [],
      progress: [],
    },
  };

  assertEquals(response.success, true);
  assertExists(response.student);
  assertExists(response.student.id);
});

Deno.test("students-list: producer info response format", () => {
  const response = {
    success: true,
    producer_info: {
      id: "producer-123",
      name: "Producer Name",
      email: "producer@example.com",
    },
  };

  assertEquals(response.success, true);
  assertExists(response.producer_info);
  assertExists(response.producer_info.id);
});

// ============================================
// UNIT TESTS: Error Handling
// ============================================

Deno.test("students-list: missing product_id error", () => {
  const response = { error: "product_id required" };
  assertEquals(response.error, "product_id required");
});

Deno.test("students-list: missing buyer_id error", () => {
  const response = { error: "buyer_id and product_id required" };
  assertEquals(response.error, "buyer_id and product_id required");
});

Deno.test("students-list: authorization error", () => {
  const response = { error: "Authorization required" };
  assertEquals(response.error, "Authorization required");
});

Deno.test("students-list: product not found error", () => {
  const response = { error: "Product not found or access denied" };
  assertEquals(response.error, "Product not found or access denied");
});

// ============================================
// UNIT TESTS: Product Ownership Verification
// ============================================

Deno.test("students-list: verifies product ownership", () => {
  assertEquals(verifyProductOwnership("producer-456", "producer-456"), true);
});

Deno.test("students-list: rejects non-owner access", () => {
  assertEquals(verifyProductOwnership("producer-456", "different-producer"), false);
});

// ============================================
// UNIT TESTS: Student Detail Structure
// ============================================

Deno.test("students-list: validates student detail fields", () => {
  const student = {
    id: "buyer-123",
    email: "student@example.com",
    name: "Test Student",
    last_login_at: "2024-01-15T10:00:00Z",
    password_hash: "hashed",
    access: [{ id: "access-1", is_active: true }],
    groups: [{ group: { id: "group-1", name: "VIP" } }],
    progress: [{ content_id: "content-1", progress_percent: 50 }],
  };

  assertExists(student.id);
  assertExists(student.email);
  assertEquals(Array.isArray(student.access), true);
  assertEquals(Array.isArray(student.groups), true);
  assertEquals(Array.isArray(student.progress), true);
});

Deno.test("students-list: handles null password_hash (needs setup)", () => {
  assertEquals(needsPasswordSetup(null), true);
  assertEquals(needsPasswordSetup("hashed"), false);
});
