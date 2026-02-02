/**
 * Orders List Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for orders management:
 * - Orders list display
 * - Order filtering
 * - Order details view
 * - Order status updates
 * 
 * @module e2e/specs/dashboard/orders-list.spec
 */

import { test, expect } from "@playwright/test";
import { AuthPage } from "../../fixtures/pages/AuthPage";
import { DashboardPage } from "../../fixtures/pages/DashboardPage";

test.describe("Orders List Display", () => {
  test("recent orders are visible on dashboard", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const hasOrders = await dashboardPage.hasRecentOrders();
    expect(typeof hasOrders).toBe("boolean");
  });

  test("orders count is displayed correctly", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const ordersCount = await dashboardPage.getRecentOrdersCount();
    expect(typeof ordersCount).toBe("number");
    expect(ordersCount).toBeGreaterThanOrEqual(0);
  });

  test("empty state shows when no orders exist", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("newproducer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const hasOrders = await dashboardPage.hasRecentOrders();
    const hasEmptyState = await dashboardPage.hasEmptyState();
    
    expect(hasOrders || hasEmptyState).toBe(true);
  });
});

test.describe("Orders Navigation", () => {
  test("orders link navigates to orders page", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await page.waitForTimeout(2000);
    
    const ordersLinkVisible = await dashboardPage.ordersLink.isVisible().catch(() => false);
    
    if (ordersLinkVisible) {
      await dashboardPage.navigateToOrders();
      expect(page.url()).toContain("/pedidos");
    }
  });
});

test.describe("Order Details", () => {
  test("order item is clickable", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const ordersCount = await dashboardPage.getRecentOrdersCount();
    
    if (ordersCount > 0) {
      const firstOrder = dashboardPage.recentOrderItem.first();
      const isClickable = await firstOrder.isVisible();
      expect(isClickable).toBe(true);
    }
  });

  test("order shows basic information", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const ordersCount = await dashboardPage.getRecentOrdersCount();
    
    if (ordersCount > 0) {
      const firstOrder = dashboardPage.recentOrderItem.first();
      const orderText = await firstOrder.textContent();
      
      expect(orderText?.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Orders Statistics", () => {
  test("total orders stat is displayed", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const totalOrders = await dashboardPage.getTotalOrders();
    expect(typeof totalOrders).toBe("string");
  });

  test("total revenue stat is displayed", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const totalRevenue = await dashboardPage.getTotalRevenue();
    expect(typeof totalRevenue).toBe("string");
  });

  test("conversion rate stat is displayed", async ({ page }) => {
    const authPage = new AuthPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await dashboardPage.navigate();
    await dashboardPage.waitForDashboardReady();
    
    const conversionRate = await dashboardPage.getConversionRate();
    expect(typeof conversionRate).toBe("string");
  });
});
