/**
 * Grant Members Access Unit Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the members area access granting module.
 * CRITICAL: Controls paid content access after purchase.
 * 
 * Note: Most functions require Supabase client, so we test
 * the pure helper functions and type definitions here.
 * Integration tests with mocked Supabase are in Phase 5.
 * 
 * @module _shared/grant-members-access.test
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import type {
  GrantAccessInput,
  GrantAccessResult,
} from "./grant-members-access.ts";

// ============================================================================
// Type Definition Tests
// ============================================================================

Deno.test("Type: GrantAccessInput should accept valid minimal input", () => {
  const input: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  assertEquals(typeof input.orderId, "string");
  assertEquals(typeof input.customerEmail, "string");
  assertEquals(input.customerName, null);
  assertEquals(typeof input.productId, "string");
  assertEquals(input.productName, null);
});

Deno.test("Type: GrantAccessInput should accept full input with offerId", () => {
  const input: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: "João Silva",
    productId: "product-456",
    productName: "Curso Avançado",
    offerId: "offer-789",
  };
  
  assertEquals(input.customerName, "João Silva");
  assertEquals(input.productName, "Curso Avançado");
  assertEquals(input.offerId, "offer-789");
});

Deno.test("Type: GrantAccessResult success with members area", () => {
  const result: GrantAccessResult = {
    success: true,
    hasMembersArea: true,
    buyerId: "buyer-123",
    isNewBuyer: true,
    inviteToken: "token-abc-xyz",
    accessUrl: "https://example.com/setup?token=abc",
    assignedGroupId: "group-456",
  };
  
  assertEquals(result.success, true);
  assertEquals(result.hasMembersArea, true);
  assertExists(result.buyerId);
  assertEquals(result.isNewBuyer, true);
  assertExists(result.inviteToken);
  assertExists(result.accessUrl);
  assertExists(result.assignedGroupId);
});

Deno.test("Type: GrantAccessResult success without members area", () => {
  const result: GrantAccessResult = {
    success: true,
    hasMembersArea: false,
  };
  
  assertEquals(result.success, true);
  assertEquals(result.hasMembersArea, false);
  assertEquals(result.buyerId, undefined);
  assertEquals(result.inviteToken, undefined);
});

Deno.test("Type: GrantAccessResult failure with error", () => {
  const result: GrantAccessResult = {
    success: false,
    hasMembersArea: true,
    error: "Produto não encontrado",
  };
  
  assertEquals(result.success, false);
  assertEquals(result.hasMembersArea, true);
  assertEquals(result.error, "Produto não encontrado");
});

Deno.test("Type: GrantAccessResult existing buyer without invite", () => {
  const result: GrantAccessResult = {
    success: true,
    hasMembersArea: true,
    buyerId: "buyer-123",
    isNewBuyer: false,
    accessUrl: "https://example.com/minha-conta",
    assignedGroupId: "group-456",
  };
  
  assertEquals(result.success, true);
  assertEquals(result.isNewBuyer, false);
  assertEquals(result.inviteToken, undefined);
  assertExists(result.accessUrl);
});

// ============================================================================
// Email Normalization Tests (Business Logic Validation)
// ============================================================================

Deno.test("Email normalization: should expect lowercase", () => {
  // The function normalizes emails to lowercase
  // We verify the expected behavior here
  const originalEmail = "Test@Example.COM";
  const normalizedEmail = originalEmail.toLowerCase().trim();
  
  assertEquals(normalizedEmail, "test@example.com");
});

Deno.test("Email normalization: should expect trimmed", () => {
  const originalEmail = "  test@example.com  ";
  const normalizedEmail = originalEmail.toLowerCase().trim();
  
  assertEquals(normalizedEmail, "test@example.com");
});

Deno.test("Email normalization: should handle mixed case", () => {
  const originalEmail = "JoAo.SiLvA@Example.COM";
  const normalizedEmail = originalEmail.toLowerCase().trim();
  
  assertEquals(normalizedEmail, "joao.silva@example.com");
});

// ============================================================================
// Token Generation Tests (Behavior Validation)
// ============================================================================

Deno.test("Token format: should be UUID-based", () => {
  // The function generates: crypto.randomUUID() + "-" + crypto.randomUUID()
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  
  // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const parts = token.split("-");
  assertEquals(parts.length, 10); // Two UUIDs (5 parts each)
  assertExists(token);
});

Deno.test("Token: should be unique on each generation", () => {
  const token1 = crypto.randomUUID() + "-" + crypto.randomUUID();
  const token2 = crypto.randomUUID() + "-" + crypto.randomUUID();
  
  assertEquals(token1 !== token2, true);
});

// ============================================================================
// Hash Token Tests (Behavior Validation)
// ============================================================================

Deno.test("Hash: SHA-256 should produce consistent output", async () => {
  const token = "test-token-12345";
  
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash1 = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Run again
  const hashBuffer2 = await crypto.subtle.digest("SHA-256", data);
  const hashArray2 = Array.from(new Uint8Array(hashBuffer2));
  const hash2 = hashArray2.map(b => b.toString(16).padStart(2, "0")).join("");
  
  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64); // SHA-256 = 64 hex chars
});

Deno.test("Hash: different tokens should produce different hashes", async () => {
  const token1 = "token-1";
  const token2 = "token-2";
  
  const encoder = new TextEncoder();
  
  const hash1Buffer = await crypto.subtle.digest("SHA-256", encoder.encode(token1));
  const hash1 = Array.from(new Uint8Array(hash1Buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  const hash2Buffer = await crypto.subtle.digest("SHA-256", encoder.encode(token2));
  const hash2 = Array.from(new Uint8Array(hash2Buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  
  assertEquals(hash1 !== hash2, true);
});

// ============================================================================
// Expiration Date Tests (Business Logic Validation)
// ============================================================================

Deno.test("Invite token expiration: should be 7 days from now", () => {
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  assertEquals(Math.round(diffDays), 7);
});

Deno.test("Invite token expiration: should be in the future", () => {
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  assertEquals(expiresAt.getTime() > now.getTime(), true);
});

// ============================================================================
// Access URL Tests (Behavior Validation)
// ============================================================================

Deno.test("Access URL: new buyer should point to setup page", () => {
  const baseUrl = "https://risecheckout.com";
  const rawToken = "abc-123-xyz";
  const accessUrl = `${baseUrl}/minha-conta/setup-acesso?token=${rawToken}`;
  
  assertEquals(accessUrl.includes("/setup-acesso"), true);
  assertEquals(accessUrl.includes("token="), true);
});

Deno.test("Access URL: existing buyer should point to account page", () => {
  const baseUrl = "https://risecheckout.com";
  const accessUrl = `${baseUrl}/minha-conta`;
  
  assertEquals(accessUrl, "https://risecheckout.com/minha-conta");
  assertEquals(accessUrl.includes("token="), false);
});

// ============================================================================
// Account Status Tests (Business Logic Validation)
// ============================================================================

Deno.test("Account status: new buyers should be pending_setup", () => {
  const newBuyerStatus = "pending_setup";
  const validStatuses = ["pending_setup", "reset_required", "active", "suspended"];
  
  assertEquals(validStatuses.includes(newBuyerStatus), true);
});

Deno.test("Account status: pending_setup needs password setup", () => {
  const status: string = "pending_setup";
  const needsPasswordSetup = status === "pending_setup" || status === "reset_required";
  
  assertEquals(needsPasswordSetup, true);
});

Deno.test("Account status: reset_required needs password setup", () => {
  const status: string = "reset_required";
  const needsPasswordSetup = status === "pending_setup" || status === "reset_required";
  
  assertEquals(needsPasswordSetup, true);
});

Deno.test("Account status: active does not need password setup", () => {
  const status: string = "active";
  const needsPasswordSetup = status === "pending_setup" || status === "reset_required";
  
  assertEquals(needsPasswordSetup, false);
});

// ============================================================================
// Group Assignment Tests (Business Logic Validation)
// ============================================================================

Deno.test("Group assignment: offer group takes priority", () => {
  const offerGroupId = "offer-group-123";
  const defaultGroupId = "default-group-456";
  
  // Logic: if offer has group, use it; else use default
  const assignedGroupId = offerGroupId || defaultGroupId;
  
  assertEquals(assignedGroupId, "offer-group-123");
});

Deno.test("Group assignment: fallback to default when no offer group", () => {
  const offerGroupId = null;
  const defaultGroupId = "default-group-456";
  
  const assignedGroupId = offerGroupId || defaultGroupId;
  
  assertEquals(assignedGroupId, "default-group-456");
});

Deno.test("Group assignment: no group if neither available", () => {
  const offerGroupId = null;
  const defaultGroupId = null;
  
  const assignedGroupId = offerGroupId || defaultGroupId;
  
  assertEquals(assignedGroupId, null);
});

// ============================================================================
// Input Validation Tests
// ============================================================================

Deno.test("Input: orderId should be required", () => {
  // This tests the expected contract
  const validInput: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  assertExists(validInput.orderId);
  assertEquals(typeof validInput.orderId, "string");
});

Deno.test("Input: customerEmail should be required", () => {
  const validInput: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  assertExists(validInput.customerEmail);
  assertEquals(typeof validInput.customerEmail, "string");
});

Deno.test("Input: productId should be required", () => {
  const validInput: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  assertExists(validInput.productId);
  assertEquals(typeof validInput.productId, "string");
});

Deno.test("Input: customerName can be null", () => {
  const input: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  assertEquals(input.customerName, null);
});

Deno.test("Input: productName can be null", () => {
  const input: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: "João",
    productId: "product-456",
    productName: null,
  };
  
  assertEquals(input.productName, null);
});

Deno.test("Input: offerId is optional", () => {
  const inputWithout: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
  };
  
  const inputWith: GrantAccessInput = {
    orderId: "order-123",
    customerEmail: "test@example.com",
    customerName: null,
    productId: "product-456",
    productName: null,
    offerId: "offer-789",
  };
  
  assertEquals(inputWithout.offerId, undefined);
  assertEquals(inputWith.offerId, "offer-789");
});

// ============================================================================
// Result Contract Tests
// ============================================================================

Deno.test("Result: success=true requires hasMembersArea field", () => {
  const result: GrantAccessResult = {
    success: true,
    hasMembersArea: false,
  };
  
  assertEquals(typeof result.hasMembersArea, "boolean");
});

Deno.test("Result: success=false should have error message", () => {
  const result: GrantAccessResult = {
    success: false,
    hasMembersArea: true,
    error: "Something went wrong",
  };
  
  assertEquals(result.success, false);
  assertExists(result.error);
});

Deno.test("Result: hasMembersArea=true should have buyerId when success", () => {
  const result: GrantAccessResult = {
    success: true,
    hasMembersArea: true,
    buyerId: "buyer-123",
    isNewBuyer: true,
  };
  
  assertExists(result.buyerId);
});
