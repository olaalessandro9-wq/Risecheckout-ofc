/**
 * Email Templates Members Area Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for members area confirmation email templates.
 *
 * @module _shared/email-templates-members-area
 */

import {
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getMembersAreaConfirmationTemplate,
  getMembersAreaConfirmationTextTemplate,
} from "./email-templates-members-area.ts";
import type { PurchaseConfirmationData } from "./email-templates-base.ts";

// ============================================================================
// TEST DATA
// ============================================================================

const baseData: PurchaseConfirmationData = {
  customerName: "Pedro Aluno",
  productName: "Curso Completo de TypeScript",
  amountCents: 29700,
  orderId: "member12345-6789-0abc-defg-hijklmnopqrs",
  deliveryUrl: "https://risecheckout.com/minha-conta/produtos/product-123",
};

const fullData: PurchaseConfirmationData = {
  ...baseData,
  paymentMethod: "Cartão de Crédito",
  sellerName: "Tech Academy",
  supportEmail: "suporte@techacademy.com",
};

// ============================================================================
// TEST SUITE: getMembersAreaConfirmationTemplate (HTML)
// ============================================================================

Deno.test("HTML Members - returns valid HTML document", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML Members - has specific title for members area", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "<title>Acesso Liberado");
});

Deno.test("HTML Members - includes confirmation message", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "Sua compra foi confirmada!");
});

Deno.test("HTML Members - mentions members area access", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "área de membros");
});

Deno.test("HTML Members - includes graduation emoji", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "🎓");
});

Deno.test("HTML Members - has Acesse sua Área de Membros title", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "Acesse sua Área de Membros");
});

Deno.test("HTML Members - includes access button with deliveryUrl", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "Acessar Área de Membros");
  assertStringIncludes(html, baseData.deliveryUrl!);
});

Deno.test("HTML Members - includes login tip with info-box", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "info-box");
  assertStringIncludes(html, "💡");
});

Deno.test("HTML Members - mentions first access password", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "primeiro acesso");
  assertStringIncludes(html, "senha");
});

Deno.test("HTML Members - includes customer name", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "Pedro Aluno");
});

Deno.test("HTML Members - includes product name", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "Curso Completo de TypeScript");
});

Deno.test("HTML Members - includes truncated order ID", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "#MEMBER12");
});

Deno.test("HTML Members - includes formatted amount", () => {
  const html = getMembersAreaConfirmationTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "297,00");
});

Deno.test("HTML Members - includes payment method when provided", () => {
  const html = getMembersAreaConfirmationTemplate(fullData);
  assertStringIncludes(html, "Forma de Pagamento");
  assertStringIncludes(html, "Cartão de Crédito");
});

Deno.test("HTML Members - includes custom support email when provided", () => {
  const html = getMembersAreaConfirmationTemplate(fullData);
  assertStringIncludes(html, "suporte@techacademy.com");
});

Deno.test("HTML Members - includes seller name when provided", () => {
  const html = getMembersAreaConfirmationTemplate(fullData);
  assertStringIncludes(html, "Vendido por:");
  assertStringIncludes(html, "Tech Academy");
});

// ============================================================================
// TEST SUITE: getMembersAreaConfirmationTextTemplate (Text)
// ============================================================================

Deno.test("Text Members - includes confirmation header with access message", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "COMPRA CONFIRMADA ✓");
  assertStringIncludes(text, "ACESSO LIBERADO!");
});

Deno.test("Text Members - includes customer name", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Olá, Pedro Aluno!");
});

Deno.test("Text Members - includes members area section", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "🎓 ACESSE SUA ÁREA DE MEMBROS");
});

Deno.test("Text Members - includes delivery URL", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, baseData.deliveryUrl!);
});

Deno.test("Text Members - includes first access tip", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "💡");
  assertStringIncludes(text, "primeiro acesso");
});

Deno.test("Text Members - includes order details", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DO PEDIDO");
  assertStringIncludes(text, "Produto: Curso Completo de TypeScript");
  assertStringIncludes(text, "Nº do Pedido: #MEMBER12");
});

Deno.test("Text Members - includes Rise Checkout reference", () => {
  const text = getMembersAreaConfirmationTextTemplate(baseData);
  assertStringIncludes(text, "Rise Checkout");
});
