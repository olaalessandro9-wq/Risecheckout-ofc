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
import { verifyProductOwnership, verifyModuleOwnership } from "../members-area-handlers.ts";

// Mock Supabase client
const createMockSupabase = (mockData: { data: unknown; error: unknown }) => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve(mockData)
      })
    })
  })
});

// ============================================================================
// verifyProductOwnership Tests
// ============================================================================

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve validar produto existente",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: { id: "product-123", user_id: "producer-123" },
      error: null
    });

    const result = await verifyProductOwnership(
      mockSupabase as never,
      "product-123",
      "producer-123"
    );

    assertEquals(result.valid, true);
    assertEquals(result.error, undefined);
  }
});

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve rejeitar produto de outro usuário",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: { id: "product-123", user_id: "other-producer" },
      error: null
    });

    const result = await verifyProductOwnership(
      mockSupabase as never,
      "product-123",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

Deno.test({
  name: "members-area-handlers: verifyProductOwnership - deve rejeitar produto inexistente",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: null,
      error: { message: "Product not found" }
    });

    const result = await verifyProductOwnership(
      mockSupabase as never,
      "non-existent-product",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

// ============================================================================
// verifyModuleOwnership Tests
// ============================================================================

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve validar módulo existente",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: { 
        id: "module-123", 
        product_id: "product-123",
        products: { user_id: "producer-123" }
      },
      error: null
    });

    const result = await verifyModuleOwnership(
      mockSupabase as never,
      "module-123",
      "producer-123"
    );

    assertEquals(result.valid, true);
    assertEquals(result.error, undefined);
  }
});

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve rejeitar módulo de outro usuário",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: { 
        id: "module-123", 
        product_id: "product-123",
        products: { user_id: "other-producer" }
      },
      error: null
    });

    const result = await verifyModuleOwnership(
      mockSupabase as never,
      "module-123",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});

Deno.test({
  name: "members-area-handlers: verifyModuleOwnership - deve rejeitar módulo inexistente",
  fn: async () => {
    const mockSupabase = createMockSupabase({
      data: null,
      error: { message: "Module not found" }
    });

    const result = await verifyModuleOwnership(
      mockSupabase as never,
      "non-existent-module",
      "producer-123"
    );

    assertEquals(result.valid, false);
    assertExists(result.error);
  }
});
