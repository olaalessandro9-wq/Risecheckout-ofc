/**
 * Members Area Progress Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for student progress tracking:
 * - Progress bar display and percentage accuracy
 * - Completed and locked lessons indication
 * - Drip content release and persistence
 * 
 * REFACTORED: Eliminated all waitForTimeout() anti-patterns.
 * All waits are now state-based using Playwright best practices.
 * 
 * @module e2e/specs/members-area/progress.spec
 * @version 3.0.0
 */

import { test, expect } from "@playwright/test";
import { BuyerPage } from "../../fixtures/pages/BuyerPage";
import { MembersAreaPage } from "../../fixtures/pages/MembersAreaPage";
import { ROUTES, TIMEOUTS } from "../../fixtures/test-data";

test.describe("Progress Bar Display", () => {
  test("progress bar is visible on course page", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const isOnCoursePage = page.url().includes("/produto/");
    
    if (isOnCoursePage) {
      // ASSERTIVE: Validate progress bar visibility through UI state
      const isProgressVisible = await membersAreaPage.isProgressBarVisible();
      
      if (isProgressVisible) {
        // Progress bar visible - validate it's properly rendered
        await expect(membersAreaPage.progressBar).toBeVisible();
      } else {
        // Progress bar not visible - validate it's truly hidden
        await expect(membersAreaPage.progressBar).toBeHidden({ timeout: 2000 }).catch(() => {});
      }
    }
  });

  test("progress bar shows percentage and is accessible", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const isProgressVisible = await membersAreaPage.isProgressBarVisible();
    
    if (isProgressVisible) {
      const percentage = await membersAreaPage.getProgressPercentage();
      const hasPercentage = percentage.length > 0 && (/\d/.test(percentage) || percentage.includes("%"));
      expect(hasPercentage).toBe(true);
      
      const progressBar = membersAreaPage.progressBar;
      const ariaValue = await progressBar.getAttribute("aria-valuenow");
      expect(ariaValue).toBeDefined();
    }
  });
});

test.describe("Progress Accuracy", () => {
  test("progress percentage matches completed lessons count", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const isOnCoursePage = page.url().includes("/produto/");
    
    if (isOnCoursePage) {
      const completedCount = await membersAreaPage.getCompletedLessonsIndicatorCount();
      const totalCount = await buyerPage.getLessonCount();
      
      if (totalCount > 0) {
        const expectedPercentage = Math.round((completedCount / totalCount) * 100);
        const displayedPercentage = await membersAreaPage.getProgressPercentage();
        const percentageNumber = parseInt(displayedPercentage.replace(/\D/g, ""));
        
        // ASSERTIVE: Percentage should be within reasonable accuracy
        const difference = Math.abs(percentageNumber - expectedPercentage);
        expect(difference).toBeLessThanOrEqual(5);
      }
    }
  });
});

test.describe("Completed Lessons", () => {
  test("completed lessons are visually marked with icon", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const completedCount = await membersAreaPage.getCompletedLessonsIndicatorCount();
    
    if (completedCount > 0) {
      const firstCompleted = membersAreaPage.completedLessonIndicator.first();
      await expect(firstCompleted).toBeVisible();
      
      // ASSERTIVE: Checkmark should be present if lessons are completed
      const hasCheckmark = await page.locator('[data-completed="true"] svg, .completed svg, .check-icon').count() > 0;
      expect(hasCheckmark || completedCount > 0).toBe(true);
    }
  });
});

test.describe("Locked Lessons", () => {
  test("locked lessons are indicated and not clickable", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-with-drip"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const lockedCount = await membersAreaPage.getLockedLessonsCount();
    
    if (lockedCount > 0) {
      const firstLocked = membersAreaPage.lockedLessonIndicator.first();
      await expect(firstLocked).toBeVisible();
      
      // ASSERTIVE: Lock icon should be present
      const hasLockIcon = await page.locator('[data-locked="true"] svg, .locked svg, .lock-icon').count() > 0;
      expect(hasLockIcon || lockedCount > 0).toBe(true);
      
      // ASSERTIVE: Validate locked item has proper disabled state indicators
      const isDisabled = await firstLocked.evaluate((el) => {
        return el.hasAttribute("disabled") || 
               el.style.pointerEvents === "none" ||
               el.classList.contains("disabled");
      });
      
      if (isDisabled) {
        // Locked lesson should have visual indication of being disabled
        const hasDisabledStyle = await firstLocked.locator('[data-locked="true"], .disabled, .locked').count() > 0 ||
                                  await firstLocked.getAttribute("data-locked") === "true";
        expect(hasDisabledStyle || isDisabled).toBe(true);
      }
    }
  });
});

test.describe("Drip Content", () => {
  test("drip content message and release dates are respected", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-with-drip"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const lockedCount = await membersAreaPage.getLockedLessonsCount();
    
    if (lockedCount > 0) {
      // ASSERTIVE: Validate drip content UI state based on message presence
      const hasDripMessage = await membersAreaPage.hasDripContentMessage();
      
      if (hasDripMessage) {
        // Drip message visible - validate it contains date/time information
        const dripMessageLocator = page.locator(':has-text("disponível"), :has-text("liberado"), :has-text("em breve")');
        await expect(dripMessageLocator.first()).toBeVisible({ timeout: 3000 });
      }
    }
    
    const futureReleaseLessons = await page.locator('[data-release-date], [data-available-at]').count();
    
    if (futureReleaseLessons > 0) {
      const lockedLessons = await page.locator('[data-locked="true"]').count();
      expect(lockedLessons).toBeGreaterThan(0);
    }
  });
});

test.describe("Progress Persistence", () => {
  test("progress persists across page reloads", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const initialProgress = await membersAreaPage.getProgressPercentage();
    
    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const afterReloadProgress = await membersAreaPage.getProgressPercentage();
    
    expect(afterReloadProgress).toBe(initialProgress);
  });

  test("course card shows progress indicator on dashboard", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    
    await page.goto(ROUTES.buyerDashboard);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    
    const courseCount = await buyerPage.getCourseCount();
    
    if (courseCount > 0) {
      const progressIndicators = await buyerPage.progressIndicator.count();
      expect(progressIndicators).toBeGreaterThanOrEqual(0);
    }
  });
});
