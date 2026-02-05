/**
 * Email Templates Seller Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for seller notification email templates (refactored to inline <style>).
 *
 * @module _shared/email-templates-seller
 */

import {
  assertStringIncludes,
  assertNotMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getNewSaleTemplate,
  getNewSaleTextTemplate,
} from "./email-templates-seller.ts";
import type { NewSaleData } from "./email-templates-base.ts";

// ============================================================================
// TEST DATA
// ============================================================================

const baseData: NewSaleData = {
  sellerName: "João Vendedor",
  customerName: "Maria Cliente",
  customerEmail: "maria@example.com",
  productName: "Curso Premium",
  amountCents: 29900,
  orderId: "sale12345-6789-0abc-defg-hijklmnopqrs",
};

const dataWithOptionals: NewSaleData = {
  ...baseData,
  paymentMethod: "Cartão de Crédito",
  gateway: "Stripe",
};

// ============================================================================
// TEST SUITE: getNewSaleTemplate (HTML)
// ============================================================================

Deno.test("HTML Seller - returns valid HTML document", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML Seller - uses inline style block (Gmail compatible)", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "<style>");
  assertStringIncludes(html, ".container");
  assertStringIncludes(html, ".success-banner");
});

Deno.test("HTML Seller - has success badge", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "💰");
  assertStringIncludes(html, "Nova Venda!");
});

Deno.test("HTML Seller - has success title", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Você realizou uma venda!");
});

Deno.test("HTML Seller - includes seller name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "João Vendedor");
});

Deno.test("HTML Seller - includes customer name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Maria Cliente");
});

Deno.test("HTML Seller - includes customer email", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "maria@example.com");
});

Deno.test("HTML Seller - includes product name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Curso Premium");
});

Deno.test("HTML Seller - includes truncated order ID", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "#SALE1234");
});

Deno.test("HTML Seller - includes formatted amount", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "299,00");
});

Deno.test("HTML Seller - includes payment method when provided", () => {
  const html = getNewSaleTemplate(dataWithOptionals);
  assertStringIncludes(html, "Cartão de Crédito");
});

Deno.test("HTML Seller - includes gateway when provided", () => {
  const html = getNewSaleTemplate(dataWithOptionals);
  assertStringIncludes(html, "Stripe");
});

Deno.test("HTML Seller - excludes payment method when not provided", () => {
  const html = getNewSaleTemplate(baseData);
  assertNotMatch(html, /Forma de Pagamento.*Cartão/);
});

Deno.test("HTML Seller - has green gradient for success banner", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "#10B981");
  assertStringIncludes(html, "#059669");
});

// ============================================================================
// TEST SUITE: getNewSaleTextTemplate (Text)
// ============================================================================

Deno.test("Text Seller - includes sale header", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "💰 NOVA VENDA!");
});

Deno.test("Text Seller - includes seller name", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Olá, João Vendedor!");
});

Deno.test("Text Seller - includes details section", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DA VENDA");
});

Deno.test("Text Seller - includes customer info", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Cliente: Maria Cliente");
  assertStringIncludes(text, "Email: maria@example.com");
});

Deno.test("Text Seller - includes product name", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Produto: Curso Premium");
});

Deno.test("Text Seller - includes optional payment method", () => {
  const text = getNewSaleTextTemplate(dataWithOptionals);
  assertStringIncludes(text, "Forma de Pagamento: Cartão de Crédito");
});

Deno.test("Text Seller - includes optional gateway", () => {
  const text = getNewSaleTextTemplate(dataWithOptionals);
  assertStringIncludes(text, "Gateway: Stripe");
});