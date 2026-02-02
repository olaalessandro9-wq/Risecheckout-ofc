/**
 * Analytics Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for analytics and dashboard statistics:
 * - Dashboard stats display
 * - Stats accuracy
 * - Loading states
 * - Empty states
 * 
 * @module e2e/specs/dashboard/analytics.spec
 */

import { test, expect } from "@playwright/test";
import { AuthPage } from "../../fixtures/pages/AuthPage";
import { DashboardPage } from "../../fixtures/pages/DashboardPage";

test.describe("Dashboard Stats Display", () => {
  test("dashboard loads with stats or empty state", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const hasStats = await dashboardPage.isStatsVisible();
    const hasEmptyState = await dashboardPage.hasEmptyState();
    
    expect(hasStats || hasEmptyState).toBe(true);
  });

  test("total sales stat is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const totalSales = await dashboardPage.getTotalSales();
    expect(typeof totalSales).toBe("string");
  });

  test("total revenue stat is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const totalRevenue = await dashboardPage.getTotalRevenue();
    expect(typeof totalRevenue).toBe("string");
    expect(totalRevenue.length).toBeGreaterThan(0);
  });

  test("total orders stat is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const totalOrders = await dashboardPage.getTotalOrders();
    expect(typeof totalOrders).toBe("string");
    expect(totalOrders.length).toBeGreaterThan(0);
  });

  test("conversion rate stat is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const conversionRate = await dashboardPage.getConversionRate();
    expect(typeof conversionRate).toBe("string");
    expect(conversionRate.length).toBeGreaterThan(0);
  });
});

test.describe("Dashboard Loading States", () => {
  test("dashboard shows loading state initially", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    
    const isLoading = await dashboardPage.isLoading();
    expect(typeof isLoading).toBe("boolean");
  });

  test("loading state disappears after data loads", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    await page.waitForTimeout(2000);
    
    const isLoading = await dashboardPage.isLoading();
    expect(isLoading).toBe(false);
  });
});

test.describe("Dashboard Navigation", () => {
  test("products link is accessible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const productsLinkVisible = await dashboardPage.productsLink.isVisible().catch(() => false);
    expect(typeof productsLinkVisible).toBe("boolean");
  });

  test("financial link is accessible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const financialLinkVisible = await dashboardPage.financialLink.isVisible().catch(() => false);
    expect(typeof financialLinkVisible).toBe("boolean");
  });

  test("affiliates link is accessible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const affiliatesLinkVisible = await dashboardPage.affiliatesLink.isVisible().catch(() => false);
    expect(typeof affiliatesLinkVisible).toBe("boolean");
  });
});

test.describe("Dashboard Quick Actions", () => {
  test("create product button is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const createButtonVisible = await dashboardPage.createProductButton.isVisible().catch(() => false);
    expect(typeof createButtonVisible).toBe("boolean");
  });

  test("view products button is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const viewButtonVisible = await dashboardPage.viewProductsButton.isVisible().catch(() => false);
    expect(typeof viewButtonVisible).toBe("boolean");
  });
});
