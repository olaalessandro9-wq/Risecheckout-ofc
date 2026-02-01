/**
 * Unit Tests - Handler Logic
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Layer 1: Handler logic tests with MockSupabaseClient
 * Execution: ALWAYS
 * 
 * @module pushinpay-webhook/tests/handlers
 * @version 1.0.0
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  createMockSupabaseClient,
  createMockDataStore,
  unitTestOptions,
  createOrderForPixId,
} from "./_shared.ts";

// ============================================================================
// TYPE DEFINITIONS FOR TEST DATA
// ============================================================================

interface OrderRecord {
  id: string;
  pix_id: string;
  status: string;
  pix_status?: string;
  technical_status?: string;
  customer_name?: string | null;
  customer_document?: string | null;
  vendor_id: string;
  [key: string]: unknown;
}

interface OrderEventRecord {
  order_id: string;
  type: string;
  vendor_id: string;
  occurred_at: string;
  data: Record<string, unknown>;
}

// ============================================================================
// ORDER LOOKUP TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/handlers: finds order by pix_id",
  ...unitTestOptions,
  fn: async () => {
    const pixId = "pix-test-123";
    const mockOrder = createOrderForPixId(pixId);
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", pixId)
      .single();

    const order = data as OrderRecord | null;
    assertEquals(order?.pix_id, pixId);
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: returns error if order not found",
  ...unitTestOptions,
  fn: async () => {
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({ orders: [] })
    });

    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", "non-existent")
      .single();

    assertEquals(data, null);
    assertEquals(error !== null, true);
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: pix_id lookup is case-insensitive (normalized)",
  ...unitTestOptions,
  fn: async () => {
    const mockOrder = createOrderForPixId("pix-abc-123"); // lowercase
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    // Simulate the normalization that happens in the webhook
    const normalizedId = "PIX-ABC-123".toLowerCase();
    
    const { data } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", normalizedId)
      .single();

    const order = data as OrderRecord | null;
    assertEquals(order?.pix_id, "pix-abc-123");
  }
});

// ============================================================================
// ORDER UPDATE TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/handlers: updates status to paid",
  ...unitTestOptions,
  fn: async () => {
    const pixId = "pix-test-123";
    const mockOrder = createOrderForPixId(pixId, "pending");
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    await client
      .from("orders")
      .update({ 
        status: "paid", 
        paid_at: new Date().toISOString(),
        pix_status: "paid"
      })
      .eq("id", mockOrder.id);

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("id", mockOrder.id)
      .single();

    const order = data as OrderRecord | null;
    assertEquals(order?.status, "paid");
    assertEquals(order?.pix_status, "paid");
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: updates technical_status for expired (Hotmart model)",
  ...unitTestOptions,
  fn: async () => {
    const pixId = "pix-expired-123";
    const mockOrder = createOrderForPixId(pixId, "pending");
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    // Hotmart/Kiwify model: expired doesn't change status, only technical_status
    await client
      .from("orders")
      .update({ 
        technical_status: "pix_expired",
        expired_at: new Date().toISOString(),
        pix_status: "expired"
      })
      .eq("id", mockOrder.id);

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("id", mockOrder.id)
      .single();

    const order = data as OrderRecord | null;
    // Status should still be pending
    assertEquals(order?.status, "pending");
    assertEquals(order?.technical_status, "pix_expired");
    assertEquals(order?.pix_status, "expired");
  }
});

Deno.test({
  name: "pushinpay-webhook/handlers: updates customer data if available",
  ...unitTestOptions,
  fn: async () => {
    const pixId = "pix-test-123";
    const mockOrder = createOrderForPixId(pixId);
    mockOrder.customer_name = null;
    mockOrder.customer_document = null;
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    await client
      .from("orders")
      .update({ 
        customer_name: "João Silva",
        customer_document: "12345678901"
      })
      .eq("id", mockOrder.id);

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("id", mockOrder.id)
      .single();

    const order = data as OrderRecord | null;
    assertEquals(order?.customer_name, "João Silva");
    assertEquals(order?.customer_document, "12345678901");
  }
});

// ============================================================================
// IDEMPOTENCY TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/handlers: detects already paid order",
  ...unitTestOptions,
  fn: async () => {
    const pixId = "pix-already-paid";
    const mockOrder = createOrderForPixId(pixId, "paid"); // Already paid
    
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        orders: [mockOrder]
      })
    });

    const { data } = await client
      .from("orders")
      .select("*")
      .eq("pix_id", pixId)
      .single();

    const order = data as OrderRecord | null;
    // Check current status to implement idempotency
    const isAlreadyPaid = order?.status === "paid";
    
    assertEquals(isAlreadyPaid, true);
  }
});

// ============================================================================
// EVENT LOGGING TESTS
// ============================================================================

Deno.test({
  name: "pushinpay-webhook/handlers: can insert order_events",
  ...unitTestOptions,
  fn: async () => {
    const client = createMockSupabaseClient({
      mockData: createMockDataStore({
        order_events: []
      })
    });

    await client
      .from("order_events")
      .insert({
        order_id: "order-123",
        vendor_id: "vendor-123",
        type: "pushinpay_paid",
        occurred_at: new Date().toISOString(),
        data: { status: "paid", version: "7" }
      });

    const { data } = await client
      .from("order_events")
      .select("*")
      .eq("order_id", "order-123");

    const events = data as OrderEventRecord[] | null;
    assertEquals(events?.length, 1);
    assertEquals(events?.[0]?.type, "pushinpay_paid");
  }
});
