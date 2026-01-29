/**
 * BuyerPage - Page Object for /minha-conta
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates all interactions with the buyer area pages.
 * Includes login, dashboard, course viewing, and progress tracking.
 * 
 * @module e2e/fixtures/pages/BuyerPage
 */

import type { Page, Locator } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../test-data";

export class BuyerPage {
  readonly page: Page;
  
  // Login form
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  
  // Dashboard
  readonly courseList: Locator;
  readonly courseCards: Locator;
  readonly welcomeMessage: Locator;
  readonly progressOverview: Locator;
  
  // Course viewer
  readonly moduleAccordion: Locator;
  readonly moduleItems: Locator;
  readonly lessonItems: Locator;
  readonly lessonContent: Locator;
  readonly videoPlayer: Locator;
  
  // Progress
  readonly progressIndicator: Locator;
  readonly completedLessons: Locator;
  readonly markCompleteButton: Locator;
  
  // Navigation
  readonly backButton: Locator;
  readonly nextLessonButton: Locator;
  readonly prevLessonButton: Locator;
  
  // Feedback
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Login form
    this.loginForm = page.locator('[data-testid="buyer-login-form"], form').first();
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole("button", { name: /entrar|acessar|login/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /esquec|recuperar/i });
    
    // Dashboard
    this.courseList = page.locator('[data-testid="course-list"], .course-list');
    this.courseCards = page.locator('[data-testid="course-card"], .course-card');
    this.welcomeMessage = page.locator('[data-testid="welcome"], .welcome-message, h1:has-text("Bem-vindo")');
    this.progressOverview = page.locator('[data-testid="progress-overview"], .progress-overview');
    
    // Course viewer
    this.moduleAccordion = page.locator('[data-testid="module-accordion"], .module-accordion');
    this.moduleItems = page.locator('[data-testid="module-item"], .module-item');
    this.lessonItems = page.locator('[data-testid="lesson-item"], .lesson-item');
    this.lessonContent = page.locator('[data-testid="lesson-content"], .lesson-content');
    this.videoPlayer = page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    
    // Progress
    this.progressIndicator = page.locator('[data-testid="progress"], .progress-bar, [role="progressbar"]');
    this.completedLessons = page.locator('[data-completed="true"], .completed');
    this.markCompleteButton = page.getByRole("button", { name: /concluir|marcar.*completo|finalizar/i });
    
    // Navigation
    this.backButton = page.getByRole("button", { name: /voltar|back/i });
    this.nextLessonButton = page.getByRole("button", { name: /próxim|next/i });
    this.prevLessonButton = page.getByRole("button", { name: /anterior|prev/i });
    
    // Feedback
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.loadingSpinner = page.locator('.animate-spin');
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigateToLogin(): Promise<void> {
    await this.page.goto(ROUTES.buyerLogin);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToDashboard(): Promise<void> {
    await this.page.goto(ROUTES.buyerDashboard);
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  async navigateToSetupAccess(token: string): Promise<void> {
    await this.page.goto(ROUTES.setupAccess(token));
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
  }

  // ============================================================================
  // Login Actions
  // ============================================================================

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // ============================================================================
  // Course Actions
  // ============================================================================

  async getCourseCount(): Promise<number> {
    return await this.courseCards.count();
  }

  async selectCourse(index: number): Promise<void> {
    await this.courseCards.nth(index).click();
  }

  async getModuleCount(): Promise<number> {
    return await this.moduleItems.count();
  }

  async expandModule(index: number): Promise<void> {
    await this.moduleItems.nth(index).click();
  }

  async getLessonCount(): Promise<number> {
    return await this.lessonItems.count();
  }

  async selectLesson(index: number): Promise<void> {
    await this.lessonItems.nth(index).click();
  }

  // ============================================================================
  // Progress Actions
  // ============================================================================

  async markLessonComplete(): Promise<void> {
    await this.markCompleteButton.click();
  }

  async getCompletedCount(): Promise<number> {
    return await this.completedLessons.count();
  }

  async goToNextLesson(): Promise<void> {
    await this.nextLessonButton.click();
  }

  async goToPrevLesson(): Promise<void> {
    await this.prevLessonButton.click();
  }

  // ============================================================================
  // State Checks
  // ============================================================================

  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.welcomeMessage.isVisible() || await this.courseList.isVisible();
  }

  async hasVideoContent(): Promise<boolean> {
    return await this.videoPlayer.isVisible();
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForLoginReady(): Promise<void> {
    await this.emailInput.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
    await this.passwordInput.waitFor({ state: "visible" });
  }

  async waitForDashboard(): Promise<void> {
    await this.courseList.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForLoginComplete(): Promise<void> {
    await this.page.waitForURL(/dashboard|minha-conta/, { timeout: TIMEOUTS.formSubmit });
  }

  async waitForCourseLoad(): Promise<void> {
    await this.moduleAccordion.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForLessonLoad(): Promise<void> {
    await this.lessonContent.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }
}
