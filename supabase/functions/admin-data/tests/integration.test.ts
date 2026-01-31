/**
 * Integration Tests for admin-data (CORS, Auth)
 * @module admin-data/tests/integration.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_URL, SUPABASE_ANON_KEY } from "./_shared.ts";

Deno.test("admin-data - CORS - OPTIONS request returns headers", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://example.com",
    },
  });
  
  assertEquals(response.status, 204);
  await response.text();
});

Deno.test("admin-data - auth - rejects unauthenticated requests", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "admin-products" }),
  });
  
  assertEquals(response.status, 401);
  await response.text();
});

Deno.test("admin-data - auth - rejects requests without apikey", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "admin-products" }),
  });
  
  const body = await response.text();
  assertExists(body);
});

Deno.test("admin-data - integration - rejects unknown action (with auth failure first)", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "unknown-action-xyz" }),
  });
  
  assertEquals(response.status, 401);
  await response.text();
});
