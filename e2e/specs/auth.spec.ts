/**
 * Auth Tests - Producer Authentication Flows
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for producer login, registration, and password recovery flows.
 * Uses Page Object Pattern for maintainability.
 * 
 * REFACTORED: Eliminated all waitForTimeout() anti-patterns.
 * All waits are now state-based using Playwright best practices.
 * 
 * @module e2e/specs/auth.spec
 * @version 3.0.0
 */

import { test, expect } from "@playwright/test";
import { AuthPage } from "../fixtures/pages/AuthPage";
import { CadastroPage } from "../fixtures/pages/CadastroPage";
import { 
  TEST_CREDENTIALS, 
  generateTestEmail,
  ROUTES
} from "../fixtures/test-data";

test.describe("Producer Login", () => {
  test("should display login form with all required fields", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Verify form elements
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.submitButton).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Submit without filling email
    await authPage.fillPassword("somepassword");
    await authPage.submit();
    
    // ASSERTIVE: Wait for error to appear
    const errorLocator = page.locator('.text-red-500, .text-destructive, [data-error]').first();
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });

  test("should show validation error for empty password", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Submit without filling password
    await authPage.fillEmail(TEST_CREDENTIALS.producer.email);
    await authPage.submit();
    
    // ASSERTIVE: Wait for error to appear
    const errorLocator = page.locator('.text-red-500, .text-destructive, [data-error]').first();
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Login with invalid credentials
    await authPage.login(
      TEST_CREDENTIALS.invalid.email,
      TEST_CREDENTIALS.invalid.password
    );
    
    // ASSERTIVE: Wait for error response
    const errorLocator = page.locator('[role="alert"], .toast, .error-message, .text-destructive').first();
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to registration page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Click register link
    await authPage.registerLink.click();
    
    // Should be on registration page
    await page.waitForURL(/cadastro/, { timeout: 10000 });
  });

  test("should navigate to password recovery page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Click forgot password link
    await authPage.forgotPasswordLink.click();
    
    // Should be on password recovery page
    await page.waitForURL(/recuperar-senha/, { timeout: 10000 });
  });
});

test.describe("Producer Registration", () => {
  test("should display registration form with all required fields", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Verify form elements
    await expect(cadastroPage.emailInput).toBeVisible();
    await expect(cadastroPage.passwordInput).toBeVisible();
    await expect(cadastroPage.submitButton).toBeVisible();
  });

  test("should show validation for invalid email format", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Fill with invalid email
    await cadastroPage.fillEmail(TEST_CREDENTIALS.malformed.email);
    await cadastroPage.fillPassword("ValidPass123!");
    await cadastroPage.submit();
    
    // ASSERTIVE: Wait for error to appear
    const errorLocator = page.locator('.text-red-500, .text-destructive, [data-error]').first();
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });

  test("should show validation for weak password", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Fill with weak password
    await cadastroPage.fillEmail(generateTestEmail());
    await cadastroPage.fillPassword(TEST_CREDENTIALS.malformed.password);
    await cadastroPage.submit();
    
    // ASSERTIVE: Wait for error to appear
    const errorLocator = page.locator('.text-red-500, .text-destructive, [data-error]').first();
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });

  test("should have link to login page", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Should have link to login
    await expect(cadastroPage.loginLink).toBeVisible();
    
    // Click and verify navigation
    await cadastroPage.loginLink.click();
    await page.waitForURL(/auth/, { timeout: 10000 });
  });
});

test.describe("Password Recovery", () => {
  test("should display password recovery form", async ({ page }) => {
    await page.goto(ROUTES.recuperarSenha);
    await page.waitForLoadState("networkidle");
    
    // Email input should be visible
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Submit button should be visible
    const submitButton = page.getByRole("button", { name: /enviar|recuperar|solicitar/i });
    await expect(submitButton).toBeVisible();
  });

  test("should show validation for invalid email", async ({ page }) => {
    await page.goto(ROUTES.recuperarSenha);
    await page.waitForLoadState("networkidle");
    
    const emailInput = page.getByRole("textbox", { name: /email/i });
    const submitButton = page.getByRole("button", { name: /enviar|recuperar|solicitar/i });
    
    // Fill with invalid email
    await emailInput.fill(TEST_CREDENTIALS.malformed.email);
    await submitButton.click();
    
    // ASSERTIVE: Wait for error to appear
    const errorLocator = page.locator('.text-red-500, .text-destructive, [data-error]').first();
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
  });

  test("should have link back to login", async ({ page }) => {
    await page.goto(ROUTES.recuperarSenha);
    await page.waitForLoadState("networkidle");
    
    // Should have link back to login
    const loginLink = page.getByRole("link", { name: /voltar|login|entrar/i });
    await expect(loginLink.first()).toBeVisible();
  });
});
