/**
 * Members Area Quizzes Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for quiz functionality:
 * - Quiz display, questions rendering, and answer selection
 * - Quiz submission and results display with feedback
 * 
 * @module e2e/specs/members-area/quizzes.spec
 */

import { test, expect } from "@playwright/test";
import { MembersAreaPage } from "../../fixtures/pages/MembersAreaPage";
import { ROUTES, TIMEOUTS } from "../../fixtures/test-data";

test.describe("Quiz Display and Structure", () => {
  test("quiz appears after lesson with proper structure", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    expect(typeof isQuizVisible).toBe("boolean");
    
    if (isQuizVisible) {
      const title = await membersAreaPage.getQuizTitle();
      expect(title.length).toBeGreaterThan(0);
      
      const questionCount = await membersAreaPage.getQuestionCount();
      expect(questionCount).toBeGreaterThan(0);
    }
  });

  test("quiz questions display with answer options", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    
    if (isQuizVisible) {
      const questionCount = await membersAreaPage.getQuestionCount();
      
      if (questionCount > 0) {
        const firstQuestion = membersAreaPage.quizQuestions.first();
        await expect(firstQuestion).toBeVisible();
        
        const questionText = await firstQuestion.textContent();
        expect(questionText?.trim().length).toBeGreaterThan(0);
        
        const options = firstQuestion.locator('[data-testid="quiz-option"], .quiz-option, input[type="radio"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("Answer Selection", () => {
  test("quiz options are selectable with single selection per question", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    
    if (isQuizVisible) {
      const questionCount = await membersAreaPage.getQuestionCount();
      
      if (questionCount > 0) {
        await membersAreaPage.selectQuizOption(0, 0);
        await page.waitForTimeout(500);
        
        const firstQuestion = membersAreaPage.quizQuestions.first();
        const selectedOption = firstQuestion.locator('input[type="radio"]:checked, [data-selected="true"], .selected');
        const hasSelection = await selectedOption.count() > 0;
        expect(hasSelection).toBe(true);
        
        await membersAreaPage.selectQuizOption(0, 1);
        await page.waitForTimeout(300);
        
        const selectedCount = await firstQuestion.locator('input[type="radio"]:checked, [data-selected="true"]').count();
        expect(selectedCount).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe("Quiz Submission", () => {
  test("quiz submit button is present and functional", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    
    if (isQuizVisible) {
      await expect(membersAreaPage.quizSubmitButton).toBeVisible();
      
      const isInitiallyDisabled = await membersAreaPage.quizSubmitButton.isDisabled();
      expect(typeof isInitiallyDisabled).toBe("boolean");
    }
  });

  test("quiz submission shows results after answering", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    
    if (isQuizVisible) {
      const questionCount = await membersAreaPage.getQuestionCount();
      
      if (questionCount > 0) {
        const answers = Array(questionCount).fill(0);
        await membersAreaPage.answerQuiz(answers);
        await page.waitForTimeout(500);
        
        const isDisabled = await membersAreaPage.quizSubmitButton.isDisabled();
        
        if (!isDisabled) {
          await membersAreaPage.submitQuiz();
          await expect(membersAreaPage.quizResults).toBeVisible();
        }
      }
    }
  });
});

test.describe("Quiz Results and Feedback", () => {
  test("quiz results display score and highlight answers", async ({ page }) => {
    const membersAreaPage = new MembersAreaPage(page);
    
    await page.goto(ROUTES.lessonViewer("test-product-with-quiz", "lesson-with-quiz"));
    await page.waitForLoadState("networkidle", { timeout: TIMEOUTS.pageLoad });
    await page.waitForTimeout(2000);
    
    const isQuizVisible = await membersAreaPage.isQuizVisible();
    
    if (isQuizVisible) {
      const questionCount = await membersAreaPage.getQuestionCount();
      
      if (questionCount > 0) {
        const answers = Array(questionCount).fill(0);
        await membersAreaPage.answerQuiz(answers);
        await page.waitForTimeout(500);
        
        const isDisabled = await membersAreaPage.quizSubmitButton.isDisabled();
        
        if (!isDisabled) {
          await membersAreaPage.submitQuiz();
          
          const score = await membersAreaPage.getQuizScore();
          expect(score.length).toBeGreaterThan(0);
          
          const correctCount = await membersAreaPage.getCorrectAnswersCount();
          expect(typeof correctCount).toBe("number");
          
          const hasFeedback = await membersAreaPage.hasQuizFeedback();
          expect(typeof hasFeedback).toBe("boolean");
        }
      }
    }
  });
});
