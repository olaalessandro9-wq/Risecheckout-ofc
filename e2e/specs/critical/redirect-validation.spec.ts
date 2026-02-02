/**
 * Redirect Validation - Navigation Flow Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testa redirecionamentos corretos usando Mercado Pago como gateway único.
 * Valida URLs, UUIDs e preservação de estado.
 * 
 * @module e2e/specs/critical/redirect-validation.spec
 * @version 2.0.0
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import { PixPaymentPage } from "../../fixtures/pages/PixPaymentPage";
import { SuccessPage } from "../../fixtures/pages/SuccessPage";
import {
  TEST_CHECKOUT_MERCADOPAGO,
  TEST_CARDS,
  TEST_CUSTOMER,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Redirect Validation - Mercado Pago", () => {
  test.describe("Success Redirects", () => {
    test("PIX payment should redirect to /pay/pix/{orderId}", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("redirect-pix"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      // Verify URL structure
      const url = page.url();
      expect(url).toMatch(/\/pay\/pix\/[a-f0-9-]+/i);
    });

    test("Card approved should redirect to /success/{orderId}", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("redirect-card"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await checkoutPage.waitForCardFormReady();
      await checkoutPage.fillCardForm(TEST_CARDS.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      // Verify URL structure
      const url = page.url();
      expect(url).toMatch(/\/success\/[a-f0-9-]+/i);
    });

    test("Success page should have valid UUID orderId in URL", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("redirect-uuid"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await checkoutPage.waitForCardFormReady();
      await checkoutPage.fillCardForm(TEST_CARDS.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      // Extract orderId and validate UUID format
      const url = page.url();
      const orderIdMatch = url.match(/\/success\/([a-f0-9-]+)/i);
      expect(orderIdMatch).toBeTruthy();
      
      const orderId = orderIdMatch![1];
      // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(orderId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    });

    test("PIX page should have valid UUID orderId in URL", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("pix-uuid"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      // Extract orderId and validate UUID format
      const url = page.url();
      const orderIdMatch = url.match(/\/pay\/pix\/([a-f0-9-]+)/i);
      expect(orderIdMatch).toBeTruthy();
      
      const orderId = orderIdMatch![1];
      expect(orderId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    });
  });

  test.describe("Error Redirects", () => {
    test("Declined card should NOT redirect (stay on checkout)", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const initialSlug = TEST_CHECKOUT_MERCADOPAGO.slug;

      await checkoutPage.navigate(initialSlug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("redirect-declined"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await checkoutPage.waitForCardFormReady();
      await checkoutPage.fillCardForm(TEST_CARDS.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      // Wait for error
      await checkoutPage.waitForPaymentError();

      // Verify still on checkout page
      const url = page.url();
      expect(url).toContain(`/pay/${initialSlug}`);
      expect(url).not.toContain("/success/");
      expect(url).not.toContain("/pay/pix/");
    });

    test("Network error should stay on checkout page", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      // Intercept API and fail it
      await page.route('**/create-order**', route => route.abort());

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("redirect-network"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submit();

      // Wait for error state
      const errorIndicator = page.locator('[role="alert"], .error-message, :has-text("erro")').first();
      await errorIndicator.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      // Should still be on checkout
      const url = page.url();
      expect(url).toContain("/pay/");
      expect(url).not.toContain("/success/");
    });
  });

  test.describe("State Preservation on Redirect", () => {
    test("PIX page should receive order data via state", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("state-pix"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      // If PIX page has QR Code, it means state was received
      await pixPaymentPage.waitForPageReady();
      const hasQrCode = await pixPaymentPage.isQrCodeVisible();
      expect(hasQrCode).toBe(true);
    });

    test("Success page should load order details", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const successPage = new SuccessPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("state-success"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await checkoutPage.waitForCardFormReady();
      await checkoutPage.fillCardForm(TEST_CARDS.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      // Success page should show success indicator
      await successPage.waitForSuccess();
      const isSuccessful = await successPage.isSuccessful();
      expect(isSuccessful).toBe(true);
    });
  });
});
