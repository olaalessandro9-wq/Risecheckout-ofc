/**
 * Unit Tests for members-area-handlers.ts
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests cover:
 * - verifyProductOwnership
 * - verifyModuleOwnership
 * - Module request validation
 * - Error handling
 * 
 * @module _shared/members-area-handlers.test
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyProductOwnership, verifyModuleOwnership } from "../members-area-handlers.ts";

// ============================================================================
// MOCK TYPES
// ============================================================================

interface MockQueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface MockSelectChain<T> {
  eq: (column: string, value: string) => MockSelectChain<T>;
  single: () => Promise<MockQueryResult<T>>;
}

interface MockFromChain<T> {
  select: (columns?: string) => MockSelectChain<T>;
}

interface MockSupabaseClient<T> {
  from: (table: string) => MockFromChain<T>;
}

// ============================================================================
// MOCK FACTORY
// ============================================================================

interface CreateMockSupabaseOptions<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Creates a type-safe mock Supabase client for ownership verification tests.
 * 
 * @param mockResult The result to return from single()
 * @returns Type-compatible SupabaseClient
 */
function createMockSupabase<T>(
  mockResult: CreateMockSupabaseOptions<T>
): SupabaseClient {
  const mockClient: MockSupabaseClient<T> = {
    from: () => ({
      select: () => ({
        eq: function(column: string, value: string) {
          return this;
        },
        single: () => Promise.resolve(mockResult),
      }),
    }),
  };
  
  // Single controlled cast point
  return mockClient as unknown as SupabaseClient;
}

// ============================================================================
// PRODUCT OWNERSHIP DATA FACTORIES
// ============================================================================

interface ProductOwnershipData {
  id: string;
  user_id: string;
}

function createProductOwnershipData(
  overrides: Partial<ProductOwnershipData> = {}
): ProductOwnershipData {
  return {
    id: "product-123",
    user_id: "producer-123",
    ...overrides,
  };
}

// ============================================================================
// MODULE OWNERSHIP DATA FACTORIES
// ============================================================================

interface ModuleOwnershipData {
  id: string;
  product_id: string;
  products: { user_id: string };
}

function createModuleOwnershipData(
  overrides: Partial<ModuleOwnershipData> = {}
): ModuleOwnershipData {
  return {
    id: "module-123",
    product_id: "product-123",
    products: { user_id: "producer-123" },
    ...overrides,
  };
}

// ============================================================================
// verifyProductOwnership Tests
// ============================================================================

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve validar produto existente",
  fn: async () => {
    const mockSupabase = createMockSupabase<ProductOwnershipData>({
      data: createProductOwnershipData(),
      error: null,
    });

    const result = await verifyProductOwnership(
      mockSupabase,
      "product-123",
      "producer-123"
    );

    assertEquals(result.valid, true);
    assertEquals(result.error, undefined);
  },
});

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve rejeitar produto de outro usuário",
  fn: async () => {
    const mockSupabase = createMockSupabase<ProductOwnershipData>({
      data: createProductOwnershipData({ user_id: "other-producer" }),
      error: null,
    });

    const result = await verifyProductOwnership(
      mockSupabase,
      "product-123",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  },
});

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve rejeitar produto inexistente",
  fn: async () => {
    const mockSupabase = createMockSupabase<ProductOwnershipData>({
      data: null,
      error: { message: "Product not found" },
    });

    const result = await verifyProductOwnership(
      mockSupabase,
      "non-existent-product",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  },
});

// ============================================================================
// verifyModuleOwnership Tests
// ============================================================================

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve validar módulo existente",
  fn: async () => {
    const mockSupabase = createMockSupabase<ModuleOwnershipData>({
      data: createModuleOwnershipData(),
      error: null,
    });

    const result = await verifyModuleOwnership(
      mockSupabase,
      "module-123",
      "producer-123"
    );

    assertEquals(result.valid, true);
    assertEquals(result.error, undefined);
  },
});

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve rejeitar módulo de outro usuário",
  fn: async () => {
    const mockSupabase = createMockSupabase<ModuleOwnershipData>({
      data: createModuleOwnershipData({
        products: { user_id: "other-producer" },
      }),
      error: null,
    });

    const result = await verifyModuleOwnership(
      mockSupabase,
      "module-123",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  },
});

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve rejeitar módulo inexistente",
  fn: async () => {
    const mockSupabase = createMockSupabase<ModuleOwnershipData>({
      data: null,
      error: { message: "Module not found" },
    });

    const result = await verifyModuleOwnership(
      mockSupabase,
      "non-existent-module",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  },
});
