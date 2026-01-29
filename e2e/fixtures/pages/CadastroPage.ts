/**
 * CadastroPage - Page Object for /cadastro
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the producer registration page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/CadastroPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class CadastroPage {
  readonly page: Page;
  
  // Form elements
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  
  // Navigation elements
  readonly loginLink: Locator;
  
  // Feedback elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loadingSpinner: Locator;
  
  // Password strength indicator
  readonly passwordStrength: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.nameInput = page.getByRole("textbox", { name: /nome/i });
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.termsCheckbox = page.getByRole("checkbox", { name: /termos|aceito/i });
    this.submitButton = page.getByRole("button", { name: /cadastrar|criar conta|registrar/i });
    
    // Navigation
    this.loginLink = page.getByRole("link", { name: /entrar|já tem.*conta|login/i });
    
    // Feedback
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.successMessage = page.locator('.success-message, [data-testid="success"]');
    this.loadingSpinner = page.locator('.animate-spin');
    
    // Password strength
    this.passwordStrength = page.locator('[data-testid="password-strength"], .password-strength');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.cadastro);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToLogin(): Promise<void> {
    await this.loginLink.click();
    await this.page.waitForURL(/auth/);
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

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    // Only fill if confirm password field exists
    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(password);
    }
  }

  async acceptTerms(): Promise<void> {
    // Only check if checkbox exists and is not already checked
    if (await this.termsCheckbox.isVisible()) {
      const isChecked = await this.termsCheckbox.isChecked();
      if (!isChecked) {
        await this.termsCheckbox.check();
      }
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.password);
    await this.acceptTerms();
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

  async hasSuccess(): Promise<boolean> {
    return await this.successMessage.isVisible();
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

  async waitForRegistrationComplete(): Promise<void> {
    // Wait for redirect after successful registration
    await this.page.waitForURL(/dashboard|verificar|confirmar/, { 
      timeout: TIMEOUTS.formSubmit 
    });
  }

  async waitForError(): Promise<void> {
    await this.errorMessage.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }
}
