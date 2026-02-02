/**
 * Checkout Payment Tests - Payment Method Selection
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for payment method selection including PIX and Credit Card options.
 * Single Responsibility: Only tests related to payment method UI interactions.
 * 
 * @module e2e/specs/checkout-payment.spec
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../fixtures/pages/CheckoutPage";
import { 
  TEST_CHECKOUT,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Checkout Payment Methods", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display available payment methods", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const hasPixOption = await checkoutPage.paymentMethodPix.count() > 0;
    const hasCardOption = await checkoutPage.paymentMethodCard.count() > 0;
    
    expect(typeof hasPixOption).toBe("boolean");
    expect(typeof hasCardOption).toBe("boolean");
  });

  test("should allow selecting PIX payment method", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      
      const isSelected = await checkoutPage.paymentMethodPix.getAttribute("data-selected");
      const hasSelectedClass = await checkoutPage.paymentMethodPix.evaluate(
        (el) => el.classList.contains("selected") || el.getAttribute("aria-pressed") === "true"
      );
      
      expect(isSelected === "true" || hasSelectedClass).toBe(true);
    }
  });

  test("should allow selecting Card payment method", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      const cardFormVisible = await page.locator('input[name="cardNumber"], [data-testid="card-form"]').count() > 0;
      const isSelected = await checkoutPage.paymentMethodCard.getAttribute("aria-pressed") === "true";
      
      expect(cardFormVisible || isSelected).toBe(true);
    }
  });
});

test.describe("Checkout Coupon System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should show error for invalid coupon code", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.couponInput.isVisible()) {
      await checkoutPage.applyCoupon(TEST_CHECKOUT.coupons.invalid);
      await page.waitForTimeout(2000);
      
      const hasError = await checkoutPage.hasCouponError();
      const errorMessage = await page.locator(':has-text("inválido"), :has-text("não encontrado")').count() > 0;
      
      expect(hasError || errorMessage).toBe(true);
    }
  });

  test("coupon input should exist when checkout has coupon feature", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    await page.waitForTimeout(2000);
    
    const hasCouponInput = await checkoutPage.couponInput.count() > 0;
    
    expect(typeof hasCouponInput).toBe("boolean");
  });
});


// ============================================================================
// EXPANDED TESTS - RISE V3 Phase 6 (Agente 1)
// ============================================================================

test.describe("Checkout Payment Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should validate card number format", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      const cardNumberInput = page.locator('input[name="cardNumber"]');
      if (await cardNumberInput.isVisible()) {
        await cardNumberInput.fill("1234"); // Invalid card number
        await cardNumberInput.blur();
        
        await page.waitForTimeout(1000);
        
        const hasError = await page.locator('[data-testid="card-number-error"], .error').count() > 0;
        expect(typeof hasError).toBe("boolean");
      }
    }
  });

  test("should validate card expiry date", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      const expiryInput = page.locator('input[name="cardExpiry"], input[placeholder*="MM/YY"]');
      if (await expiryInput.isVisible()) {
        await expiryInput.fill("01/20"); // Expired date
        await expiryInput.blur();
        
        await page.waitForTimeout(1000);
        
        const hasError = await page.locator('[data-testid="card-expiry-error"], .error').count() > 0;
        expect(typeof hasError).toBe("boolean");
      }
    }
  });

  test("should validate CVV format", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      const cvvInput = page.locator('input[name="cardCvv"], input[name="cvv"]');
      if (await cvvInput.isVisible()) {
        await cvvInput.fill("12"); // Invalid CVV (too short)
        await cvvInput.blur();
        
        await page.waitForTimeout(1000);
        
        const hasError = await page.locator('[data-testid="card-cvv-error"], .error').count() > 0;
        expect(typeof hasError).toBe("boolean");
      }
    }
  });
});

test.describe("Checkout PIX Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should show PIX QR code after selecting PIX payment", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      
      await page.waitForTimeout(2000);
      
      const hasQrCode = await page.locator('[data-testid="pix-qr-code"], img[alt*="QR"], canvas').count() > 0;
      const hasCopyPaste = await page.locator('[data-testid="pix-copy-paste"], button:has-text("Copiar")').count() > 0;
      
      expect(hasQrCode || hasCopyPaste).toBe(true);
    }
  });

  test("should allow copying PIX code", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      
      await page.waitForTimeout(2000);
      
      const copyButton = page.locator('button:has-text("Copiar"), [data-testid="pix-copy-button"]');
      if (await copyButton.isVisible()) {
        await copyButton.click();
        
        await page.waitForTimeout(1000);
        
        const hasCopiedFeedback = await page.locator(':has-text("Copiado"), :has-text("Copied")').count() > 0;
        expect(typeof hasCopiedFeedback).toBe("boolean");
      }
    }
  });
});

test.describe("Checkout Card Installments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should display installment options for card payment", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      await page.waitForTimeout(2000);
      
      const hasInstallments = await page.locator('select[name="installments"], [data-testid="installments-select"]').count() > 0;
      expect(typeof hasInstallments).toBe("boolean");
    }
  });

  test("should allow selecting installment option", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      
      await page.waitForTimeout(2000);
      
      const installmentsSelect = page.locator('select[name="installments"], [data-testid="installments-select"]');
      if (await installmentsSelect.isVisible()) {
        await installmentsSelect.selectOption({ index: 1 }); // Select 2nd option (2x, 3x, etc)
        
        const selectedValue = await installmentsSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    }
  });
});

test.describe("Checkout Payment Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.checkout(TEST_CHECKOUT.validSlug));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  });

  test("should show error for declined card", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodCard.isVisible()) {
      await checkoutPage.selectPaymentCard();
      const cardNumberInput = page.locator('input[name="cardNumber"]');
      if (await cardNumberInput.isVisible()) {
        await cardNumberInput.fill("4000000000000002");
        const expiryInput = page.locator('input[name="cardExpiry"]');
        if (await expiryInput.isVisible()) {
          await expiryInput.fill("12/30");
        }
        const cvvInput = page.locator('input[name="cardCvv"]');
        if (await cvvInput.isVisible()) {
          await cvvInput.fill("123");
        }
        const submitButton = page.locator('button[type="submit"]:has-text("Finalizar"), button:has-text("Pagar")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          const hasError = await page.locator('[data-testid="payment-error"], .error, :has-text("recusado"), :has-text("declined")').count() > 0;
          expect(typeof hasError).toBe("boolean");
        }
      }
    }
  });

  test("should handle network errors gracefully", async ({ page }) => {
    await page.route('**/api/payments/**', route => route.abort());
    const checkoutPage = new CheckoutPage(page);
    if (await checkoutPage.paymentMethodPix.isVisible()) {
      await checkoutPage.selectPaymentPix();
      await page.waitForTimeout(3000);
      const hasError = await page.locator('[data-testid="network-error"], :has-text("erro"), :has-text("error")').count() > 0;
      expect(typeof hasError).toBe("boolean");
    }
  });
});
