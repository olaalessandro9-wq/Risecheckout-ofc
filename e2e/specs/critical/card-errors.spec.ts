/**
 * Card Errors - Declined Card and Retry Flow
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testa o fluxo de cartão recusado e retry usando Mercado Pago.
 * Valida feedback de erro e capacidade de tentar novamente.
 * 
 * Flow: Checkout → Declined Card → Error → Retry → Success
 * 
 * @module e2e/specs/critical/card-errors.spec
 * @version 2.0.0
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import {
  TEST_CHECKOUT_MERCADOPAGO,
  TEST_CARDS,
  TEST_CUSTOMER,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Card Errors - Mercado Pago", () => {
  test("should show error message for declined card", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    // 1. Navigate to checkout
    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    // 2. Fill customer form
    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-declined"),
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    // 3. Select Card payment method
    await expect(checkoutPage.paymentMethodCard).toBeVisible();
    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();

    // 4. Fill card form with DECLINED test card
    await checkoutPage.fillCardForm(TEST_CARDS.declined);
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

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    // Fill form
    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-retry"),
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();

    // First attempt with declined card
    await checkoutPage.fillCardForm(TEST_CARDS.declined);
    await checkoutPage.selectInstallments(1);
    await checkoutPage.submit();

    // Wait for error
    await checkoutPage.waitForPaymentError();

    // Verify submit button is still available for retry
    await expect(checkoutPage.submitButton).toBeVisible();
    await expect(checkoutPage.submitButton).toBeEnabled();

    // Fill with approved card
    await checkoutPage.fillCardForm(TEST_CARDS.approved);
    
    // Submit again should work
    await checkoutPage.submitAndWaitForSuccess();

    // Now should be on success page
    const url = page.url();
    expect(url).toContain("/success/");
  });

  test("should preserve form data after decline", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const testEmail = generateTestEmail("card-preserve");

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    // Fill form
    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: testEmail,
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();

    // Submit with declined card
    await checkoutPage.fillCardForm(TEST_CARDS.declined);
    await checkoutPage.selectInstallments(1);
    await checkoutPage.submit();

    // Wait for error
    await checkoutPage.waitForPaymentError();

    // Verify email field still has the value
    const emailValue = await checkoutPage.emailInput.inputValue();
    expect(emailValue).toBe(testEmail);
  });

  test("should not show loading spinner indefinitely after decline", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-spinner"),
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

    // Loading spinner should not be visible anymore
    const isLoading = await checkoutPage.isLoading();
    expect(isLoading).toBe(false);
  });

  test("should keep submit button enabled after decline for retry", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-button"),
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

    // Submit button should be enabled for retry
    await expect(checkoutPage.submitButton).toBeEnabled();
  });
});
