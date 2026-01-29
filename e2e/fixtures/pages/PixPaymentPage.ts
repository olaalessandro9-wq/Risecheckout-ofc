/**
 * PixPaymentPage - Page Object for /pay/pix/:orderId
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the PIX payment page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/PixPaymentPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class PixPaymentPage {
  readonly page: Page;
  
  // QR Code
  readonly qrCodeImage: Locator;
  readonly qrCodeContainer: Locator;
  
  // Copy code
  readonly pixCode: Locator;
  readonly copyButton: Locator;
  readonly copiedMessage: Locator;
  
  // Timer
  readonly expirationTimer: Locator;
  readonly expirationWarning: Locator;
  
  // Order info
  readonly orderSummary: Locator;
  readonly totalAmount: Locator;
  readonly productName: Locator;
  
  // Status
  readonly statusPending: Locator;
  readonly statusConfirmed: Locator;
  readonly loadingSpinner: Locator;
  
  // Instructions
  readonly instructions: Locator;
  readonly helpLink: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // QR Code
    this.qrCodeImage = page.locator('[data-testid="pix-qr-code"], img[alt*="QR"], .qr-code img');
    this.qrCodeContainer = page.locator('[data-testid="qr-container"], .qr-code-container');
    
    // Copy code
    this.pixCode = page.locator('[data-testid="pix-code"], .pix-code, input[readonly]');
    this.copyButton = page.getByRole("button", { name: /copiar|copy/i });
    this.copiedMessage = page.locator('.copied-message, [data-testid="copied"]');
    
    // Timer
    this.expirationTimer = page.locator('[data-testid="pix-timer"], .expiration-timer, .countdown');
    this.expirationWarning = page.locator('.expiration-warning, [data-testid="expiration-warning"]');
    
    // Order info
    this.orderSummary = page.locator('[data-testid="order-summary"], .order-summary');
    this.totalAmount = page.locator('[data-testid="total-amount"], .total-amount');
    this.productName = page.locator('[data-testid="product-name"], .product-name');
    
    // Status
    this.statusPending = page.locator('[data-status="pending"], :has-text("Aguardando"), :has-text("Pendente")');
    this.statusConfirmed = page.locator('[data-status="confirmed"], :has-text("Confirmado"), :has-text("Aprovado")');
    this.loadingSpinner = page.locator('.animate-spin');
    
    // Instructions
    this.instructions = page.locator('[data-testid="pix-instructions"], .pix-instructions');
    this.helpLink = page.getByRole("link", { name: /ajuda|dúvidas|suporte/i });
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(orderId: string): Promise<void> {
    await this.page.goto(ROUTES.pixPayment(orderId));
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  // ============================================================================
  // QR Code Actions
  // ============================================================================

  async isQrCodeVisible(): Promise<boolean> {
    return await this.qrCodeImage.isVisible();
  }

  async copyPixCode(): Promise<void> {
    await this.copyButton.click();
  }

  async hasCopiedConfirmation(): Promise<boolean> {
    return await this.copiedMessage.isVisible();
  }

  async getPixCode(): Promise<string> {
    // Try to get from input or text content
    const input = this.page.locator('input[readonly]');
    if (await input.isVisible()) {
      return await input.inputValue() ?? "";
    }
    return await this.pixCode.textContent() ?? "";
  }

  // ============================================================================
  // Timer Actions
  // ============================================================================

  async getExpirationTime(): Promise<string> {
    return await this.expirationTimer.textContent() ?? "";
  }

  async hasExpirationWarning(): Promise<boolean> {
    return await this.expirationWarning.isVisible();
  }

  // ============================================================================
  // Order Info Actions
  // ============================================================================

  async getTotalAmount(): Promise<string> {
    return await this.totalAmount.textContent() ?? "";
  }

  async getProductName(): Promise<string> {
    return await this.productName.textContent() ?? "";
  }

  // ============================================================================
  // Status Checks
  // ============================================================================

  async isPaymentPending(): Promise<boolean> {
    return await this.statusPending.isVisible();
  }

  async isPaymentConfirmed(): Promise<boolean> {
    return await this.statusConfirmed.isVisible();
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForQrCode(): Promise<void> {
    await this.qrCodeImage.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForPageReady(): Promise<void> {
    await this.qrCodeContainer.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.copyButton.waitFor({ state: "visible" });
  }

  async waitForPaymentConfirmation(): Promise<void> {
    await this.statusConfirmed.waitFor({ state: "visible", timeout: 60000 }); // 1 minute for payment
  }

  async waitForRedirectToSuccess(): Promise<void> {
    await this.page.waitForURL(/success/, { timeout: 60000 });
  }
}
