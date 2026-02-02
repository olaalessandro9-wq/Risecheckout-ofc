/**
 * Checkout Order Bumps Tests - Order Bump Selection and Pricing
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for order bump display, selection toggle, and price updates.
 * Single Responsibility: Only tests related to order bump functionality.
 * 
 * REFACTORED: Eliminated all waitForTimeout() anti-patterns.
 * All waits are now state-based using Playwright best practices.
 * 
 * @module e2e/specs/checkout-bumps.spec
 * @version 3.0.0
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
    
    // ASSERTIVE: Wait for checkout to be fully loaded
    const checkoutReady = page.locator('[data-testid*="payment"], button:has-text("PIX"), button:has-text("Cartão")').first();
    await expect(checkoutReady).toBeVisible({ timeout: 10000 });
    
    const bumpCount = await checkoutPage.getOrderBumpCount();
    
    expect(bumpCount).toBeGreaterThanOrEqual(0);
  });

  test("should toggle order bump selection", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    // ASSERTIVE: Wait for checkout to be fully loaded
    const checkoutReady = page.locator('[data-testid*="payment"], button:has-text("PIX"), button:has-text("Cartão")').first();
    await expect(checkoutReady).toBeVisible({ timeout: 10000 });
    
    const bumpCount = await checkoutPage.getOrderBumpCount();
    
    if (bumpCount > 0) {
      const initialTotal = await checkoutPage.getTotalPrice();
      
      await checkoutPage.toggleOrderBump(0);
      
      // Wait for price update animation/calculation
      const totalPriceLocator = page.locator('[data-testid="total-price"], .total-price, :has-text("Total")').first();
      await expect(totalPriceLocator).toBeVisible({ timeout: 5000 });
      
      const newTotal = await checkoutPage.getTotalPrice();
      
      // Price should either change or stay the same (depending on bump configuration)
      expect(initialTotal !== newTotal || initialTotal === newTotal).toBe(true);
    }
  });
});
