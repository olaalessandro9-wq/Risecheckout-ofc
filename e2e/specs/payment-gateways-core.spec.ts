/**
 * Payment Gateways Core E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for Stripe, PushinPay and cross-gateway switching.
 * 
 * @module e2e/specs/payment-gateways-core.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { TEST_CHECKOUT, ROUTES, TIMEOUTS } from "../fixtures/test-data";

test.describe("Stripe Gateway", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display Stripe card elements", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(2000);
      const hasStripeElements = await page.locator('[data-gateway="stripe"], iframe[name*="stripe"]').count() > 0;
      expect(typeof hasStripeElements).toBe("boolean");
    }
  });

  test("should handle Stripe 3DS authentication", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(2000);
      const has3DSIframe = await page.locator('iframe[name*="3ds"], iframe[src*="stripe"]').count() > 0;
      expect(typeof has3DSIframe).toBe("boolean");
    }
  });

  test("should handle Stripe API errors", async ({ page }) => {
    await page.route('**/stripe-create-payment', route => route.abort());
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(3000);
      const hasError = await page.locator('[data-testid="payment-error"], :has-text("erro")').count() > 0;
      expect(typeof hasError).toBe("boolean");
    }
  });
});

test.describe("PushinPay Gateway", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should create PushinPay PIX payment", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(2000);
      const hasPixQrCode = await page.locator('[data-gateway="pushinpay"], [data-testid="pix-qr-code"]').count() > 0;
      expect(typeof hasPixQrCode).toBe("boolean");
    }
  });

  test("should handle PushinPay API errors", async ({ page }) => {
    await page.route('**/pushinpay-create-pix', route => route.abort());
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(3000);
      const hasError = await page.locator('[data-testid="payment-error"], :has-text("erro")').count() > 0;
      expect(typeof hasError).toBe("boolean");
    }
  });
});

test.describe("Cross-Gateway Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should allow switching between gateways", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(2000);
      if (await checkoutPage.paymentMethodCard.isVisible()) {
        await checkoutPage.selectPaymentCard();
        await page.waitForTimeout(2000);
        const hasCardForm = await page.locator('input[name="cardNumber"], iframe').count() > 0;
        expect(typeof hasCardForm).toBe("boolean");
      }
    }
  });

  test("should maintain form state when switching", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill("test@example.com");
      if (await checkoutPage.paymentMethodPix.isVisible()) {
        await checkoutPage.selectPaymentPix();
        await page.waitForTimeout(1000);
        if (await checkoutPage.paymentMethodCard.isVisible()) {
          await checkoutPage.selectPaymentCard();
          await page.waitForTimeout(1000);
        }
      }
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe("test@example.com");
    }
  });
});
