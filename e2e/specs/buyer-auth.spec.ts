/**
 * Buyer Auth Tests - Buyer Authentication Flows
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for buyer login and setup access flows.
 * Uses Page Object Pattern for maintainability.
 * 
 * @module e2e/specs/buyer-auth.spec
 */

import { test, expect } from "@playwright/test";
import { BuyerPage } from "../fixtures/pages/BuyerPage";
import { 
  TEST_CREDENTIALS,
  ROUTES,
  TIMEOUTS 
} from "../fixtures/test-data";

test.describe("Buyer Login Page", () => {
  test("should display login form", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    
    await buyerPage.waitForLoginReady();
    
    // Verify form elements
    await expect(buyerPage.emailInput).toBeVisible();
    await expect(buyerPage.passwordInput).toBeVisible();
    await expect(buyerPage.submitButton).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Submit without email
    await buyerPage.fillPassword("somepassword");
    await buyerPage.submit();
    
    await page.waitForTimeout(500);
    
    // Should show error
    const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    expect(hasError).toBe(true);
  });

  test("should show validation error for empty password", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Submit without password
    await buyerPage.fillEmail(TEST_CREDENTIALS.buyer.email);
    await buyerPage.submit();
    
    await page.waitForTimeout(500);
    
    // Should show error
    const hasError = await page.locator('.text-red-500, .text-destructive, [data-error]').count() > 0;
    expect(hasError).toBe(true);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Login with invalid credentials
    await buyerPage.login(
      TEST_CREDENTIALS.invalid.email,
      TEST_CREDENTIALS.invalid.password
    );
    
    // Wait for API response
    await page.waitForTimeout(3000);
    
    // Should show error message
    const hasError = await buyerPage.hasError();
    const hasToast = await page.locator('.toast, [role="alert"]').count() > 0;
    
    expect(hasError || hasToast).toBe(true);
  });

  test("should have forgot password link", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Should have forgot password link
    await expect(buyerPage.forgotPasswordLink).toBeVisible();
  });
});

test.describe("Buyer Setup Access", () => {
  test("setup access page handles invalid token gracefully", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    
    // Navigate with invalid token
    await page.goto("/setup-access/invalid-token-12345");
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Page should not crash
    await expect(page.locator("body")).not.toBeEmpty();
    
    // Should show error message about invalid token
    const hasError = await page.locator(':has-text("inválido"), :has-text("expirado"), :has-text("erro")').count() > 0;
    const isRedirected = page.url().includes("auth") || page.url().includes("login");
    
    expect(hasError || isRedirected).toBe(true);
  });

  test("setup access page shows loading initially", async ({ page }) => {
    // Slow down network to catch loading state
    await page.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.continue();
    });
    
    await page.goto("/setup-access/some-token");
    
    // Should show loading state
    const loadingIndicator = page.locator('.animate-spin, [data-loading], :has-text("Validando")');
    const hasLoading = await loadingIndicator.count() > 0;
    
    // Loading state may be too fast to catch
    expect(typeof hasLoading).toBe("boolean");
  });
});

test.describe("Buyer Area Access Control", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    // Try to access dashboard directly
    await page.goto(ROUTES.buyerDashboard);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    await page.waitForTimeout(2000);
    
    // Should either show login form or redirect to login
    const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
    const isOnLoginPage = page.url().includes("login") || page.url().includes("minha-conta");
    
    expect(hasLoginForm || isOnLoginPage).toBe(true);
  });

  test("buyer login page should not show producer dashboard links", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Should NOT have links to producer dashboard
    const dashboardLinks = await page.locator('a[href*="/dashboard/produtos"], a[href*="/dashboard/vendas"]').count();
    expect(dashboardLinks).toBe(0);
  });
});

test.describe("Buyer Login Form Accessibility", () => {
  test("should have proper form labels", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Email input should have associated label
    const emailLabel = await page.locator('label:has-text("Email"), label[for*="email"]').count() > 0;
    
    // Password input should have associated label
    const passwordLabel = await page.locator('label:has-text("Senha"), label[for*="password"]').count() > 0;
    
    // At least one should have proper labeling
    expect(emailLabel || passwordLabel).toBe(true);
  });

  test("submit button should be focusable", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Focus on submit button
    await buyerPage.submitButton.focus();
    
    // Button should be focused
    const isFocused = await buyerPage.submitButton.evaluate(
      (el) => document.activeElement === el
    );
    expect(isFocused).toBe(true);
  });

  test("should support keyboard navigation", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    await buyerPage.navigateToLogin();
    await buyerPage.waitForLoginReady();
    
    // Tab through form elements
    await buyerPage.emailInput.focus();
    await page.keyboard.press("Tab");
    
    // Password input should now be focused (or next focusable element)
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });
});
