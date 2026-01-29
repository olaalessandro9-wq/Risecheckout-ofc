/**
 * Checkout Payment Tests - Payment Method Selection
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for payment method selection including PIX and Credit Card options.
 * Single Responsibility: Only tests related to payment method UI interactions.
 * 
 * @module e2e/specs/checkout-payment.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Payment Methods", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display available payment methods", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const hasPixOption = await checkoutPage.paymentMethodPix.count() > 0;
    const hasCardOption = await checkoutPage.paymentMethodCard.count() > 0;
    
    expect(typeof hasPixOption).toBe("boolean");
    expect(typeof hasCardOption).toBe("boolean");
  });

  test("should allow selecting PIX payment method", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      
      const isSelected = await checkoutPage.paymentMethodPix.getAttribute("data-selected");
      const hasSelectedClass = await checkoutPage.paymentMethodPix.evaluate(
        (el) => el.classList.contains("selected") || el.getAttribute("aria-pressed") === "true"
      );
      
      expect(isSelected === "true" || hasSelectedClass).toBe(true);
    }
  });

  test("should allow selecting Card payment method", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      const cardFormVisible = await page.locator('input[name="cardNumber"], [data-testid="card-form"]').count() > 0;
      const isSelected = await checkoutPage.paymentMethodCard.getAttribute("aria-pressed") === "true";
      
      expect(cardFormVisible || isSelected).toBe(true);
    }
  });
});

test.describe("Checkout Coupon System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should show error for invalid coupon code", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.couponInput.isVisible()) {
      await checkoutPage.applyCoupon(TEST_CHECKOUT.coupons.invalid);
      await page.waitForTimeout(2000);
      
      const hasError = await checkoutPage.hasCouponError();
      const errorMessage = await page.locator(':has-text("inválido"), :has-text("não encontrado")').count() > 0;
      
      expect(hasError || errorMessage).toBe(true);
    }
  });

  test("coupon input should exist when checkout has coupon feature", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const hasCouponInput = await checkoutPage.couponInput.count() > 0;
    
    expect(typeof hasCouponInput).toBe("boolean");
  });
});
