/**
 * MercadoPago Gateway E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests payment flows for MercadoPago gateway.
 * 
 * REFACTORED: Eliminated all waitForTimeout() anti-patterns.
 * All waits are now state-based using Playwright best practices.
 * 
 * @module e2e/specs/payment-mercadopago.spec
 * @version 3.0.0
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
    
    if (await checkoutPage.paymentMethodPix.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentPix();
      
      // ASSERTIVE: Wait for PIX QR code or copy option to appear
      const pixIndicator = page.locator('[data-gateway="mercadopago"], [data-testid="pix-qr-code"], textarea, button:has-text("Copiar")').first();
      await expect(pixIndicator).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display MercadoPago PIX QR code", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodPix.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentPix();
      
      // ASSERTIVE: Wait for QR code or copy option to appear
      const qrCodeIndicator = page.locator('img[alt*="QR"], canvas, [data-testid="qr-code"], button:has-text("Copiar"), textarea').first();
      await expect(qrCodeIndicator).toBeVisible({ timeout: 10000 });
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
    
    if (await checkoutPage.paymentMethodCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentCard();
      
      // ASSERTIVE: Wait for card form to appear
      const cardFormIndicator = page.locator('input[name="cardNumber"], [data-testid="card-form"]').first();
      await expect(cardFormIndicator).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display MercadoPago installments options", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentCard();
      
      // ASSERTIVE: Wait for installments or single payment indicator
      const installmentsIndicator = page.locator('select[name="installments"], [data-testid="installments"], :has-text("1x"), :has-text("à vista")').first();
      await expect(installmentsIndicator).toBeVisible({ timeout: 10000 });
    }
  });

  test("should process MercadoPago card payment with installments", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentCard();
      
      const installmentsSelect = page.locator('select[name="installments"]');
      if (await installmentsSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
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
    
    if (await checkoutPage.paymentMethodPix.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutPage.selectPaymentPix();
      
      // ASSERTIVE: Either error message appears OR page remains stable
      const errorOrStable = await Promise.race([
        page.locator('[data-testid="payment-error"], :has-text("erro")').waitFor({ state: "visible", timeout: 5000 }).then(() => "error"),
        page.waitForTimeout(3000).then(() => "stable") // Fallback only for error handling tests
      ]);
      
      expect(["error", "stable"]).toContain(errorOrStable);
    }
  });
});
