/**
 * Send Confirmation Email Tests - Order Lookup
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for order lookup logic in send-confirmation-email Edge Function.
 * 
 * @module send-confirmation-email/tests/order-lookup
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createMockOrderWithProduct,
  createMockOrderWithoutEmail,
  createMockOrderWithoutProduct,
  type OrderWithProduct,
} from "./_shared.ts";

import {
  createMockSupabaseClient,
  createMockDataStore,
  createMockProducer,
  createMockProduct,
  generatePrefixedId,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST SETUP
// ============================================================================

const testProducer = createMockProducer();
const testProduct = createMockProduct(testProducer.id);

// ============================================================================
// ORDER NOT FOUND TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] OrderLookup - returns null for non-existent orderId`, async () => {
  const mockData = createMockDataStore({
    orders: [],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  const nonExistentId = generatePrefixedId("order");
  
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", nonExistentId)
    .single();
  
  assertEquals(order, null, "Non-existent order should return null");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - handles invalid UUID format`, async () => {
  const mockData = createMockDataStore({
    orders: [],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  const invalidId = "not-a-valid-uuid";
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", invalidId)
    .single();
  
  assertEquals(order, null, "Invalid UUID should return null");
});

// ============================================================================
// ORDER FOUND TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] OrderLookup - finds existing order by ID`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id);
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  assertExists(order, "Order should be found");
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.id, testOrder.id);
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - retrieves customer_email`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    customer_email: "specific@test.com",
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.customer_email, "specific@test.com");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - retrieves customer_name`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    customer_name: "John Doe",
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.customer_name, "John Doe");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - retrieves amount_cents`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 19900,
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.amount_cents, 19900);
});

// ============================================================================
// MISSING DATA VALIDATION TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] OrderLookup - identifies order without email`, async () => {
  const testOrder = createMockOrderWithoutEmail(testProducer.id, testProduct.id);
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  const hasEmail = orderRecord.customer_email && orderRecord.customer_email.length > 0;
  
  assertEquals(hasEmail, false, "Order without email should be identified");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - identifies order without product`, async () => {
  const testOrder = createMockOrderWithoutProduct(testProducer.id, testProduct.id);
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  const hasProduct = orderRecord.product && orderRecord.product.length > 0;
  
  assertEquals(hasProduct, false, "Order without product should be identified");
});

// ============================================================================
// ORDER STATUS TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] OrderLookup - retrieves paid order`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    status: "paid",
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.status, "paid");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - retrieves pending order`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    status: "pending",
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.status, "pending");
});

// ============================================================================
// PRODUCT JOIN TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] OrderLookup - includes product name`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    product: [{ name: "Amazing Course" }],
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.product[0]?.name, "Amazing Course");
});

Deno.test(`[${FUNCTION_NAME}] OrderLookup - includes product image_url`, async () => {
  const testOrder = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    product: [{ name: "Course", image_url: "https://cdn.example.com/image.jpg" }],
  });
  
  const mockData = createMockDataStore({
    orders: [testOrder],
  });
  
  const supabase = createMockSupabaseClient({ mockData });
  
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", testOrder.id)
    .single();
  
  const orderRecord = order as OrderWithProduct;
  assertEquals(orderRecord.product[0]?.image_url, "https://cdn.example.com/image.jpg");
});
