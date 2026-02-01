/**
 * Tests for Mock Supabase Client
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Validates the centralized mock Supabase client implementation.
 * 
 * @module _shared/testing/__tests__/mock-supabase-client.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import {
  createMockSupabaseClient,
  createMockDataStore,
  createEmptyDataStore,
  createMockUser,
} from "../mod.ts";

// ============================================================================
// SELECT TESTS
// ============================================================================

Deno.test("MockSupabaseClient: select returns all data from table", async () => {
  const users = [
    { id: "1", email: "user1@test.com", name: "User 1" },
    { id: "2", email: "user2@test.com", name: "User 2" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users }),
  });

  const { data, error } = await client.from("users").select("*");

  assertEquals(error, null);
  assertEquals(data?.length, 2);
});

Deno.test("MockSupabaseClient: select with eq filter", async () => {
  const users = [
    { id: "1", email: "user1@test.com" },
    { id: "2", email: "user2@test.com" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users }),
  });

  const { data, error } = await client.from("users").select("*").eq("id", "1");

  assertEquals(error, null);
  assertEquals(data?.length, 1);
  assertEquals((data?.[0] as { id: string }).id, "1");
});

Deno.test("MockSupabaseClient: select with multiple filters", async () => {
  const orders = [
    { id: "1", status: "paid", vendor_id: "v1" },
    { id: "2", status: "pending", vendor_id: "v1" },
    { id: "3", status: "paid", vendor_id: "v2" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ orders }),
  });

  const { data } = await client
    .from("orders")
    .select("*")
    .eq("status", "paid")
    .eq("vendor_id", "v1");

  assertEquals(data?.length, 1);
  assertEquals((data?.[0] as { id: string }).id, "1");
});

Deno.test("MockSupabaseClient: select with in filter", async () => {
  const products = [
    { id: "p1", status: "active" },
    { id: "p2", status: "inactive" },
    { id: "p3", status: "active" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ products }),
  });

  const { data } = await client
    .from("products")
    .select("*")
    .in("id", ["p1", "p3"]);

  assertEquals(data?.length, 2);
});

Deno.test("MockSupabaseClient: select with order", async () => {
  const items = [
    { id: "1", position: 3 },
    { id: "2", position: 1 },
    { id: "3", position: 2 },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ items }),
  });

  const { data } = await client
    .from("items")
    .select("*")
    .order("position", { ascending: true });

  assertEquals((data?.[0] as { position: number }).position, 1);
  assertEquals((data?.[1] as { position: number }).position, 2);
  assertEquals((data?.[2] as { position: number }).position, 3);
});

Deno.test("MockSupabaseClient: select with limit", async () => {
  const items = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ items }),
  });

  const { data } = await client.from("items").select("*").limit(2);

  assertEquals(data?.length, 2);
});

Deno.test("MockSupabaseClient: single returns one row", async () => {
  const users = [{ id: "1", email: "test@test.com" }];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users }),
  });

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", "1")
    .single();

  assertEquals(error, null);
  assertExists(data);
  assertEquals((data as { id: string }).id, "1");
});

Deno.test("MockSupabaseClient: single returns error for no rows", async () => {
  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users: [] }),
  });

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", "nonexistent")
    .single();

  assertEquals(data, null);
  assertExists(error);
  assertEquals(error?.code, "PGRST116");
});

Deno.test("MockSupabaseClient: maybeSingle returns null for no rows", async () => {
  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users: [] }),
  });

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", "nonexistent")
    .maybeSingle();

  assertEquals(data, null);
  assertEquals(error, null);
});

// ============================================================================
// INSERT TESTS
// ============================================================================

Deno.test("MockSupabaseClient: insert adds record to table", async () => {
  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users: [] }),
  });

  const { data, error } = await client
    .from("users")
    .insert({ email: "new@test.com", name: "New User" });

  assertEquals(error, null);
  assertEquals(data?.length, 1);
  assertExists((data?.[0] as { id: string }).id);
});

Deno.test("MockSupabaseClient: insert multiple records", async () => {
  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ items: [] }),
  });

  const { data } = await client.from("items").insert([
    { name: "Item 1" },
    { name: "Item 2" },
  ]);

  assertEquals(data?.length, 2);
});

// ============================================================================
// UPDATE TESTS
// ============================================================================

Deno.test("MockSupabaseClient: update modifies filtered records", async () => {
  const users = [
    { id: "1", name: "Old Name", status: "active" },
    { id: "2", name: "Other User", status: "active" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ users }),
  });

  const { data } = await client
    .from("users")
    .update({ name: "New Name" })
    .eq("id", "1");

  assertEquals(data?.length, 1);
  assertEquals((data?.[0] as { name: string }).name, "New Name");
});

// ============================================================================
// DELETE TESTS
// ============================================================================

Deno.test("MockSupabaseClient: delete removes filtered records", async () => {
  const items = [
    { id: "1", status: "deleted" },
    { id: "2", status: "active" },
    { id: "3", status: "deleted" },
  ];

  const client = createMockSupabaseClient({
    mockData: createMockDataStore({ items }),
  });

  await client.from("items").delete().eq("status", "deleted");

  // Check remaining items
  const { data } = await client.from("items").select("*");
  assertEquals(data?.length, 1);
  assertEquals((data?.[0] as { id: string }).id, "2");
});

// ============================================================================
// AUTH TESTS
// ============================================================================

Deno.test("MockSupabaseClient: auth.getUser returns configured user", async () => {
  const mockUser = createMockUser({ email: "auth@test.com" });

  const client = createMockSupabaseClient({
    authUser: mockUser,
  });

  const { data, error } = await client.auth.getUser();

  assertEquals(error, null);
  assertEquals(data.user?.email, "auth@test.com");
});

Deno.test("MockSupabaseClient: auth.getUser returns null when not authenticated", async () => {
  const client = createMockSupabaseClient({
    authUser: null,
  });

  const { data } = await client.auth.getUser();

  assertEquals(data.user, null);
});

// ============================================================================
// RPC TESTS
// ============================================================================

Deno.test("MockSupabaseClient: rpc calls configured handler", async () => {
  const client = createMockSupabaseClient({
    rpcHandlers: {
      calculate_total: async (params: unknown) => {
        const { items } = params as { items: number[] };
        return items.reduce((a, b) => a + b, 0);
      },
    },
  });

  const { data, error } = await client.rpc("calculate_total", { items: [1, 2, 3, 4, 5] });

  assertEquals(error, null);
  assertEquals(data, 15);
});

Deno.test("MockSupabaseClient: rpc returns error for unmocked function", async () => {
  const client = createMockSupabaseClient();

  const { data, error } = await client.rpc("unmocked_function");

  assertEquals(data, null);
  assertExists(error);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test("MockSupabaseClient: forceError returns error on all operations", async () => {
  const client = createMockSupabaseClient({
    forceError: { message: "Database unavailable", code: "CONNECTION_ERROR" },
    mockData: createMockDataStore({ users: [{ id: "1" }] }),
  });

  // Select should fail
  const selectResult = await client.from("users").select("*");
  assertExists(selectResult.error);
  assertEquals(selectResult.error?.code, "CONNECTION_ERROR");

  // Auth should fail
  const authResult = await client.auth.getUser();
  assertExists(authResult.error);

  // RPC should fail
  const rpcResult = await client.rpc("any_function");
  assertExists(rpcResult.error);
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

Deno.test("createEmptyDataStore: returns empty Map", () => {
  const store = createEmptyDataStore();

  assertEquals(store.size, 0);
});

Deno.test("createMockDataStore: creates Map from object", () => {
  const store = createMockDataStore({
    users: [{ id: "1" }],
    products: [{ id: "p1" }, { id: "p2" }],
  });

  assertEquals(store.size, 2);
  assertEquals(store.get("users")?.length, 1);
  assertEquals(store.get("products")?.length, 2);
});
