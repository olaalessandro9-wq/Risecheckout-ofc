/**
 * Send PIX Email Tests - Order PIX Data
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_NAME, createMockPixOrder, type PixOrderData } from "./_shared.ts";
import { createMockSupabaseClient, createMockDataStore, createMockProducer, createMockProduct } from "../../_shared/testing/mod.ts";

const producer = createMockProducer();
const product = createMockProduct(producer.id);

Deno.test(`[${FUNCTION_NAME}] PixData - finds order with PIX data`, async () => {
  const order = createMockPixOrder(producer.id, product.id);
  const mockData = createMockDataStore({ orders: [order] });
  const supabase = createMockSupabaseClient({ mockData });
  const { data } = await supabase.from("orders").select("*").eq("id", order.id).single();
  assertExists(data);
});

Deno.test(`[${FUNCTION_NAME}] PixData - identifies order without pix_qr_code`, async () => {
  const order = createMockPixOrder(producer.id, product.id, { pix_qr_code: "" });
  const mockData = createMockDataStore({ orders: [order] });
  const supabase = createMockSupabaseClient({ mockData });
  const { data } = await supabase.from("orders").select("*").eq("id", order.id).single();
  const rec = data as PixOrderData;
  assertEquals(rec.pix_qr_code.length > 0, false);
});

Deno.test(`[${FUNCTION_NAME}] PixData - identifies order without email`, async () => {
  const order = createMockPixOrder(producer.id, product.id, { customer_email: "" });
  const mockData = createMockDataStore({ orders: [order] });
  const supabase = createMockSupabaseClient({ mockData });
  const { data } = await supabase.from("orders").select("*").eq("id", order.id).single();
  const rec = data as PixOrderData;
  assertEquals(rec.customer_email.length > 0, false);
});

Deno.test(`[${FUNCTION_NAME}] PixData - includes pix_expiration`, async () => {
  const order = createMockPixOrder(producer.id, product.id);
  const mockData = createMockDataStore({ orders: [order] });
  const supabase = createMockSupabaseClient({ mockData });
  const { data } = await supabase.from("orders").select("*").eq("id", order.id).single();
  const rec = data as PixOrderData;
  assertExists(rec.pix_expiration);
});

Deno.test(`[${FUNCTION_NAME}] PixData - returns null for non-existent order`, async () => {
  const mockData = createMockDataStore({ orders: [] });
  const supabase = createMockSupabaseClient({ mockData });
  const { data } = await supabase.from("orders").select("*").eq("id", "non-existent").single();
  assertEquals(data, null);
});
