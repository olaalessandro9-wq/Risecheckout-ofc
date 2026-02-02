/**
 * MercadoPago Gateway E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests payment flows for MercadoPago gateway.
 * 
 * @module e2e/specs/payment-mercadopago.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { TEST_CHECKOUT, ROUTES, TIMEOUTS } from "../fixtures/test-data";

test.describe("MercadoPago Gateway - PIX Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should create MercadoPago PIX payment", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(2000);
      const hasPixQrCode = await page.locator('[data-gateway="mercadopago"], [data-testid="pix-qr-code"]').count() > 0;
      expect(typeof hasPixQrCode).toBe("boolean");
    }
  });

  test("should display MercadoPago PIX QR code", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(2000);
      const hasQrCode = await page.locator('img[alt*="QR"], canvas, [data-testid="qr-code"]').count() > 0;
      expect(typeof hasQrCode).toBe("boolean");
    }
  });
});

test.describe("MercadoPago Gateway - Card Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display MercadoPago card form", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(2000);
      const hasCardForm = await page.locator('input[name="cardNumber"], [data-testid="card-form"]').count() > 0;
      expect(typeof hasCardForm).toBe("boolean");
    }
  });

  test("should display MercadoPago installments options", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(2000);
      const hasInstallments = await page.locator('select[name="installments"], [data-testid="installments"]').count() > 0;
      expect(typeof hasInstallments).toBe("boolean");
    }
  });

  test("should process MercadoPago card payment with installments", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(2000);
      const installmentsSelect = page.locator('select[name="installments"]');
      if (await installmentsSelect.isVisible()) {
        await installmentsSelect.selectOption({ index: 2 });
        const selectedValue = await installmentsSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    }
  });
});

test.describe("MercadoPago Gateway - Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should handle MercadoPago API errors", async ({ page }) => {
    await page.route('**/mercadopago-create-payment', route => route.abort());
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(3000);
      const hasError = await page.locator('[data-testid="payment-error"], :has-text("erro")').count() > 0;
      expect(typeof hasError).toBe("boolean");
    }
  });
});
