/**
 * Email Templates Seller Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for seller notification email templates.
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
  sellerName: "Carlos Produtor",
  customerName: "Ana Compradora",
  customerEmail: "ana@example.com",
  productName: "Ebook Avançado",
  amountCents: 9700,
  orderId: "sale12345-6789-0abc-defg-hijklmnopqrs",
};

const fullData: NewSaleData = {
  ...baseData,
  paymentMethod: "PIX",
  gateway: "Asaas",
};

// ============================================================================
// TEST SUITE: getNewSaleTemplate (HTML)
// ============================================================================

Deno.test("HTML Seller - returns valid HTML document", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML Seller - has sale notification indicator", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "💰");
  assertStringIncludes(html, "Nova Venda!");
});

Deno.test("HTML Seller - has congratulations message", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Você realizou uma venda!");
});

Deno.test("HTML Seller - includes seller name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Carlos Produtor");
});

Deno.test("HTML Seller - includes product name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Ebook Avançado");
});

Deno.test("HTML Seller - includes customer name", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Ana Compradora");
});

Deno.test("HTML Seller - includes customer email", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "ana@example.com");
});

Deno.test("HTML Seller - includes truncated order ID", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "#SALE1234");
});

Deno.test("HTML Seller - includes formatted amount", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "97,00");
});

Deno.test("HTML Seller - labels amount as Valor da Venda", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "Valor da Venda");
});

Deno.test("HTML Seller - includes payment method when provided", () => {
  const html = getNewSaleTemplate(fullData);
  assertStringIncludes(html, "Forma de Pagamento");
  assertStringIncludes(html, "PIX");
});

Deno.test("HTML Seller - excludes payment method when not provided", () => {
  const html = getNewSaleTemplate(baseData);
  assertNotMatch(html, /Forma de Pagamento/);
});

Deno.test("HTML Seller - includes gateway when provided", () => {
  const html = getNewSaleTemplate(fullData);
  assertStringIncludes(html, "Gateway");
  assertStringIncludes(html, "Asaas");
});

Deno.test("HTML Seller - includes dashboard reference", () => {
  const html = getNewSaleTemplate(baseData);
  assertStringIncludes(html, "painel");
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
  assertStringIncludes(text, "Olá, Carlos Produtor!");
});

Deno.test("Text Seller - announces the sale", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Você acaba de realizar uma nova venda!");
});

Deno.test("Text Seller - includes details section", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DA VENDA");
});

Deno.test("Text Seller - includes product name", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Produto: Ebook Avançado");
});

Deno.test("Text Seller - includes customer info", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Cliente: Ana Compradora");
  assertStringIncludes(text, "Email: ana@example.com");
});

Deno.test("Text Seller - includes order ID", () => {
  const text = getNewSaleTextTemplate(baseData);
  assertStringIncludes(text, "Nº do Pedido: #SALE1234");
});

Deno.test("Text Seller - includes payment method when provided", () => {
  const text = getNewSaleTextTemplate(fullData);
  assertStringIncludes(text, "Forma de Pagamento: PIX");
});

Deno.test("Text Seller - includes gateway when provided", () => {
  const text = getNewSaleTextTemplate(fullData);
  assertStringIncludes(text, "Gateway: Asaas");
});
