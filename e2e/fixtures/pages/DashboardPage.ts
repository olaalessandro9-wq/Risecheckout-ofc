/**
 * DashboardPage - Page Object for Producer Dashboard
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates interactions with the producer dashboard main page.
 * Handles navigation, stats display, and quick actions.
 * 
 * @module e2e/fixtures/pages/DashboardPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class DashboardPage {
  readonly page: Page;
  
  // Navigation elements
  readonly productsLink: Locator;
  readonly ordersLink: Locator;
  readonly analyticsLink: Locator;
  readonly affiliatesLink: Locator;
  readonly financialLink: Locator;
  
  // Quick actions
  readonly createProductButton: Locator;
  readonly viewProductsButton: Locator;
  
  // Stats cards
  readonly totalSalesCard: Locator;
  readonly totalRevenueCard: Locator;
  readonly totalOrdersCard: Locator;
  readonly conversionRateCard: Locator;
  
  // Content areas
  readonly recentOrdersList: Locator;
  readonly recentOrderItem: Locator;
  readonly emptyState: Locator;
  
  // Loading states
  readonly loadingSpinner: Locator;
  readonly skeletonLoader: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation - using semantic selectors with fallbacks
    this.productsLink = page.locator('[data-testid="nav-products"], a[href*="/produtos"]').first();
    this.ordersLink = page.locator('[data-testid="nav-orders"], a[href*="/pedidos"]').first();
    this.analyticsLink = page.locator('[data-testid="nav-analytics"], a[href*="/analytics"]').first();
    this.affiliatesLink = page.locator('[data-testid="nav-affiliates"], a[href*="/afiliados"]').first();
    this.financialLink = page.locator('[data-testid="nav-financial"], a[href*="/financeiro"]').first();
    
    // Quick actions
    this.createProductButton = page.locator('[data-testid="create-product-btn"], button:has-text("Criar Produto"), button:has-text("Novo Produto")').first();
    this.viewProductsButton = page.locator('[data-testid="view-products-btn"], a:has-text("Ver Produtos")').first();
    
    // Stats cards - flexible selectors for different layouts
    this.totalSalesCard = page.locator('[data-testid="stat-sales"], [data-stat="sales"]').first();
    this.totalRevenueCard = page.locator('[data-testid="stat-revenue"], [data-stat="revenue"]').first();
    this.totalOrdersCard = page.locator('[data-testid="stat-orders"], [data-stat="orders"]').first();
    this.conversionRateCard = page.locator('[data-testid="stat-conversion"], [data-stat="conversion"]').first();
    
    // Content areas
    this.recentOrdersList = page.locator('[data-testid="recent-orders-list"], .recent-orders').first();
    this.recentOrderItem = page.locator('[data-testid="order-item"], .order-item');
    this.emptyState = page.locator('[data-testid="empty-state"], .empty-state, :has-text("Nenhum")').first();
    
    // Loading states
    this.loadingSpinner = page.locator('.animate-spin, [data-loading="true"]');
    this.skeletonLoader = page.locator('[data-testid="skeleton"], .skeleton');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.dashboard);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToProducts(): Promise<void> {
    await this.productsLink.click();
    await this.page.waitForURL(/produtos/, { timeout: TIMEOUTS.navigation });
  }

  async navigateToOrders(): Promise<void> {
    await this.ordersLink.click();
    await this.page.waitForURL(/pedidos/, { timeout: TIMEOUTS.navigation });
  }

  async navigateToAnalytics(): Promise<void> {
    await this.analyticsLink.click();
    await this.page.waitForURL(/analytics/, { timeout: TIMEOUTS.navigation });
  }

  async navigateToAffiliates(): Promise<void> {
    await this.affiliatesLink.click();
    await this.page.waitForURL(/afiliados/, { timeout: TIMEOUTS.navigation });
  }

  async navigateToFinancial(): Promise<void> {
    await this.financialLink.click();
    await this.page.waitForURL(/financeiro/, { timeout: TIMEOUTS.navigation });
  }

  // ============================================================================
  // Quick Actions
  // ============================================================================

  async createProduct(): Promise<void> {
    await this.createProductButton.click();
    await this.page.waitForURL(/produtos\/editar/, { timeout: TIMEOUTS.navigation });
  }

  async viewProducts(): Promise<void> {
    await this.viewProductsButton.click();
    await this.page.waitForURL(/produtos/, { timeout: TIMEOUTS.navigation });
  }

  // ============================================================================
  // Stats Getters
  // ============================================================================

  async getTotalSales(): Promise<string> {
    if (await this.totalSalesCard.isVisible()) {
      return await this.totalSalesCard.textContent() ?? "0";
    }
    return "0";
  }

  async getTotalRevenue(): Promise<string> {
    if (await this.totalRevenueCard.isVisible()) {
      return await this.totalRevenueCard.textContent() ?? "R$ 0,00";
    }
    return "R$ 0,00";
  }

  async getTotalOrders(): Promise<string> {
    if (await this.totalOrdersCard.isVisible()) {
      return await this.totalOrdersCard.textContent() ?? "0";
    }
    return "0";
  }

  async getConversionRate(): Promise<string> {
    if (await this.conversionRateCard.isVisible()) {
      return await this.conversionRateCard.textContent() ?? "0%";
    }
    return "0%";
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isLoading(): Promise<boolean> {
    const spinnerVisible = await this.loadingSpinner.isVisible().catch(() => false);
    const skeletonVisible = await this.skeletonLoader.isVisible().catch(() => false);
    return spinnerVisible || skeletonVisible;
  }

  async hasRecentOrders(): Promise<boolean> {
    return await this.recentOrdersList.isVisible();
  }

  async getRecentOrdersCount(): Promise<number> {
    if (await this.hasRecentOrders()) {
      return await this.recentOrderItem.count();
    }
    return 0;
  }

  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async isStatsVisible(): Promise<boolean> {
    const salesVisible = await this.totalSalesCard.isVisible().catch(() => false);
    const revenueVisible = await this.totalRevenueCard.isVisible().catch(() => false);
    return salesVisible || revenueVisible;
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForDashboardReady(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    // Wait for either stats or empty state to appear
    await Promise.race([
      this.totalSalesCard.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad }).catch(() => {}),
      this.emptyState.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad }).catch(() => {}),
    ]);
  }

  async waitForStatsLoad(): Promise<void> {
    await this.totalSalesCard.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }
}
