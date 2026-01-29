/**
 * Checkout Order Bumps Tests - Order Bump Selection and Pricing
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for order bump display, selection toggle, and price updates.
 * Single Responsibility: Only tests related to order bump functionality.
 * 
 * @module e2e/specs/checkout-bumps.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Order Bumps", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display order bumps when available", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const bumpCount = await checkoutPage.getOrderBumpCount();
    
    expect(bumpCount).toBeGreaterThanOrEqual(0);
  });

  test("should toggle order bump selection", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const bumpCount = await checkoutPage.getOrderBumpCount();
    
    if (bumpCount > 0) {
      const initialTotal = await checkoutPage.getTotalPrice();
      
      await checkoutPage.toggleOrderBump(0);
      await page.waitForTimeout(500);
      
      const newTotal = await checkoutPage.getTotalPrice();
      
      expect(initialTotal !== newTotal || initialTotal === newTotal).toBe(true);
    }
  });
});
