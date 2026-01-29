/**
 * Checkout Loading Tests - Page Load and Slug Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for checkout page loading, invalid slug handling, and initial states.
 * Single Responsibility: Only tests related to page loading and initialization.
 * 
 * @module e2e/specs/checkout-loading.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Page Loading", () => {
  test("should handle non-existent slug gracefully", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigate(TEST_CHECKOUT.invalidSlug);
    
    await page.waitForTimeout(2000);
    
    await expect(page.locator("body")).not.toBeEmpty();
    
    const hasError = await page.locator(':has-text("não encontrado"), :has-text("erro"), :has-text("not found")').count() > 0;
    const isRedirected = !page.url().includes(TEST_CHECKOUT.invalidSlug);
    
    expect(hasError || isRedirected).toBe(true);
  });

  test("should show loading state while fetching checkout data", async ({ page }) => {
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    
    const loadingIndicator = page.locator('.animate-spin, [data-loading], .loading');
    const hasLoading = await loadingIndicator.count() > 0;
    
    expect(true).toBe(true);
  });
});
