/**
 * Auth Tests - Producer Authentication Flows
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for producer login, registration, and password recovery flows.
 * Uses Page Object Pattern for maintainability.
 * 
 * @module e2e/specs/auth.spec
 */

import { test, expect } from "@playwright/test";
import { AuthPage } from "../fixtures/pages/AuthPage";
import { CadastroPage } from "../fixtures/pages/CadastroPage";
import { 
  TEST_CREDENTIALS, 
  generateTestEmail, 
  generateTestName,
  ERROR_MESSAGES,
  ROUTES,
  TIMEOUTS 
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
    
    // Should show error (either field validation or form error)
    await page.waitForTimeout(500); // Wait for validation
    
    // Check for any error indicator
    const hasFieldError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    const hasFormError = await authPage.hasError();
    
    expect(hasFieldError || hasFormError).toBe(true);
  });

  test("should show validation error for empty password", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Submit without filling password
    await authPage.fillEmail(TEST_CREDENTIALS.producer.email);
    await authPage.submit();
    
    // Should show error
    await page.waitForTimeout(500);
    
    const hasFieldError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    const hasFormError = await authPage.hasError();
    
    expect(hasFieldError || hasFormError).toBe(true);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Login with invalid credentials
    await authPage.login(
      TEST_CREDENTIALS.invalid.email,
      TEST_CREDENTIALS.invalid.password
    );
    
    // Wait for API response
    await page.waitForTimeout(2000);
    
    // Should show error message
    const hasError = await authPage.hasError();
    const errorText = await page.locator('[role="alert"], .toast, .error-message, .text-destructive').textContent();
    
    // Either has error element or error toast
    const hasErrorIndicator = hasError || errorText !== null;
    expect(hasErrorIndicator).toBe(true);
  });

  test("should navigate to registration page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Click register link
    await authPage.registerLink.click();
    
    // Should be on registration page
    await expect(page).toHaveURL(/cadastro/);
  });

  test("should navigate to password recovery page", async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate();
    
    // Click forgot password link
    await authPage.forgotPasswordLink.click();
    
    // Should be on password recovery page
    await expect(page).toHaveURL(/recuperar-senha/);
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
    
    // Should show email validation error
    await page.waitForTimeout(500);
    
    const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    expect(hasError).toBe(true);
  });

  test("should show validation for weak password", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Fill with weak password
    await cadastroPage.fillEmail(generateTestEmail());
    await cadastroPage.fillPassword(TEST_CREDENTIALS.malformed.password);
    await cadastroPage.submit();
    
    // Should show password validation error
    await page.waitForTimeout(500);
    
    const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    expect(hasError).toBe(true);
  });

  test("should have link to login page", async ({ page }) => {
    const cadastroPage = new CadastroPage(page);
    await cadastroPage.navigate();
    
    // Should have link to login
    await expect(cadastroPage.loginLink).toBeVisible();
    
    // Click and verify navigation
    await cadastroPage.loginLink.click();
    await expect(page).toHaveURL(/auth/);
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
    
    // Should show validation error
    await page.waitForTimeout(500);
    
    const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    expect(hasError).toBe(true);
  });

  test("should have link back to login", async ({ page }) => {
    await page.goto(ROUTES.recuperarSenha);
    await page.waitForLoadState("networkidle");
    
    // Should have link back to login
    const loginLink = page.getByRole("link", { name: /voltar|login|entrar/i });
    await expect(loginLink.first()).toBeVisible();
  });
});
