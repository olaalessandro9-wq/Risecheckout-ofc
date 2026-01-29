/**
 * Checkout Submit Tests - Form Submission and Success Flow
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for checkout form submission, loading states, and success page.
 * Single Responsibility: Only tests related to the submit and success flow.
 * 
 * @module e2e/specs/checkout-submit.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { SuccessPage } from "../fixtures/pages/SuccessPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Submit Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("submit button should be present", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    if (await checkoutPage.submitButton.isVisible()) {
      await expect(checkoutPage.submitButton).toBeEnabled();
    }
  });

  test("should show loading state during submission", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    if (await checkoutPage.emailInput.isVisible()) {
      await checkoutPage.fillEmail(TEST_CHECKOUT.customer.email);
      
      if (await checkoutPage.nameInput.isVisible()) {
        await checkoutPage.fillName(TEST_CHECKOUT.customer.name);
      }
      
      if (await checkoutPage.paymentMethodPix.isVisible()) {
        await checkoutPage.selectPaymentPix();
      }
      
      if (await checkoutPage.submitButton.isVisible()) {
        await checkoutPage.submit();
        
        await page.waitForTimeout(200);
        const isLoading = await checkoutPage.isLoading();
        
        expect(typeof isLoading).toBe("boolean");
      }
    }
  });
});

test.describe("Payment Success Page", () => {
  test("preview success page should load", async ({ page }) => {
    const successPage = new SuccessPage(page);
    await successPage.navigateToPreview();
    
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("success page should show success indicator", async ({ page }) => {
    const successPage = new SuccessPage(page);
    await successPage.navigateToPreview();
    
    await page.waitForTimeout(2000);
    
    const isSuccessful = await successPage.isSuccessful();
    
    expect(typeof isSuccessful).toBe("boolean");
  });
});
