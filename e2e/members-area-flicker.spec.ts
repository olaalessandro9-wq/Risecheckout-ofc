/**
 * Members Area Flicker Fix - E2E Tests
 * 
 * RISE V3: These tests validate that the race condition causing
 * "Área de Membros Desativada" flicker has been eliminated.
 * 
 * The bug was caused by MembersAreaProvider receiving an unstable
 * productId derived from the async-loaded product object.
 * 
 * The fix establishes ProductContext as the SSOT for productId,
 * providing a stable ID from the route on first render.
 * 
 * @see action-plan-flicker-fix/action_plan.md
 */

import { test, expect } from '@playwright/test';

test.describe('Members Area Flicker Fix', () => {
  // Skip these tests if no test product is configured
  // In a real environment, this would use a seeded test product
  const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID;
  
  test.beforeEach(async ({ page }) => {
    // Skip if no test product configured
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Ensure we're logged in (adjust based on your auth setup)
    // This assumes session persistence is enabled in playwright config
  });

  test('should not show "Área de Membros Desativada" when navigating back from Builder', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Navigate directly to Builder (simulating direct URL access)
    await page.goto(`/dashboard/produtos/${TEST_PRODUCT_ID}/members-area/builder`);
    
    // Wait for Builder to load
    await page.waitForLoadState('networkidle');
    
    // Click "Voltar" button
    const backButton = page.locator('button:has-text("Voltar")');
    await backButton.click();
    
    // Wait for navigation to complete
    await page.waitForURL(/section=members-area/);
    
    // CRITICAL ASSERTION: Poll for 2 seconds to ensure the flicker never appears
    // The bug is probabilistic, so we need to check continuously
    const startTime = Date.now();
    const pollDuration = 2000; // 2 seconds
    
    while (Date.now() - startTime < pollDuration) {
      // Check that "Área de Membros Desativada" never appears
      const disabledText = await page.locator('text=Área de Membros Desativada').count();
      expect(disabledText, 'Flicker detected: "Área de Membros Desativada" appeared during loading').toBe(0);
      await page.waitForTimeout(100); // Check every 100ms
    }
    
    // Verify that we're on the correct page
    expect(page.url()).toContain('section=members-area');
  });

  test('should handle slow network without flicker', async ({ page, context }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Simulate slow 3G by delaying all requests
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      await route.continue();
    });
    
    // Navigate directly to Builder
    await page.goto(`/dashboard/produtos/${TEST_PRODUCT_ID}/members-area/builder`);
    await page.waitForLoadState('networkidle');
    
    // Click "Voltar" button
    const backButton = page.locator('button:has-text("Voltar")');
    await backButton.click();
    
    // Wait for navigation
    await page.waitForURL(/section=members-area/);
    
    // Even with slow network, should never show disabled state during loading
    const startTime = Date.now();
    const pollDuration = 3000; // 3 seconds for slow network
    
    while (Date.now() - startTime < pollDuration) {
      const disabledText = await page.locator('text=Área de Membros Desativada').count();
      expect(disabledText, 'Flicker detected on slow network').toBe(0);
      await page.waitForTimeout(100);
    }
  });

  test('should show loading spinner during data fetch, not disabled state', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Navigate directly to the members area section
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=settings`);
    
    // During initial load, we should see either:
    // 1. A loading spinner (animate-spin class)
    // 2. The actual content (if already loaded)
    // But NEVER "Área de Membros Desativada" during loading
    
    // Wait for either loading or content
    await page.waitForSelector('.animate-spin, [data-testid="members-area-content"]', {
      timeout: 5000,
    }).catch(() => {
      // If neither appears, that's also acceptable (fast load)
    });
    
    // Check that disabled state is not shown prematurely
    const disabledCount = await page.locator('text=Área de Membros Desativada').count();
    
    // If disabled state is shown, it should only be after loading is complete
    if (disabledCount > 0) {
      // Verify that loading spinner is NOT visible (meaning load is complete)
      const spinnerVisible = await page.locator('.animate-spin').isVisible();
      expect(spinnerVisible, 'Disabled state shown while still loading').toBe(false);
    }
  });

  test('SettingsTab should show loading state before checking enabled', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Navigate to settings tab
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=settings`);
    
    // The first thing we should see is either:
    // 1. Loading spinner
    // 2. Actual settings content
    // Never "Desativada" during loading
    
    // Wait a brief moment for initial render
    await page.waitForTimeout(100);
    
    // Check for loading spinner or content
    const hasSpinner = await page.locator('.animate-spin').count() > 0;
    const hasDisabled = await page.locator('text=Área de Membros Desativada').count() > 0;
    
    // If showing disabled, spinner should NOT be visible (load complete)
    if (hasDisabled && hasSpinner) {
      throw new Error('Bug: Showing "Desativada" while still loading (spinner visible)');
    }
  });

  test('GroupsTab should show loading state before checking enabled', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Navigate to groups tab
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=groups`);
    
    // Wait a brief moment for initial render
    await page.waitForTimeout(100);
    
    // Check for loading spinner or content
    const hasSpinner = await page.locator('.animate-spin').count() > 0;
    const hasDisabled = await page.locator('text=Área de Membros Desativada').count() > 0;
    
    // If showing disabled, spinner should NOT be visible (load complete)
    if (hasDisabled && hasSpinner) {
      throw new Error('Bug: Showing "Desativada" while still loading (spinner visible)');
    }
  });
});

/**
 * Test for the MembersAreaTab within ProductEdit
 * This tests the tab that appears in the main product editing screen
 */
test.describe('MembersAreaTab in ProductEdit', () => {
  const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID;

  test('should not flicker when loading product with members area', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    // Navigate to product edit page
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on "Área de Membros" tab
    const membersAreaTab = page.locator('button:has-text("Área de Membros"), [role="tab"]:has-text("Área de Membros")');
    await membersAreaTab.click();
    
    // Poll for flicker
    const startTime = Date.now();
    const pollDuration = 2000;
    
    while (Date.now() - startTime < pollDuration) {
      // Check for the specific flicker text
      const flickerText = await page.locator('h3:has-text("Área de Membros Desativada")').count();
      
      // If we see the disabled card, verify it's not during loading
      if (flickerText > 0) {
        const hasSpinner = await page.locator('.animate-spin').count() > 0;
        expect(hasSpinner, 'Flicker: Disabled state shown during loading').toBe(false);
      }
      
      await page.waitForTimeout(100);
    }
  });
});
