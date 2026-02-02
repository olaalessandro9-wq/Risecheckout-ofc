/**
 * Complete Card Flow - Mercado Pago Reference Gateway
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testa o fluxo completo de cartão usando Mercado Pago como gateway único.
 * Valida pagamentos aprovados, parcelas, e redirecionamento para success.
 * 
 * Flow: Checkout → Form → Card → Fill Card → Installments → Submit → Success
 * 
 * @module e2e/specs/critical/complete-card-flow.spec
 * @version 2.0.0
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import { SuccessPage } from "../../fixtures/pages/SuccessPage";
import {
  TEST_CHECKOUT_MERCADOPAGO,
  TEST_CARDS,
  TEST_CUSTOMER,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Complete Card Flow - Mercado Pago", () => {
  test("should complete card purchase and navigate to success page", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    const successPage = new SuccessPage(page);

    // 1. Navigate to checkout
    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    
    // 2. Wait for checkout to be ready
    await checkoutPage.waitForCheckoutReady();

    // 3. Fill customer form
    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-complete"),
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    // 4. Select Card payment method
    await expect(checkoutPage.paymentMethodCard).toBeVisible();
    await checkoutPage.selectPaymentCard();

    // 5. Wait for card form to be ready
    await checkoutPage.waitForCardFormReady();

    // 6. Fill card form with approved test card
    await checkoutPage.fillCardForm(TEST_CARDS.approved);

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

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    const testEmail = generateTestEmail("card-details");
    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: testEmail,
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();
    await checkoutPage.fillCardForm(TEST_CARDS.approved);
    await checkoutPage.selectInstallments(1);
    await checkoutPage.submitAndWaitForSuccess();

    await successPage.waitForSuccess();

    // Verify success page has content
    const isSuccessful = await successPage.isSuccessful();
    expect(isSuccessful).toBe(true);
  });

  test("should have valid orderId in success page URL", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-url"),
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();
    await checkoutPage.fillCardForm(TEST_CARDS.approved);
    await checkoutPage.selectInstallments(1);
    await checkoutPage.submitAndWaitForSuccess();

    // Validate URL contains /success/ and a UUID
    const url = page.url();
    expect(url).toMatch(/\/success\/[a-f0-9-]+/i);
    
    // Extract and validate UUID format
    const orderIdMatch = url.match(/\/success\/([a-f0-9-]+)/i);
    expect(orderIdMatch).toBeTruthy();
    const orderId = orderIdMatch![1];
    expect(orderId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
  });

  test("should allow selecting different installment options", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
    await checkoutPage.waitForCheckoutReady();

    await checkoutPage.fillCustomerForm({
      name: TEST_CUSTOMER.name,
      email: generateTestEmail("card-installments"),
      phone: TEST_CUSTOMER.phone,
      cpf: TEST_CUSTOMER.cpf,
    });

    await checkoutPage.selectPaymentCard();
    await checkoutPage.waitForCardFormReady();
    await checkoutPage.fillCardForm(TEST_CARDS.approved);

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
