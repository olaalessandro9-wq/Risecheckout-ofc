/**
 * Email Templates External Delivery Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for external delivery confirmation email templates.
 *
 * @module _shared/email-templates-external
 */

import {
  assertStringIncludes,
  assertNotMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getExternalDeliveryConfirmationTemplate,
  getExternalDeliveryConfirmationTextTemplate,
} from "./email-templates-external.ts";
import type { PurchaseConfirmationData } from "./email-templates-base.ts";

// ============================================================================
// TEST DATA
// ============================================================================

const baseData: PurchaseConfirmationData = {
  customerName: "Lucas Cliente",
  productName: "Consultoria Personalizada",
  amountCents: 99900,
  orderId: "ext12345-6789-0abc-defg-hijklmnopqrs",
};

const fullData: PurchaseConfirmationData = {
  ...baseData,
  paymentMethod: "PIX",
  sellerName: "Consultoria Pro",
  supportEmail: "contato@consultoriapro.com",
};

// ============================================================================
// TEST SUITE: getExternalDeliveryConfirmationTemplate (HTML)
// ============================================================================

Deno.test("HTML External - returns valid HTML document", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML External - has specific title for payment confirmation", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "<title>Pagamento Confirmado");
});

Deno.test("HTML External - has payment confirmed message", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "Pagamento confirmado!");
});

Deno.test("HTML External - does NOT have Sua compra foi confirmada", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertNotMatch(html, /Sua compra foi confirmada!/);
});

Deno.test("HTML External - has info section about delivery", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "info-section");
});

Deno.test("HTML External - includes package emoji", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "📦");
});

Deno.test("HTML External - explains vendor will contact", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "vendedor entrará em contato");
});

Deno.test("HTML External - mentions 24 hours timeframe", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "24 horas");
});

Deno.test("HTML External - does NOT have access button", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertNotMatch(html, /Acessar meu produto/);
  assertNotMatch(html, /Acessar Área de Membros/);
  assertNotMatch(html, /cta-button/);
});

Deno.test("HTML External - includes customer name", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "Lucas Cliente");
});

Deno.test("HTML External - includes product name", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "Consultoria Personalizada");
});

Deno.test("HTML External - includes truncated order ID", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "#EXT12345");
});

Deno.test("HTML External - includes formatted amount", () => {
  const html = getExternalDeliveryConfirmationTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "999,00");
});

Deno.test("HTML External - includes payment method when provided", () => {
  const html = getExternalDeliveryConfirmationTemplate(fullData);
  assertStringIncludes(html, "Forma de Pagamento");
  assertStringIncludes(html, "PIX");
});

Deno.test("HTML External - includes custom support email when provided", () => {
  const html = getExternalDeliveryConfirmationTemplate(fullData);
  assertStringIncludes(html, "contato@consultoriapro.com");
});

Deno.test("HTML External - includes seller name when provided", () => {
  const html = getExternalDeliveryConfirmationTemplate(fullData);
  assertStringIncludes(html, "Vendido por:");
  assertStringIncludes(html, "Consultoria Pro");
});

// ============================================================================
// TEST SUITE: getExternalDeliveryConfirmationTextTemplate (Text)
// ============================================================================

Deno.test("Text External - has payment confirmed header", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "PAGAMENTO CONFIRMADO ✓");
});

Deno.test("Text External - does NOT have COMPRA CONFIRMADA", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertNotMatch(text, /COMPRA CONFIRMADA/);
});

Deno.test("Text External - includes customer name", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Olá, Lucas Cliente!");
});

Deno.test("Text External - has delivery section with emoji", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "📦");
  assertStringIncludes(text, "ENTREGA");
});

Deno.test("Text External - explains vendor will contact", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "vendedor entrará em contato");
});

Deno.test("Text External - mentions 24 hours timeframe", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "24 horas");
});

Deno.test("Text External - does NOT have access URL", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertNotMatch(text, /Acesse seu produto:/);
  assertNotMatch(text, /ACESSE SUA ÁREA/);
});

Deno.test("Text External - includes order details", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DO PEDIDO");
  assertStringIncludes(text, "Produto: Consultoria Personalizada");
  assertStringIncludes(text, "Nº do Pedido: #EXT12345");
});

Deno.test("Text External - includes Rise Checkout reference", () => {
  const text = getExternalDeliveryConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Rise Checkout");
});
