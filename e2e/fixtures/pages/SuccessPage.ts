/**
 * SuccessPage - Page Object for /success/:orderId
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the payment success page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/SuccessPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class SuccessPage {
  readonly page: Page;
  
  // Success indicators
  readonly successIcon: Locator;
  readonly successTitle: Locator;
  readonly successMessage: Locator;
  
  // Order details
  readonly orderDetails: Locator;
  readonly orderId: Locator;
  readonly productName: Locator;
  readonly totalAmount: Locator;
  readonly paymentMethod: Locator;
  
  // Customer info
  readonly customerEmail: Locator;
  readonly customerName: Locator;
  
  // Actions
  readonly accessProductButton: Locator;
  readonly viewReceiptButton: Locator;
  readonly backToHomeButton: Locator;
  
  // Loading
  readonly loadingSpinner: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Success indicators
    this.successIcon = page.locator('[data-testid="success-icon"], .success-icon, svg.text-green-500, .text-success');
    this.successTitle = page.locator('[data-testid="success-title"], h1:has-text("sucesso"), h1:has-text("Parabéns")');
    this.successMessage = page.locator('[data-testid="success-message"], .success-message');
    
    // Order details
    this.orderDetails = page.locator('[data-testid="order-details"], .order-details');
    this.orderId = page.locator('[data-testid="order-id"], .order-id');
    this.productName = page.locator('[data-testid="product-name"], .product-name');
    this.totalAmount = page.locator('[data-testid="total-amount"], .total-amount');
    this.paymentMethod = page.locator('[data-testid="payment-method"], .payment-method');
    
    // Customer info
    this.customerEmail = page.locator('[data-testid="customer-email"], .customer-email');
    this.customerName = page.locator('[data-testid="customer-name"], .customer-name');
    
    // Actions
    this.accessProductButton = page.getByRole("link", { name: /acessar.*produto|acessar.*área|começar/i });
    this.viewReceiptButton = page.getByRole("button", { name: /recibo|comprovante/i });
    this.backToHomeButton = page.getByRole("link", { name: /voltar|início|home/i });
    
    // Loading
    this.loadingSpinner = page.locator('.animate-spin');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(orderId: string): Promise<void> {
    await this.page.goto(ROUTES.paymentSuccess(orderId));
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToPreview(): Promise<void> {
    await this.page.goto(ROUTES.previewSuccess);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async clickAccessProduct(): Promise<void> {
    await this.accessProductButton.click();
  }

  async clickBackToHome(): Promise<void> {
    await this.backToHomeButton.click();
  }

  // ============================================================================
  // Order Info Actions
  // ============================================================================

  async getOrderId(): Promise<string> {
    return await this.orderId.textContent() ?? "";
  }

  async getProductName(): Promise<string> {
    return await this.productName.textContent() ?? "";
  }

  async getTotalAmount(): Promise<string> {
    return await this.totalAmount.textContent() ?? "";
  }

  async getPaymentMethod(): Promise<string> {
    return await this.paymentMethod.textContent() ?? "";
  }

  async getCustomerEmail(): Promise<string> {
    return await this.customerEmail.textContent() ?? "";
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isSuccessful(): Promise<boolean> {
    return await this.successIcon.isVisible() || await this.successTitle.isVisible();
  }

  async hasOrderDetails(): Promise<boolean> {
    return await this.orderDetails.isVisible();
  }

  async hasAccessButton(): Promise<boolean> {
    return await this.accessProductButton.isVisible();
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForSuccess(): Promise<void> {
    await this.successIcon.or(this.successTitle).waitFor({ 
      state: "visible", 
      timeout: TIMEOUTS.pageLoad 
    });
  }

  async waitForOrderDetails(): Promise<void> {
    await this.orderDetails.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForPageReady(): Promise<void> {
    await this.waitForSuccess();
    // State-based wait for page stability (RISE V3 - 10.0/10)
    await this.page.waitForLoadState("domcontentloaded");
  }
}
