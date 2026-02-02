/**
 * Card Declined - Error Handling E2E Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests the card decline flow and error handling.
 * Validates that users receive proper feedback and can retry.
 * 
 * Flow: Checkout → Fill Form → Declined Card → Error Message → Stay on Page
 * 
 * REFACTORED: Eliminated all waitForTimeout() anti-patterns.
 * All waits are now state-based using Playwright best practices.
 * 
 * @module e2e/specs/critical/card-declined.spec
 * @version 2.0.0
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import {
  TEST_CHECKOUT,
  TEST_CHECKOUT_GATEWAYS,
  TEST_CARDS,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Card Declined - Error Handling", () => {
  test.describe("MercadoPago Gateway", () => {
    test("should show error message for declined card", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      // 1. Navigate to checkout
      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      // 2. Fill customer form
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-declined"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      // 3. Select Card payment method
      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      // 4. Fill card form with DECLINED test card
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.declined);
      await checkoutPage.selectInstallments(1);

      // 5. Submit payment
      await checkoutPage.submit();

      // 6. Wait for error message to appear
      await checkoutPage.waitForPaymentError();

      // 7. Verify still on checkout page (not redirected to success)
      const url = page.url();
      expect(url).not.toContain("/success/");
      expect(url).toContain("/pay/");

      // 8. Verify error message is visible
      const hasError = await checkoutPage.hasPaymentError();
      expect(hasError).toBe(true);
    });

    test("should allow retry after declined payment", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      // Fill form
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-retry"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      // First attempt with declined card
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      // Wait for error
      await checkoutPage.waitForPaymentError();

      // Verify submit button is still available for retry
      await expect(checkoutPage.submitButton).toBeVisible();
      await expect(checkoutPage.submitButton).toBeEnabled();

      // Fill with approved card
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.approved);
      
      // Submit again should work
      await checkoutPage.submitAndWaitForSuccess();

      // Now should be on success page
      const url = page.url();
      expect(url).toContain("/success/");
    });

    test("should preserve form data after decline", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const testEmail = generateTestEmail("card-preserve");

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      // Fill form
      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: testEmail,
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      // Submit with declined card
      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      // Wait for error
      await checkoutPage.waitForPaymentError();

      // Verify email field still has the value
      const emailValue = await checkoutPage.emailInput.inputValue();
      expect(emailValue).toBe(testEmail);
    });
  });

  test.describe("Stripe Gateway", () => {
    test("should show error message for declined Stripe card", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.stripe.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("stripe-declined"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      await checkoutPage.fillCardForm(TEST_CARDS.stripe.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      await checkoutPage.waitForPaymentError();

      const url = page.url();
      expect(url).not.toContain("/success/");
    });
  });

  test.describe("Asaas Gateway", () => {
    test("should show error message for declined Asaas card", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.asaas.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("asaas-declined"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await expect(checkoutPage.paymentMethodCard).toBeVisible();
      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      await checkoutPage.fillCardForm(TEST_CARDS.asaas.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      await checkoutPage.waitForPaymentError();

      const url = page.url();
      expect(url).not.toContain("/success/");
    });
  });

  test.describe("User Experience", () => {
    test("should not show loading spinner indefinitely after decline", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-spinner"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      // ASSERTIVE: Wait for error OR loading to finish
      await checkoutPage.waitForPaymentError();

      // Loading spinner should not be visible anymore
      const isLoading = await checkoutPage.isLoading();
      expect(isLoading).toBe(false);
    });

    test("should keep submit button enabled after decline for retry", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_GATEWAYS.mercadopago.slug);
      await checkoutPage.waitForCheckoutReady();

      await checkoutPage.fillCustomerForm({
        name: TEST_CHECKOUT.customer.name,
        email: generateTestEmail("card-button"),
        phone: TEST_CHECKOUT.customer.phone,
        cpf: TEST_CHECKOUT.customer.cpf,
      });

      await checkoutPage.selectPaymentCard();
      // ASSERTIVE: Wait for card form visibility
      await checkoutPage.waitForCardFormReady();

      await checkoutPage.fillCardForm(TEST_CARDS.mercadopago.declined);
      await checkoutPage.selectInstallments(1);
      await checkoutPage.submit();

      // Wait for error
      await checkoutPage.waitForPaymentError();

      // Submit button should be enabled for retry
      await expect(checkoutPage.submitButton).toBeEnabled();
    });
  });
});
