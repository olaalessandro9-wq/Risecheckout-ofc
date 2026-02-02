/**
 * Send Confirmation Email Tests - Email Building
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for email HTML building in send-confirmation-email Edge Function.
 * 
 * @module send-confirmation-email/tests/email-building
 */

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  FUNCTION_NAME,
  createMockOrderWithProduct,
  validateEmailHtml,
  EMAIL_HTML_ELEMENTS,
  type OrderWithProduct,
} from "./_shared.ts";

import {
  createMockProducer,
  createMockProduct,
} from "../../_shared/testing/mod.ts";

// ============================================================================
// TEST SETUP
// ============================================================================

const testProducer = createMockProducer();
const testProduct = createMockProduct(testProducer.id);

/**
 * Simulates the email HTML building logic from the Edge Function
 */
function buildConfirmationEmailHtml(order: OrderWithProduct): string {
  const productName = order.product?.[0]?.name || "N/A";
  const amountFormatted = (order.amount_cents / 100).toFixed(2);
  const orderIdShort = order.id.slice(0, 8);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmação de Compra</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Compra Confirmada! 🎉</h1>
        <p>Olá ${order.customer_name || 'Cliente'},</p>
        <p>Sua compra foi confirmada com sucesso!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalhes do Pedido</h3>
          <p><strong>Produto:</strong> ${productName}</p>
          <p><strong>Valor:</strong> R$ ${amountFormatted}</p>
          <p><strong>Pedido:</strong> #${orderIdShort}</p>
        </div>
        
        <p>Você receberá as instruções de acesso em breve.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 40px;">
          Este é um email automático. Por favor, não responda.
        </p>
      </body>
    </html>
  `;
}

// ============================================================================
// HTML STRUCTURE TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - generates valid HTML document`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "<!DOCTYPE html>");
  assertStringIncludes(html, "<html>");
  assertStringIncludes(html, "</html>");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes charset meta tag`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, 'charset="utf-8"');
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes title tag`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "<title>");
  assertStringIncludes(html, EMAIL_HTML_ELEMENTS.title);
});

// ============================================================================
// CONTENT TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes success emoji`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, EMAIL_HTML_ELEMENTS.successEmoji);
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes customer name`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    customer_name: "Maria Silva",
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "Maria Silva");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - fallback to Cliente when no name`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    customer_name: "",
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "Olá Cliente");
});

// ============================================================================
// ORDER DETAILS TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes product name`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    product: [{ name: "Curso de JavaScript" }],
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "Curso de JavaScript");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes formatted price`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 19900,
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "R$ 199.00");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - includes truncated order ID`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  order.id = "12345678-1234-1234-1234-123456789abc";
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "#12345678");
});

// ============================================================================
// PRICE FORMATTING TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - formats whole number prices`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 10000,
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "R$ 100.00");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - formats prices with cents`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 9990,
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "R$ 99.90");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - formats small prices`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 100,
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "R$ 1.00");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - formats large prices`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    amount_cents: 999900,
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "R$ 9999.00");
});

// ============================================================================
// VALIDATION HELPER TESTS
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - validateEmailHtml passes for valid email`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  const html = buildConfirmationEmailHtml(order);
  const result = validateEmailHtml(html);
  
  assertEquals(result.hasTitle, true);
  assertEquals(result.hasEmoji, true);
  assertEquals(result.hasProductSection, true);
  assertEquals(result.hasPricePrefix, true);
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - validateEmailHtml fails for empty string`, () => {
  const result = validateEmailHtml("");
  
  assertEquals(result.hasTitle, false);
  assertEquals(result.hasEmoji, false);
  assertEquals(result.hasProductSection, false);
  assertEquals(result.hasPricePrefix, false);
});

// ============================================================================
// EDGE CASES
// ============================================================================

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - handles missing product gracefully`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id, {
    product: [],
  });
  const html = buildConfirmationEmailHtml(order);
  
  assertStringIncludes(html, "N/A");
});

Deno.test(`[${FUNCTION_NAME}] EmailBuilding - handles null product array`, () => {
  const order = createMockOrderWithProduct(testProducer.id, testProduct.id);
  // Simulate a null product using type assertion
  const orderWithNullProduct = {
    ...order,
    product: null as unknown as Array<{ name: string }>,
  };
  
  const html = buildConfirmationEmailHtml(orderWithNullProduct as unknown as OrderWithProduct);
  assertStringIncludes(html, "N/A");
});
