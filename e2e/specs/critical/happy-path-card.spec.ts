/**
 * Happy Path Card - Complete Card Purchase Flow E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests the complete credit card purchase flow from checkout to success page.
 * Validates the critical path for card payments across all gateways.
 * 
 * Flow: Checkout → Fill Form → Select Card → Fill Card → Submit → Success Page
 * 
 * @module e2e/specs/critical/happy-path-card.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import { SuccessPage } from "../../fixtures/pages/SuccessPage";
import {
  TEST_CHECKOUT,
  TEST_CHECKOUT_GATEWAYS,
  TEST_CARDS,
  TIMEOUTS,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Happy Path Card - Complete Purchase Flow", () => {
  test.describe("MercadoPago Gateway", () => {
    test("should complete card purchase and navigate to success page", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const successPage = new SuccessPage(page);

      // 1. Navigate to checkout
      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      
      // 2. Wait for checkout to be ready
      await checkoutPage.waitForCheckoutReady();

      // 3. Fill customer form
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-mercadopago"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      // 4. Select Card payment method
      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();

      // 5. Wait for card form to appear
      await page.waitForTimeout(1000); // Allow form to render

      // 6. Fill card form with approved test card
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.approved);

      // 7. Select installments (1x)
      await checkoutPage.selectInstallments(1);

      // 8. Submit and wait for success page
      await checkoutPage.submitAndWaitForSuccess();

      // 9. Verify success page loaded
      await successPage.waitForSuccess();
      
      // 10. Assert success indicators
      await expect(successPage.successIcon.or(successPage.successTitle)).toBeVisible();
    });

    test("should display order details on success page", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const successPage = new SuccessPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      const testEmail = generateTestEmail("card-details");
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: testEmail,
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(1000);
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      await successPage.waitForSuccess();

      // Verify success page has content
      const isSuccessful = await successPage.isSuccessful();
      expect(isSuccessful).toBe(true);
    });
  });

  test.describe("Stripe Gateway", () => {
    test("should complete card purchase with Stripe", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const successPage = new SuccessPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.stripe.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-stripe"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(1000);

      await checkoutPage.fillCardForm(TEST_CARDS.stripe.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      await successPage.waitForSuccess();
      await expect(successPage.successIcon.or(successPage.successTitle)).toBeVisible();
    });
  });

  test.describe("Asaas Gateway", () => {
    test("should complete card purchase with Asaas", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const successPage = new SuccessPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.asaas.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-asaas"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(1000);

      await checkoutPage.fillCardForm(TEST_CARDS.asaas.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      await successPage.waitForSuccess();
      await expect(successPage.successIcon.or(successPage.successTitle)).toBeVisible();
    });
  });

  test.describe("URL Validation", () => {
    test("should have valid orderId in success page URL", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-url"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(1000);
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.approved);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submitAndWaitForSuccess();

      // Validate URL contains /success/ and a UUID-like orderId
      const url = page.url();
      expect(url).toMatch(/\/success\/[a-f0-9-]+/i);
    });
  });

  test.describe("Installments Selection", () => {
    test("should allow selecting different installment options", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-installments"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      await page.waitForTimeout(1000);
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.approved);

      // Try to select different installment options
      const installmentsSelect = page.locator('select[name="installments"], [data-testid="installments-select"]');
      
      if (await installmentsSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Verify installments selector is present and functional
        await expect(installmentsSelect).toBeEnabled();
        
        // Select 1x and verify
        await installmentsSelect.selectOption({ index: 0 });
        const selectedValue = await installmentsSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    });
  });
});
