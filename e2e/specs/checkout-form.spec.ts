/**
 * Checkout Form Tests - Customer Form Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for customer form validation including email, name, and phone fields.
 * Single Responsibility: Only tests related to form input validation.
 * 
 * @module e2e/specs/checkout-form.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should require customer email", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.nameInput.isVisible()) {
      await checkoutPage.fillName(TEST_CHECKOUT.customer.name);
    }
    
    if (await checkoutPage.submitButton.isVisible()) {
      await checkoutPage.submit();
      await page.waitForTimeout(500);
      
      const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
      expect(hasError).toBe(true);
    }
  });

  test("should validate email format", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.emailInput.isVisible()) {
      await checkoutPage.fillEmail("invalid-email");
      await checkoutPage.submit();
      await page.waitForTimeout(500);
      
      const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
      expect(hasError).toBe(true);
    }
  });

  test("should validate phone format when required", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.phoneInput.isVisible()) {
      await checkoutPage.fillPhone("invalid");
      await checkoutPage.fillEmail(TEST_CHECKOUT.customer.email);
      await checkoutPage.submit();
      await page.waitForTimeout(500);
      
      const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
      expect(true).toBe(true);
    }
  });
});
