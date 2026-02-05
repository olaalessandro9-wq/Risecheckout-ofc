/**
 * Email Templates Payment Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for payment pending email templates (refactored to inline <style>).
 *
 * @module _shared/email-templates-payment
 */

import {
  assertStringIncludes,
  assertNotMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getPaymentPendingTemplate,
  getPaymentPendingTextTemplate,
} from "./email-templates-payment.ts";
import type { PaymentPendingData } from "./email-templates-base.ts";

// ============================================================================
// TEST DATA
// ============================================================================

const baseData: PaymentPendingData = {
  customerName: "Maria Santos",
  productName: "Mentoria Premium",
  amountCents: 49900,
  orderId: "pix12345-6789-0abc-defg-hijklmnopqrs",
};

const dataWithPixQr: PaymentPendingData = {
  ...baseData,
  pixQrCode: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk",
};

// ============================================================================
// TEST SUITE: getPaymentPendingTemplate (HTML)
// ============================================================================

Deno.test("HTML Payment - returns valid HTML document", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "</html>");
});

Deno.test("HTML Payment - uses inline style block (Gmail compatible)", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "<style>");
  assertStringIncludes(html, ".container");
  assertStringIncludes(html, ".pending-banner");
});

Deno.test("HTML Payment - has pending status indicator", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "⏳");
  assertStringIncludes(html, "Aguardando Pagamento");
});

Deno.test("HTML Payment - has success message", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "Pedido Criado com Sucesso!");
});

Deno.test("HTML Payment - includes customer name", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "Maria Santos");
});

Deno.test("HTML Payment - includes product name", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "Mentoria Premium");
});

Deno.test("HTML Payment - includes truncated order ID", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "#PIX12345");
});

Deno.test("HTML Payment - includes formatted amount", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "R$");
  assertStringIncludes(html, "499,00");
});

Deno.test("HTML Payment - labels amount as Valor a Pagar", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "Valor a Pagar");
});

Deno.test("HTML Payment - includes QR Code when pixQrCode provided", () => {
  const html = getPaymentPendingTemplate(dataWithPixQr);
  assertStringIncludes(html, "Escaneie o QR Code");
  assertStringIncludes(html, "<img");
  assertStringIncludes(html, 'src="data:image/png;base64,');
});

Deno.test("HTML Payment - excludes QR Code when pixQrCode not provided", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertNotMatch(html, /Escaneie o QR Code/);
});

Deno.test("HTML Payment - includes expiration warning with styling", () => {
  const html = getPaymentPendingTemplate(baseData);
  assertStringIncludes(html, "⚠️");
  assertStringIncludes(html, "expira");
  assertStringIncludes(html, "warning-message");
});

// ============================================================================
// TEST SUITE: getPaymentPendingTextTemplate (Text)
// ============================================================================

Deno.test("Text Payment - includes pending header", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "⏳ AGUARDANDO PAGAMENTO");
});

Deno.test("Text Payment - includes customer name", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "Olá, Maria Santos!");
});

Deno.test("Text Payment - includes order details section", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "DETALHES DO PEDIDO");
});

Deno.test("Text Payment - includes product name", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "Produto: Mentoria Premium");
});

Deno.test("Text Payment - includes order ID", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "Nº do Pedido: #PIX12345");
});

Deno.test("Text Payment - includes expiration warning", () => {
  const text = getPaymentPendingTextTemplate(baseData);
  assertStringIncludes(text, "⚠️");
  assertStringIncludes(text, "expira");
});
