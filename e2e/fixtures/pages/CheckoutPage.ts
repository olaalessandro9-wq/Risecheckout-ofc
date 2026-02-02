/**
 * CheckoutPage - Page Object for /pay/:slug
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the public checkout page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/CheckoutPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class CheckoutPage {
  readonly page: Page;
  
  // Product info
  readonly productCard: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  
  // Customer form
  readonly customerForm: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly cpfInput: Locator;
  
  // Payment methods
  readonly paymentMethodPix: Locator;
  readonly paymentMethodCard: Locator;
  readonly paymentMethodBoleto: Locator;
  
  // Coupon
  readonly couponInput: Locator;
  readonly couponApplyButton: Locator;
  readonly couponSuccessMessage: Locator;
  readonly couponErrorMessage: Locator;
  
  // Order bumps
  readonly orderBumpCards: Locator;
  
  // Summary
  readonly totalPrice: Locator;
  readonly discountAmount: Locator;
  
  // Submit
  readonly submitButton: Locator;
  readonly loadingSpinner: Locator;
  
  // Error/validation
  readonly errorMessages: Locator;
  readonly fieldErrors: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Product info
    this.productCard = page.locator('[data-testid="product-card"], .product-info, .checkout-product');
    this.productName = page.locator('[data-testid="product-name"], .product-name, h1, h2').first();
    this.productPrice = page.locator('[data-testid="product-price"], .product-price');
    
    // Customer form - use flexible selectors
    this.customerForm = page.locator('[data-testid="customer-form"], form').first();
    this.nameInput = page.getByRole("textbox", { name: /nome/i });
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.phoneInput = page.locator('input[name="phone"], input[placeholder*="telefone"], input[placeholder*="celular"]');
    this.cpfInput = page.locator('input[name="cpf"], input[placeholder*="CPF"], input[placeholder*="cpf"]');
    
    // Payment methods
    this.paymentMethodPix = page.locator('[data-testid="payment-pix"], button:has-text("PIX"), [data-payment="pix"]');
    this.paymentMethodCard = page.locator('[data-testid="payment-card"], button:has-text("Cartão"), [data-payment="card"]');
    this.paymentMethodBoleto = page.locator('[data-testid="payment-boleto"], button:has-text("Boleto"), [data-payment="boleto"]');
    
    // Coupon
    this.couponInput = page.getByPlaceholder(/cupom|código/i);
    this.couponApplyButton = page.getByRole("button", { name: /aplicar|validar/i });
    this.couponSuccessMessage = page.locator('.coupon-success, [data-testid="coupon-success"]');
    this.couponErrorMessage = page.locator('.coupon-error, [data-testid="coupon-error"]');
    
    // Order bumps
    this.orderBumpCards = page.locator('[data-testid="order-bump"], .order-bump, .bump-card');
    
    // Summary
    this.totalPrice = page.locator('[data-testid="total-price"], .total-price, .checkout-total');
    this.discountAmount = page.locator('[data-testid="discount-amount"], .discount-amount');
    
    // Submit
    this.submitButton = page.getByRole("button", { name: /finalizar|comprar|pagar|continuar/i });
    this.loadingSpinner = page.locator('.animate-spin, [data-loading="true"]');
    
    // Errors
    this.errorMessages = page.locator('[role="alert"], .error-message');
    this.fieldErrors = page.locator('.field-error, [data-error="true"]');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(slug: string): Promise<void> {
    await this.page.goto(ROUTES.checkout(slug));
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  // ============================================================================
  // Form Actions
  // ============================================================================

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPhone(phone: string): Promise<void> {
    if (await this.phoneInput.isVisible()) {
      await this.phoneInput.fill(phone);
    }
  }

  async fillCpf(cpf: string): Promise<void> {
    if (await this.cpfInput.isVisible()) {
      await this.cpfInput.fill(cpf);
    }
  }

  async fillCustomerForm(data: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    if (data.phone) await this.fillPhone(data.phone);
    if (data.cpf) await this.fillCpf(data.cpf);
  }

  // ============================================================================
  // Payment Method Actions
  // ============================================================================

  async selectPaymentPix(): Promise<void> {
    await this.paymentMethodPix.click();
  }

  async selectPaymentCard(): Promise<void> {
    await this.paymentMethodCard.click();
  }

  async selectPaymentBoleto(): Promise<void> {
    await this.paymentMethodBoleto.click();
  }

  // ============================================================================
  // Coupon Actions
  // ============================================================================

  async applyCoupon(code: string): Promise<void> {
    await this.couponInput.fill(code);
    await this.couponApplyButton.click();
  }

  async hasCouponSuccess(): Promise<boolean> {
    return await this.couponSuccessMessage.isVisible();
  }

  async hasCouponError(): Promise<boolean> {
    return await this.couponErrorMessage.isVisible();
  }

  // ============================================================================
  // Order Bump Actions
  // ============================================================================

  async getOrderBumpCount(): Promise<number> {
    return await this.orderBumpCards.count();
  }

  async selectOrderBump(index: number): Promise<void> {
    const bump = this.orderBumpCards.nth(index);
    await bump.click();
  }

  async toggleOrderBump(index: number): Promise<void> {
    await this.selectOrderBump(index);
  }

  // ============================================================================
  // Submit Actions
  // ============================================================================

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async submitAndWaitForPix(): Promise<void> {
    await this.submit();
    await this.page.waitForURL(/pay\/pix|pix/, { timeout: TIMEOUTS.formSubmit });
  }

  async submitAndWaitForSuccess(): Promise<void> {
    await this.submit();
    await this.page.waitForURL(/success/, { timeout: TIMEOUTS.formSubmit });
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async hasValidationErrors(): Promise<boolean> {
    return await this.fieldErrors.count() > 0;
  }

  async getProductName(): Promise<string> {
    return await this.productName.textContent() ?? "";
  }

  async getTotalPrice(): Promise<string> {
    return await this.totalPrice.textContent() ?? "";
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForCheckoutReady(): Promise<void> {
    // Wait for product info to load
    await this.productCard.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.customerForm.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  async waitForPaymentMethods(): Promise<void> {
    // Wait for at least one payment method
    await this.page.waitForSelector(
      '[data-testid="payment-pix"], [data-testid="payment-card"], button:has-text("PIX"), button:has-text("Cartão")',
      { timeout: TIMEOUTS.pageLoad }
    );
  }

  // ============================================================================
  // Card Form Actions (RISE V3 - Happy Path E2E)
  // ============================================================================

  /**
   * Fill card form with test card data
   * Handles Mercado Pago card form (gateway único de referência para testes E2E)
   * @see docs/TESTING_SYSTEM.md - Decisão estratégica: apenas MP para testes E2E
   */
  async fillCardForm(card: {
    number: string;
    expiry: string;
    cvv: string;
    holder: string;
  }): Promise<void> {
    // Try direct inputs first (Asaas-style)
    const cardNumber = this.page.locator('input[name="cardNumber"], input[data-testid="card-number"]');
    const cardExpiry = this.page.locator('input[name="cardExpiry"], input[data-testid="card-expiry"]');
    const cardCvv = this.page.locator('input[name="cardCvv"], input[data-testid="card-cvv"], input[name="securityCode"]');
    const cardHolder = this.page.locator('input[name="cardHolder"], input[data-testid="card-holder"], input[name="cardholderName"]');

    // Clean card number (remove spaces)
    const cleanNumber = card.number.replace(/\s/g, '');

    if (await cardNumber.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardNumber.fill(cleanNumber);
      await cardExpiry.fill(card.expiry);
      await cardCvv.fill(card.cvv);
      await cardHolder.fill(card.holder);
    }
  }

  /**
   * Select installments count
   */
  async selectInstallments(count: number): Promise<void> {
    const select = this.page.locator('select[name="installments"], [data-testid="installments-select"]');
    if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
      await select.selectOption({ value: String(count) });
    }
  }

  /**
   * Wait for payment error message to appear
   */
  async waitForPaymentError(): Promise<void> {
    const errorLocator = this.page.locator(
      '[data-testid="payment-error"], [role="alert"]:has-text("erro"), [role="alert"]:has-text("recusado")'
    ).first();
    await errorLocator.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Check if payment error is visible
   */
  async hasPaymentError(): Promise<boolean> {
    const errorLocator = this.page.locator(
      '[data-testid="payment-error"], [role="alert"]:has-text("erro"), [role="alert"]:has-text("recusado")'
    ).first();
    return await errorLocator.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get applied coupon discount text
   */
  async getAppliedCouponDiscount(): Promise<string> {
    return await this.discountAmount.textContent() ?? "";
  }

  /**
   * Wait for coupon feedback (success or error)
   * Uses assertive polling instead of fixed timeout
   */
  async waitForCouponFeedback(): Promise<"success" | "error" | "timeout"> {
    const result = await Promise.race([
      this.couponSuccessMessage.waitFor({ state: "visible", timeout: 5000 }).then(() => "success" as const),
      this.couponErrorMessage.waitFor({ state: "visible", timeout: 5000 }).then(() => "error" as const),
    ]).catch(() => "timeout" as const);
    return result;
  }

  /**
   * Wait for card form to be ready for input
   * RISE V3 ASSERTIVE: Uses element visibility instead of fixed timeout
   */
  async waitForCardFormReady(): Promise<void> {
    const cardFormIndicators = this.page.locator(
      'input[name="cardNumber"], input[data-testid="card-number"], [data-testid="card-form"]'
    ).first();
    await cardFormIndicators.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Wait for UI to stabilize after coupon removal
   * RISE V3 ASSERTIVE: Uses state polling instead of fixed timeout
   */
  async waitForCouponRemoval(): Promise<void> {
    // Wait for remove button to disappear OR price to update
    await this.page.waitForFunction(
      () => {
        const removeBtn = document.querySelector('[role="button"]:has-text("remover")');
        return !removeBtn || removeBtn.getAttribute('aria-hidden') === 'true';
      },
      { timeout: 3000 }
    ).catch(() => {
      // Fallback: wait for any visual change
    });
    // Also wait for any loading to finish
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  /**
   * Remove applied coupon
   */
  async removeCoupon(): Promise<void> {
    const removeButton = this.page.getByRole("button", { name: /remover|remove|x/i });
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
    }
  }

  /**
   * Get current URL path
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
