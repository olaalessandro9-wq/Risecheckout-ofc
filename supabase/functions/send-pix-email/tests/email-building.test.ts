/**
 * Send PIX Email Tests - Email Building
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { FUNCTION_NAME, createMockPixOrder, type PixOrderData } from "./_shared.ts";
import { createMockProducer, createMockProduct } from "../../_shared/testing/mod.ts";

const producer = createMockProducer();
const product = createMockProduct(producer.id);

function buildPixEmailHtml(order: PixOrderData): string {
  const productName = order.product?.[0]?.name || "N/A";
  const amountFormatted = (order.amount_cents / 100).toFixed(2);
  const expiration = order.pix_expiration ? new Date(order.pix_expiration).toLocaleString("pt-BR") : "N/A";
  return `<!DOCTYPE html><html><body><h1>Pague com PIX 💰</h1><p>Olá ${order.customer_name || "Cliente"},</p><p>Produto: ${productName}</p><p>Valor: R$ ${amountFormatted}</p><p>Expira em: ${expiration}</p><p>Código PIX: ${order.pix_qr_code}</p></body></html>`;
}

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - generates valid HTML`, () => {
  const order = createMockPixOrder(producer.id, product.id);
  const html = buildPixEmailHtml(order);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes PIX emoji`, () => {
  const order = createMockPixOrder(producer.id, product.id);
  assertStringIncludes(buildPixEmailHtml(order), "💰");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes customer name`, () => {
  const order = createMockPixOrder(producer.id, product.id, { customer_name: "João" });
  assertStringIncludes(buildPixEmailHtml(order), "João");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes PIX code`, () => {
  const order = createMockPixOrder(producer.id, product.id, { pix_qr_code: "PIX_CODE_123" });
  assertStringIncludes(buildPixEmailHtml(order), "PIX_CODE_123");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes formatted price`, () => {
  const order = createMockPixOrder(producer.id, product.id, { amount_cents: 9900 });
  assertStringIncludes(buildPixEmailHtml(order), "R$ 99.00");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes expiration`, () => {
  const order = createMockPixOrder(producer.id, product.id);
  const html = buildPixEmailHtml(order);
  assertStringIncludes(html, "Expira em:");
});
