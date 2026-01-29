/**
 * LandingPage - Page Object for /
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the landing page.
 * Follows Page Object Pattern for maintainability and reusability.
 * 
 * @module e2e/fixtures/pages/LandingPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class LandingPage {
  readonly page: Page;
  
  // Hero section
  readonly heroSection: Locator;
  readonly heroCta: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  
  // Navigation
  readonly header: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly logo: Locator;
  
  // Sections
  readonly featuresSection: Locator;
  readonly pricingSection: Locator;
  readonly testimonialsSection: Locator;
  readonly faqSection: Locator;
  readonly footer: Locator;
  
  // CTAs throughout page
  readonly ctaButtons: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Hero section
    this.heroSection = page.locator('[data-testid="landing-hero"], section:has(h1)').first();
    this.heroCta = page.getByRole("link", { name: /começar|criar.*conta|experimente/i }).first();
    this.heroTitle = page.locator("h1").first();
    this.heroSubtitle = page.locator("h1 + p, h1 ~ p").first();
    
    // Navigation
    this.header = page.locator("header, nav").first();
    this.loginButton = page.getByRole("link", { name: /entrar|login/i });
    this.registerButton = page.getByRole("link", { name: /cadastr|criar.*conta|começar/i }).first();
    this.logo = page.locator('[data-testid="logo"], header img, header svg').first();
    
    // Sections - use flexible selectors
    this.featuresSection = page.locator('[data-testid="features"], section:has-text("recursos"), section:has-text("funcionalidades")');
    this.pricingSection = page.locator('[data-testid="pricing"], section:has-text("preços"), section:has-text("planos")');
    this.testimonialsSection = page.locator('[data-testid="testimonials"], section:has-text("depoimentos"), section:has-text("clientes")');
    this.faqSection = page.locator('[data-testid="faq"], section:has-text("perguntas"), section:has-text("FAQ")');
    this.footer = page.locator("footer");
    
    // All CTAs
    this.ctaButtons = page.getByRole("link", { name: /começar|criar.*conta|experimente|cadastr/i });
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigate(): Promise<void> {
    await this.page.goto(ROUTES.landing);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
    await this.page.waitForURL(/auth/);
  }

  async clickRegister(): Promise<void> {
    await this.registerButton.click();
    await this.page.waitForURL(/cadastro|auth/);
  }

  async clickHeroCta(): Promise<void> {
    await this.heroCta.click();
  }

  // ============================================================================
  // Scroll Actions
  // ============================================================================

  async scrollToFeatures(): Promise<void> {
    await this.featuresSection.scrollIntoViewIfNeeded();
  }

  async scrollToPricing(): Promise<void> {
    await this.pricingSection.scrollIntoViewIfNeeded();
  }

  async scrollToFaq(): Promise<void> {
    await this.faqSection.scrollIntoViewIfNeeded();
  }

  async scrollToFooter(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded();
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isHeroVisible(): Promise<boolean> {
    return await this.heroSection.isVisible();
  }

  async isHeaderVisible(): Promise<boolean> {
    return await this.header.isVisible();
  }

  async isFooterVisible(): Promise<boolean> {
    return await this.footer.isVisible();
  }

  async getHeroTitle(): Promise<string> {
    return await this.heroTitle.textContent() ?? "";
  }

  async getCtaCount(): Promise<number> {
    return await this.ctaButtons.count();
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForPageReady(): Promise<void> {
    await this.heroSection.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.header.waitFor({ state: "visible" });
  }

  async waitForFullLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    // Ensure critical sections are rendered
    await this.heroSection.waitFor({ state: "visible" });
  }
}
