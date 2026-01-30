/**
 * Email Templates Base Tests (Deno)
 *
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 *
 * Tests for base email template utilities covering:
 * - formatCurrency function
 * - getBaseStyles function
 * - getEmailWrapper function
 *
 * @module _shared/email-templates-base
 */

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  formatCurrency,
  getBaseStyles,
  getEmailWrapper,
} from "./email-templates-base.ts";

// ============================================================================
// TEST SUITE: formatCurrency
// ============================================================================

Deno.test("formatCurrency - formats zero cents correctly", () => {
  const result = formatCurrency(0);
  assertEquals(result, "R$ 0,00");
});

Deno.test("formatCurrency - formats positive cents correctly", () => {
  const result = formatCurrency(9990);
  assertEquals(result, "R$ 99,90");
});

Deno.test("formatCurrency - formats single digit cents correctly", () => {
  const result = formatCurrency(1);
  assertEquals(result, "R$ 0,01");
});

Deno.test("formatCurrency - formats whole reais correctly", () => {
  const result = formatCurrency(10000);
  assertEquals(result, "R$ 100,00");
});

Deno.test("formatCurrency - formats thousands with proper separator", () => {
  const result = formatCurrency(123456789);
  assertEquals(result, "R$ 1.234.567,89");
});

Deno.test("formatCurrency - formats millions correctly", () => {
  const result = formatCurrency(100000000);
  assertEquals(result, "R$ 1.000.000,00");
});

Deno.test("formatCurrency - handles small amounts", () => {
  const result = formatCurrency(50);
  assertEquals(result, "R$ 0,50");
});

Deno.test("formatCurrency - handles exact reais", () => {
  const result = formatCurrency(500);
  assertEquals(result, "R$ 5,00");
});

// ============================================================================
// TEST SUITE: getBaseStyles
// ============================================================================

Deno.test("getBaseStyles - returns string with style tag", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, "<style>");
  assertStringIncludes(styles, "</style>");
});

Deno.test("getBaseStyles - includes font import", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, "@import url");
  assertStringIncludes(styles, "Inter");
});

Deno.test("getBaseStyles - includes body styles", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, "body {");
  assertStringIncludes(styles, "font-family");
});

Deno.test("getBaseStyles - includes email-container styles", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, ".email-container");
  assertStringIncludes(styles, "max-width: 600px");
});

Deno.test("getBaseStyles - includes header styles", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, ".header {");
  assertStringIncludes(styles, "background:");
});

Deno.test("getBaseStyles - includes order-box styles", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, ".order-box {");
  assertStringIncludes(styles, "border-radius:");
});

Deno.test("getBaseStyles - includes cta-button styles", () => {
  const styles = getBaseStyles();
  assertStringIncludes(styles, ".cta-button {");
  assertStringIncludes(styles, "display: inline-block");
});

// ============================================================================
// TEST SUITE: getEmailWrapper
// ============================================================================

Deno.test("getEmailWrapper - returns valid HTML document", () => {
  const wrapper = getEmailWrapper("<p>Test content</p>");
  assertStringIncludes(wrapper, "<!DOCTYPE html>");
  assertStringIncludes(wrapper, '<html lang="pt-BR">');
  assertStringIncludes(wrapper, "</html>");
});

Deno.test("getEmailWrapper - includes head with meta tags", () => {
  const wrapper = getEmailWrapper("<p>Test</p>");
  assertStringIncludes(wrapper, "<head>");
  assertStringIncludes(wrapper, "</head>");
  assertStringIncludes(wrapper, 'charset="UTF-8"');
  assertStringIncludes(wrapper, "viewport");
});

Deno.test("getEmailWrapper - includes base styles", () => {
  const wrapper = getEmailWrapper("<p>Test</p>");
  assertStringIncludes(wrapper, "<style>");
  assertStringIncludes(wrapper, "font-family");
});

Deno.test("getEmailWrapper - wraps content in email-container", () => {
  const wrapper = getEmailWrapper("<p>Custom content</p>");
  assertStringIncludes(wrapper, 'class="email-container"');
  assertStringIncludes(wrapper, "<p>Custom content</p>");
});

Deno.test("getEmailWrapper - includes body tag", () => {
  const wrapper = getEmailWrapper("<p>Test</p>");
  assertStringIncludes(wrapper, "<body>");
  assertStringIncludes(wrapper, "</body>");
});

Deno.test("getEmailWrapper - preserves HTML content", () => {
  const content = '<div class="header"><h1>Title</h1></div>';
  const wrapper = getEmailWrapper(content);
  assertStringIncludes(wrapper, '<div class="header">');
  assertStringIncludes(wrapper, "<h1>Title</h1>");
});
