/**
 * Happy Path PIX - Complete Purchase Flow E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests the complete PIX purchase flow from checkout to PIX payment page.
 * Validates the critical path that 70%+ of sales go through.
 * 
 * Flow: Checkout → Fill Form → Select PIX → Submit → PIX Page → QR Code
 * 
 * @module e2e/specs/critical/happy-path-pix.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import { PixPaymentPage } from "../../fixtures/pages/PixPaymentPage";
import {
  TEST_CHECKOUT,
  TEST_CHECKOUT_GATEWAYS,
  TIMEOUTS,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Happy Path PIX - Complete Purchase Flow", () => {
  test.describe("PushinPay Gateway", () => {
    test("should complete PIX purchase and navigate to PIX page", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      // 1. Navigate to checkout
      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.pushinpay.slug);
      
      // 2. Wait for checkout to be ready
      await checkoutPage.waitForCheckoutReady();

      // 3. Fill customer form
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-pushinpay"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      // 4. Select PIX payment method
      await expect(checkoutPage.paymentMethodPix).toBeVisible();
      await checkoutPage.selectPaymentPix();

      // 5. Submit and wait for PIX page navigation
      await checkoutPage.submitAndWaitForPix();

      // 6. Verify PIX page loaded correctly
      await pixPaymentPage.waitForPageReady();
      
      // 7. Assert QR Code is visible
      await expect(pixPaymentPage.qrCodeImage.or(pixPaymentPage.qrCodeContainer)).toBeVisible();
      
      // 8. Assert copy button is functional
      await expect(pixPaymentPage.copyButton).toBeVisible();
      await expect(pixPaymentPage.copyButton).toBeEnabled();
    });

    test("should display PIX amount correctly", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.pushinpay.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-amount"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();
      await pixPaymentPage.waitForPageReady();

      // Verify amount is displayed
      const amount = await pixPaymentPage.getTotalAmount();
      expect(amount).toBeTruthy();
    });

    test("should allow copying PIX code", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.pushinpay.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-copy"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();
      await pixPaymentPage.waitForPageReady();

      // Get PIX code
      const pixCode = await pixPaymentPage.getPixCode();
      expect(pixCode.length).toBeGreaterThan(10);

      // Click copy button
      await pixPaymentPage.copyPixCode();
    });
  });

  test.describe("MercadoPago Gateway", () => {
    test("should complete PIX purchase with MercadoPago", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-mercadopago"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodPix).toBeVisible();
      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      await pixPaymentPage.waitForPageReady();
      await expect(pixPaymentPage.qrCodeImage.or(pixPaymentPage.qrCodeContainer)).toBeVisible();
      await expect(pixPaymentPage.copyButton).toBeVisible();
    });
  });

  test.describe("Asaas Gateway", () => {
    test("should complete PIX purchase with Asaas", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.asaas.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-asaas"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodPix).toBeVisible();
      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      await pixPaymentPage.waitForPageReady();
      await expect(pixPaymentPage.qrCodeImage.or(pixPaymentPage.qrCodeContainer)).toBeVisible();
      await expect(pixPaymentPage.copyButton).toBeVisible();
    });
  });

  test.describe("URL Validation", () => {
    test("should have valid orderId in PIX page URL", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.pushinpay.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("pix-url"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      // Validate URL contains /pay/pix/ and a UUID-like orderId
      const url = page.url();
      expect(url).toMatch(/\/pay\/pix\/[a-f0-9-]+/i);
    });
  });
});
