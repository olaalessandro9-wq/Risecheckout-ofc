/**
 * Landing Page Tests - Navigation and CTAs
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for landing page navigation, sections, and call-to-action buttons.
 * Uses Page Object Pattern for maintainability.
 * 
 * @module e2e/specs/landing.spec
 */

import { test, expect } from "@playwright/test";
import { LandingPage } from "../fixtures/pages/LandingPage";
import { ROUTES, TIMEOUTS } from "../fixtures/test-data";

test.describe("Landing Page Structure", () => {
  test("should display hero section", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Hero section should be visible
    const isHeroVisible = await landingPage.isHeroVisible();
    expect(isHeroVisible).toBe(true);
  });

  test("should display header with navigation", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Header should be visible
    const isHeaderVisible = await landingPage.isHeaderVisible();
    expect(isHeaderVisible).toBe(true);
  });

  test("should display footer", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Scroll to footer
    await landingPage.scrollToFooter();
    
    // Footer should be visible
    const isFooterVisible = await landingPage.isFooterVisible();
    expect(isFooterVisible).toBe(true);
  });

  test("should have hero title", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Hero title should have content
    const heroTitle = await landingPage.getHeroTitle();
    expect(heroTitle.length).toBeGreaterThan(0);
  });
});

test.describe("Landing Page Navigation", () => {
  test("should navigate to login page from header", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Click login button
    if (await landingPage.loginButton.isVisible()) {
      await landingPage.clickLogin();
      
      // Should be on auth page
      await expect(page).toHaveURL(/auth/);
    }
  });

  test("should navigate to registration from CTA", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Find and click a CTA button
    const ctaCount = await landingPage.getCtaCount();
    
    if (ctaCount > 0) {
      await landingPage.heroCta.click();
      
      // Should navigate to auth or cadastro
      await page.waitForTimeout(1000);
      const url = page.url();
      const isAuthPage = url.includes("auth") || url.includes("cadastro");
      expect(isAuthPage).toBe(true);
    }
  });

  test("should have multiple CTAs throughout the page", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Count CTAs
    const ctaCount = await landingPage.getCtaCount();
    
    // Should have at least one CTA
    expect(ctaCount).toBeGreaterThan(0);
  });
});

test.describe("Landing Page Scroll Behavior", () => {
  test("should be able to scroll to features section", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Scroll to features
    await landingPage.scrollToFeatures();
    await page.waitForTimeout(500);
    
    // Page should have scrolled (viewport position changed)
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test("should be able to scroll to footer", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Scroll to footer
    await landingPage.scrollToFooter();
    await page.waitForTimeout(500);
    
    // Footer should be in viewport
    const isFooterVisible = await landingPage.isFooterVisible();
    expect(isFooterVisible).toBe(true);
  });
});

test.describe("Landing Page Responsiveness", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Hero should still be visible
    const isHeroVisible = await landingPage.isHeroVisible();
    expect(isHeroVisible).toBe(true);
    
    // Header should be visible (may be hamburger menu)
    const isHeaderVisible = await landingPage.isHeaderVisible();
    expect(isHeaderVisible).toBe(true);
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Hero should be visible
    const isHeroVisible = await landingPage.isHeroVisible();
    expect(isHeroVisible).toBe(true);
  });

  test("should display correctly on desktop viewport", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const landingPage = new LandingPage(page);
    await landingPage.navigate();
    
    // Hero should be visible
    const isHeroVisible = await landingPage.isHeroVisible();
    expect(isHeroVisible).toBe(true);
    
    // Login button should be visible (not hamburger)
    const loginVisible = await landingPage.loginButton.isVisible();
    expect(loginVisible).toBe(true);
  });
});
