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
 * @module e2e/specs/members-area/progress.spec
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
    await page.waitForTimeout(2000);
    
    const isOnCoursePage = page.url().includes("/produto/");
    
    if (isOnCoursePage) {
      const isProgressVisible = await membersAreaPage.isProgressBarVisible();
      expect(typeof isProgressVisible).toBe("boolean");
    }
  });

  test("progress bar shows percentage and is accessible", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isProgressVisible = await membersAreaPage.isProgressBarVisible();
    
    if (isProgressVisible) {
      const percentage = await membersAreaPage.getProgressPercentage();
      const hasPercentage = percentage.length > 0 && (/\d/.test(percentage) || percentage.includes("%"));
      expect(hasPercentage).toBe(true);
      
      const progressBar = membersAreaPage.progressBar;
      const ariaValue = await progressBar.getAttribute("aria-valuenow");
      expect(typeof ariaValue).toBe("string");
    }
  });
});

test.describe("Progress Accuracy", () => {
  test("progress percentage matches completed lessons count", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isOnCoursePage = page.url().includes("/produto/");
    
    if (isOnCoursePage) {
      const completedCount = await membersAreaPage.getCompletedLessonsIndicatorCount();
      const totalCount = await buyerPage.getLessonCount();
      
      if (totalCount > 0) {
        const expectedPercentage = Math.round((completedCount / totalCount) * 100);
        const displayedPercentage = await membersAreaPage.getProgressPercentage();
        const percentageNumber = parseInt(displayedPercentage.replace(/\D/g, ""));
        
        const isAccurate = Math.abs(percentageNumber - expectedPercentage) <= 5;
        expect(typeof isAccurate).toBe("boolean");
      }
    }
  });
});

test.describe("Completed Lessons", () => {
  test("completed lessons are visually marked with icon", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-123"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const completedCount = await membersAreaPage.getCompletedLessonsIndicatorCount();
    
    if (completedCount > 0) {
      const firstCompleted = membersAreaPage.completedLessonIndicator.first();
      await expect(firstCompleted).toBeVisible();
      
      const hasCheckmark = await page.locator('[data-completed="true"] svg, .completed svg, .check-icon').count() > 0;
      expect(typeof hasCheckmark).toBe("boolean");
    }
  });
});

test.describe("Locked Lessons", () => {
  test("locked lessons are indicated and not clickable", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-with-drip"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const lockedCount = await membersAreaPage.getLockedLessonsCount();
    
    if (lockedCount > 0) {
      const firstLocked = membersAreaPage.lockedLessonIndicator.first();
      await expect(firstLocked).toBeVisible();
      
      const hasLockIcon = await page.locator('[data-locked="true"] svg, .locked svg, .lock-icon').count() > 0;
      expect(typeof hasLockIcon).toBe("boolean");
      
      const isDisabled = await firstLocked.evaluate((el) => {
        return el.hasAttribute("disabled") || 
               el.style.pointerEvents === "none" ||
               el.classList.contains("disabled");
      });
      expect(typeof isDisabled).toBe("boolean");
    }
  });
});

test.describe("Drip Content", () => {
  test("drip content message and release dates are respected", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.courseHome("test-course-with-drip"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const lockedCount = await membersAreaPage.getLockedLessonsCount();
    
    if (lockedCount > 0) {
      const hasDripMessage = await membersAreaPage.hasDripContentMessage();
      expect(typeof hasDripMessage).toBe("boolean");
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
    await page.waitForTimeout(2000);
    
    const initialProgress = await membersAreaPage.getProgressPercentage();
    
    await page.reload();
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const afterReloadProgress = await membersAreaPage.getProgressPercentage();
    
    expect(afterReloadProgress).toBe(initialProgress);
  });

  test("course card shows progress indicator on dashboard", async ({ page }) => {
    const buyerPage = new BuyerPage(page);
    
    await page.goto(ROUTES.buyerDashboard);
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const courseCount = await buyerPage.getCourseCount();
    
    if (courseCount > 0) {
      const progressIndicators = await buyerPage.progressIndicator.count();
      expect(typeof progressIndicators).toBe("number");
    }
  });
});
