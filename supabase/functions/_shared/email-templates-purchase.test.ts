/**
 * Email Templates Purchase Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for purchase confirmation email templates.
 *
 * @module _shared/email-templates-purchase
 */

import {
  assertStringIncludes,
  assertNotMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getPurchaseConfirmationTemplate,
  getPurchaseConfirmationTextTemplate,
} from "./email-templates-purchase.ts";
import type { PurchaseConfirmationData } from "./email-templates-base.ts";

// ============================================================================
// TEST DATA
// ============================================================================

const baseData: PurchaseConfirmationData = {
  customerName: "João Silva",
  productName: "Curso de Marketing Digital",
  amountCents: 19900,
  orderId: "abc12345-6789-0def-ghij-klmnopqrstuv",
};

const fullData: PurchaseConfirmationData = {
  ...baseData,
  paymentMethod: "Cartão de Crédito",
  sellerName: "Empresa XYZ",
  supportEmail: "suporte@empresaxyz.com",
  deliveryUrl: "https://example.com/access/product-123",
};

// ============================================================================
// TEST SUITE: getPurchaseConfirmationTemplate (HTML)
// ============================================================================

Deno.test("HTML - returns valid HTML document", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML - includes customer name", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "João Silva");
});

Deno.test("HTML - includes product name", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "Curso de Marketing Digital");
});

Deno.test("HTML - includes formatted amount", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "199,00");
});

Deno.test("HTML - includes truncated order ID uppercase", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "#ABC12345");
});

Deno.test("HTML - includes CTA when deliveryUrl provided", () => {
  const html = getPurchaseConfirmationTemplate(fullData);
  assertStringIncludes(html, "Acessar meu produto");
  assertStringIncludes(html, 'href="https://example.com/access/product-123"');
});

Deno.test("HTML - excludes CTA when deliveryUrl not provided", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertNotMatch(html, /Acessar meu produto/);
});

Deno.test("HTML - includes payment method when provided", () => {
  const html = getPurchaseConfirmationTemplate(fullData);
  assertStringIncludes(html, "Forma de Pagamento");
  assertStringIncludes(html, "Cartão de Crédito");
});

Deno.test("HTML - includes seller name when provided", () => {
  const html = getPurchaseConfirmationTemplate(fullData);
  assertStringIncludes(html, "Vendido por:");
  assertStringIncludes(html, "Empresa XYZ");
});

Deno.test("HTML - includes custom support email when provided", () => {
  const html = getPurchaseConfirmationTemplate(fullData);
  assertStringIncludes(html, "suporte@empresaxyz.com");
});

Deno.test("HTML - uses default support email when not provided", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "suporte@risecheckout.com");
});

Deno.test("HTML - includes Rise Checkout branding", () => {
  const html = getPurchaseConfirmationTemplate(baseData);
  assertStringIncludes(html, "Rise Checkout");
});

// ============================================================================
// TEST SUITE: getPurchaseConfirmationTextTemplate (Text)
// ============================================================================

Deno.test("Text - includes confirmation header", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "COMPRA CONFIRMADA ✓");
});

Deno.test("Text - includes customer name", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Olá, João Silva!");
});

Deno.test("Text - includes order details section", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DO PEDIDO");
  assertStringIncludes(text, "==================");
});

Deno.test("Text - includes product name", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Produto: Curso de Marketing Digital");
});

Deno.test("Text - includes order ID", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Nº do Pedido: #ABC12345");
});

Deno.test("Text - includes access section when deliveryUrl provided", () => {
  const text = getPurchaseConfirmationTextTemplate(fullData);
  assertStringIncludes(text, "SEU ACESSO ESTÁ LIBERADO!");
  assertStringIncludes(text, "https://example.com/access/product-123");
});

Deno.test("Text - excludes access section when deliveryUrl not provided", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertNotMatch(text, /SEU ACESSO ESTÁ LIBERADO!/);
});

Deno.test("Text - includes payment method when provided", () => {
  const text = getPurchaseConfirmationTextTemplate(fullData);
  assertStringIncludes(text, "Forma de Pagamento: Cartão de Crédito");
});

Deno.test("Text - includes Rise Checkout reference", () => {
  const text = getPurchaseConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Rise Checkout");
});
