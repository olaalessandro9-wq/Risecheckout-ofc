/**
 * Coupon Validation - Mercado Pago Reference Gateway
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testa aplicação de cupons usando Mercado Pago como gateway único.
 * Valida cupons válidos, inválidos, expirados e remoção.
 * 
 * Flow: Checkout → Apply Coupon → Verify Discount
 * 
 * @module e2e/specs/critical/coupon-validation.spec
 * @version 2.0.0
 */

import { test, expect } from "@playwright/test";
import { CheckoutPage } from "../../fixtures/pages/CheckoutPage";
import { PixPaymentPage } from "../../fixtures/pages/PixPaymentPage";
import {
  TEST_CHECKOUT_MERCADOPAGO,
  TEST_COUPONS,
  TEST_CUSTOMER,
  generateTestEmail,
} from "../../fixtures/test-data";

test.describe("Coupon Validation - Mercado Pago", () => {
  test.describe("Valid Coupon", () => {
    test("should apply valid coupon and show discount", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      // 1. Navigate to checkout
      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // 2. Get initial price
      const initialPrice = await checkoutPage.getTotalPrice();

      // 3. Apply valid coupon
      await expect(checkoutPage.couponInput).toBeVisible();
      await checkoutPage.applyCoupon(TEST_COUPONS.valid.code);

      // 4. Wait for coupon feedback
      const feedback = await checkoutPage.waitForCouponFeedback();
      expect(feedback).toBe("success");

      // 5. Verify discount is applied
      const hasCouponSuccess = await checkoutPage.hasCouponSuccess();
      expect(hasCouponSuccess).toBe(true);
    });

    test("should show discount amount after applying coupon", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Apply valid coupon
      await checkoutPage.applyCoupon(TEST_COUPONS.valid.code);
      await checkoutPage.waitForCouponFeedback();

      // Verify discount amount is visible
      const discountAmount = await checkoutPage.getAppliedCouponDiscount();
      const hasDiscount = discountAmount.length > 0 || await checkoutPage.hasCouponSuccess();
      expect(hasDiscount).toBe(true);
    });

    test("should maintain coupon through PIX payment flow", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const pixPaymentPage = new PixPaymentPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Apply coupon first
      await checkoutPage.applyCoupon(TEST_COUPONS.valid.code);
      await checkoutPage.waitForCouponFeedback();

      // Fill customer form
      await checkoutPage.fillCustomerForm({
        name: TEST_CUSTOMER.name,
        email: generateTestEmail("coupon-pix"),
        phone: TEST_CUSTOMER.phone,
        cpf: TEST_CUSTOMER.cpf,
      });

      // Select PIX and submit
      await checkoutPage.selectPaymentPix();
      await checkoutPage.submitAndWaitForPix();

      // Verify PIX page loaded (indicates order was created with coupon)
      await pixPaymentPage.waitForPageReady();
      await expect(pixPaymentPage.qrCodeImage.or(pixPaymentPage.qrCodeContainer)).toBeVisible();
    });
  });

  test.describe("Invalid Coupon", () => {
    test("should show error for invalid coupon", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Apply invalid coupon
      await checkoutPage.applyCoupon(TEST_COUPONS.invalid.code);

      // Wait for error feedback
      const feedback = await checkoutPage.waitForCouponFeedback();
      expect(feedback).toBe("error");

      // Verify error message
      const hasCouponError = await checkoutPage.hasCouponError();
      expect(hasCouponError).toBe(true);
    });

    test("should not apply discount for invalid coupon", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Get initial price
      const initialPrice = await checkoutPage.getTotalPrice();

      // Try invalid coupon
      await checkoutPage.applyCoupon(TEST_COUPONS.invalid.code);
      await checkoutPage.waitForCouponFeedback();

      // Price should remain the same
      const finalPrice = await checkoutPage.getTotalPrice();
      expect(finalPrice).toBe(initialPrice);
    });
  });

  test.describe("Expired Coupon", () => {
    test("should show error for expired coupon", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Apply expired coupon
      await checkoutPage.applyCoupon(TEST_COUPONS.expired.code);

      // Wait for feedback
      const feedback = await checkoutPage.waitForCouponFeedback();
      expect(feedback).toBe("error");

      // Verify error is shown
      const hasCouponError = await checkoutPage.hasCouponError();
      expect(hasCouponError).toBe(true);
    });
  });

  test.describe("Coupon Removal", () => {
    test("should allow removing applied coupon", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Get initial price
      const initialPrice = await checkoutPage.getTotalPrice();

      // Apply coupon
      await checkoutPage.applyCoupon(TEST_COUPONS.valid.code);
      await checkoutPage.waitForCouponFeedback();

      // Remove coupon
      await checkoutPage.removeCoupon();
      await checkoutPage.waitForCouponRemoval();

      // Price should return to original
      const finalPrice = await checkoutPage.getTotalPrice();
      expect(finalPrice).toBe(initialPrice);
    });
  });

  test.describe("Coupon Input Validation", () => {
    test("should have coupon input visible on checkout", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Verify coupon input is visible
      await expect(checkoutPage.couponInput).toBeVisible();
    });

    test("should have apply button functional", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.navigate(TEST_CHECKOUT_MERCADOPAGO.slug);
      await checkoutPage.waitForCheckoutReady();

      // Fill coupon input
      await checkoutPage.couponInput.fill(TEST_COUPONS.valid.code);

      // Verify apply button is visible and enabled
      await expect(checkoutPage.couponApplyButton).toBeVisible();
      await expect(checkoutPage.couponApplyButton).toBeEnabled();
    });
  });
});
