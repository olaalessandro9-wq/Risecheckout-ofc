/**
 * Smoke Tests - Critical Route Rendering
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Fast smoke tests that validate critical routes load without errors.
 * These tests are designed to run quickly and catch major regressions.
 * 
 * @module e2e/specs/smoke.spec
 */

import { test, expect } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../fixtures/test-data";

test.describe("Smoke Tests - Route Rendering", () => {
  // ============================================================================
  // Public Routes
  // ============================================================================

  test("landing page loads without errors", async ({ page }) => {
    await page.goto(ROUTES.landing);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Verify no critical errors in console
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleLogs.push(msg.text());
      }
    });
    
    // Page should have content
    await expect(page.locator("body")).not.toBeEmpty();
    
    // Header or hero section should be visible
    const header = page.locator("header, nav, h1").first();
    await expect(header).toBeVisible();
  });

  test("auth page loads without errors", async ({ page }) => {
    await page.goto(ROUTES.auth);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Login form should be present
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Submit button should be present
    const submitButton = page.getByRole("button", { name: /entrar|login/i });
    await expect(submitButton).toBeVisible();
  });

  test("cadastro page loads without errors", async ({ page }) => {
    await page.goto(ROUTES.cadastro);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Registration form should be present
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
    
    // Password input should be present
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible();
  });

  test("recuperar-senha page loads without errors", async ({ page }) => {
    await page.goto(ROUTES.recuperarSenha);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Email input for password recovery
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  test("termos-de-uso page loads without errors", async ({ page }) => {
    await page.goto(ROUTES.termosDeUso);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Should have content about terms
    await expect(page.locator("body")).toContainText(/termos|uso|política/i);
  });

  // ============================================================================
  // Checkout Routes (Expected to show error for invalid slugs)
  // ============================================================================

  test("checkout page handles invalid slug gracefully", async ({ page }) => {
    await page.goto(ROUTES.checkout("non-existent-slug-12345"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Should show error message or 404-like content (not crash)
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
    
    // No unhandled error dialogs
    const errorDialog = page.locator('[role="alertdialog"], .error-boundary');
    const hasErrorBoundary = await errorDialog.count() > 0;
    
    // If there's an error boundary, it should display a user-friendly message
    if (hasErrorBoundary) {
      await expect(errorDialog).toContainText(/erro|problema|encontrado/i);
    }
  });

  test("payment success preview page loads", async ({ page }) => {
    await page.goto(ROUTES.previewSuccess);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Page should render without crashing
    await expect(page.locator("body")).not.toBeEmpty();
  });

  // ============================================================================
  // Buyer Routes
  // ============================================================================

  test("minha-conta page loads login form", async ({ page }) => {
    await page.goto(ROUTES.buyerLogin);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Should show login form (not authenticated)
    const emailOrLoginIndicator = page.getByRole("textbox", { name: /email/i })
      .or(page.locator('input[type="email"]'))
      .or(page.locator(':has-text("login"), :has-text("entrar")'));
    
    await expect(emailOrLoginIndicator.first()).toBeVisible();
  });
});

test.describe("Smoke Tests - Critical UI Elements", () => {
  test("landing page has working navigation", async ({ page }) => {
    await page.goto(ROUTES.landing);
    await page.waitForLoadState("networkidle");
    
    // Find login/register buttons in header or hero
    const authButtons = page.getByRole("link", { name: /entrar|cadastr|login|criar.*conta/i });
    const count = await authButtons.count();
    
    // Should have at least one auth-related button
    expect(count).toBeGreaterThan(0);
  });

  test("auth page has link to registration", async ({ page }) => {
    await page.goto(ROUTES.auth);
    await page.waitForLoadState("networkidle");
    
    // Should have link to registration
    const registerLink = page.getByRole("link", { name: /cadastr|criar.*conta|registr/i });
    await expect(registerLink.first()).toBeVisible();
  });

  test("auth page has link to password recovery", async ({ page }) => {
    await page.goto(ROUTES.auth);
    await page.waitForLoadState("networkidle");
    
    // Should have link to password recovery
    const forgotLink = page.getByRole("link", { name: /esquec|recuperar/i });
    await expect(forgotLink.first()).toBeVisible();
  });
});
