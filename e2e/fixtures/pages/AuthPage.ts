/**
 * AuthPage - Page Object for /auth
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the producer authentication page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/AuthPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class AuthPage {
  readonly page: Page;
  
  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  
  // Navigation elements
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  
  // Feedback elements
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Form elements - using semantic selectors for stability
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole("button", { name: /entrar|login/i });
    
    // Navigation
    this.registerLink = page.getByRole("link", { name: /cadastr|criar conta|registr/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /esquec|recuperar/i });
    
    // Feedback
    this.errorMessage = page.locator('[role="alert"], .error-message, [data-testid="auth-error"]');
    this.loadingSpinner = page.locator('.animate-spin, [data-loading="true"]');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.auth);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToRegister(): Promise<void> {
    await this.registerLink.click();
    await this.page.waitForURL(/cadastro/);
  }

  async navigateToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/recuperar-senha/);
  }

  // ============================================================================
  // Form Actions
  // ============================================================================

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorText(): Promise<string> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent() ?? "";
    }
    return "";
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForFormReady(): Promise<void> {
    await this.emailInput.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  async waitForLoginComplete(): Promise<void> {
    // Wait for redirect to dashboard after successful login
    await this.page.waitForURL(/dashboard/, { timeout: TIMEOUTS.formSubmit });
  }

  async waitForError(): Promise<void> {
    await this.errorMessage.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }
}
