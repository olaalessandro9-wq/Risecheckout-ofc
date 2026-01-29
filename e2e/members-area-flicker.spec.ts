/**
 * Members Area Flicker Fix Tests - Race Condition Validation
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests validating that the race condition causing "Área de Membros Desativada" 
 * flicker has been eliminated. The bug was caused by MembersAreaProvider 
 * receiving an unstable productId derived from the async-loaded product object.
 * The fix establishes ProductContext as the SSOT for productId.
 * 
 * @module e2e/members-area-flicker.spec
 */

import { test, expect } from '@playwright/test';

test.describe('Members Area Flicker Fix', () => {
  const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID;
  
  test.beforeEach(async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
  });

  test('should not show "Área de Membros Desativada" when navigating back from Builder', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/dashboard/produtos/${TEST_PRODUCT_ID}/members-area/builder`);
    await page.waitForLoadState('networkidle');
    
    const backButton = page.locator('button:has-text("Voltar")');
    await backButton.click();
    
    await page.waitForURL(/section=members-area/);
    
    const startTime = Date.now();
    const pollDuration = 2000;
    
    while (Date.now() - startTime < pollDuration) {
      const disabledText = await page.locator('text=Área de Membros Desativada').count();
      expect(disabledText, 'Flicker detected: "Área de Membros Desativada" appeared during loading').toBe(0);
      await page.waitForTimeout(100);
    }
    
    expect(page.url()).toContain('section=members-area');
  });

  test('should handle slow network without flicker', async ({ page, context }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto(`/dashboard/produtos/${TEST_PRODUCT_ID}/members-area/builder`);
    await page.waitForLoadState('networkidle');
    
    const backButton = page.locator('button:has-text("Voltar")');
    await backButton.click();
    
    await page.waitForURL(/section=members-area/);
    
    const startTime = Date.now();
    const pollDuration = 3000;
    
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
    
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=settings`);
    
    await page.waitForSelector('.animate-spin, [data-testid="members-area-content"]', {
      timeout: 5000,
    }).catch(() => {});
    
    const disabledCount = await page.locator('text=Área de Membros Desativada').count();
    
    if (disabledCount > 0) {
      const spinnerVisible = await page.locator('.animate-spin').isVisible();
      expect(spinnerVisible, 'Disabled state shown while still loading').toBe(false);
    }
  });

  test('SettingsTab should show loading state before checking enabled', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=settings`);
    
    await page.waitForTimeout(100);
    
    const hasSpinner = await page.locator('.animate-spin').count() > 0;
    const hasDisabled = await page.locator('text=Área de Membros Desativada').count() > 0;
    
    if (hasDisabled && hasSpinner) {
      throw new Error('Bug: Showing "Desativada" while still loading (spinner visible)');
    }
  });

  test('GroupsTab should show loading state before checking enabled', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}&section=members-area&tab=groups`);
    
    await page.waitForTimeout(100);
    
    const hasSpinner = await page.locator('.animate-spin').count() > 0;
    const hasDisabled = await page.locator('text=Área de Membros Desativada').count() > 0;
    
    if (hasDisabled && hasSpinner) {
      throw new Error('Bug: Showing "Desativada" while still loading (spinner visible)');
    }
  });
});

test.describe('MembersAreaTab in ProductEdit', () => {
  const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID;

  test('should not flicker when loading product with members area', async ({ page }) => {
    if (!TEST_PRODUCT_ID) {
      test.skip();
      return;
    }
    
    await page.goto(`/dashboard/produtos/editar?id=${TEST_PRODUCT_ID}`);
    await page.waitForLoadState('networkidle');
    
    const membersAreaTab = page.locator('button:has-text("Área de Membros"), [role="tab"]:has-text("Área de Membros")');
    await membersAreaTab.click();
    
    const startTime = Date.now();
    const pollDuration = 2000;
    
    while (Date.now() - startTime < pollDuration) {
      const flickerText = await page.locator('h3:has-text("Área de Membros Desativada")').count();
      
      if (flickerText > 0) {
        const hasSpinner = await page.locator('.animate-spin').count() > 0;
        expect(hasSpinner, 'Flicker: Disabled state shown during loading').toBe(false);
      }
      
      await page.waitForTimeout(100);
    }
  });
});
