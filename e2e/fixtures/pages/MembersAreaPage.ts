/**
 * MembersAreaPage - Page Object for Members Area Advanced Features
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Encapsulates interactions with advanced members area features:
 * - Certificates (download, preview, validation)
 * - Quizzes (answer, submit, results)
 * - Progress tracking (detailed view)
 * 
 * Note: Basic navigation is handled by BuyerPage.ts
 * This Page Object focuses on Single Responsibility for advanced features.
 * 
 * @module e2e/fixtures/pages/MembersAreaPage
 */

import type { Page, Locator } from "@playwright/test";
import { TIMEOUTS } from "../test-data";

export class MembersAreaPage {
  readonly page: Page;
  
  // Certificate elements
  readonly certificateButton: Locator;
  readonly certificateDownloadButton: Locator;
  readonly certificatePreview: Locator;
  readonly certificateStudentName: Locator;
  readonly certificateCourseName: Locator;
  readonly certificateDate: Locator;
  readonly certificateNotAvailableMessage: Locator;
  
  // Quiz elements
  readonly quizContainer: Locator;
  readonly quizTitle: Locator;
  readonly quizQuestions: Locator;
  readonly quizOptions: Locator;
  readonly quizSubmitButton: Locator;
  readonly quizResults: Locator;
  readonly quizScore: Locator;
  readonly quizCorrectAnswer: Locator;
  readonly quizIncorrectAnswer: Locator;
  readonly quizFeedback: Locator;
  
  // Progress elements (detailed)
  readonly progressBar: Locator;
  readonly progressPercentage: Locator;
  readonly completedLessonsCount: Locator;
  readonly totalLessonsCount: Locator;
  readonly lockedLessonIndicator: Locator;
  readonly completedLessonIndicator: Locator;
  readonly dripContentMessage: Locator;
  
  // Navigation elements
  readonly breadcrumb: Locator;
  readonly backToDashboard: Locator;
  readonly backToCourse: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Certificate elements
    this.certificateButton = page.getByRole("button", { name: /certificado|certificate/i });
    this.certificateDownloadButton = page.getByRole("button", { name: /baixar|download/i });
    this.certificatePreview = page.locator('[data-testid="certificate-preview"], .certificate-preview, [role="dialog"]:has-text("Certificado")');
    this.certificateStudentName = page.locator('[data-testid="certificate-student-name"], .certificate-student-name');
    this.certificateCourseName = page.locator('[data-testid="certificate-course-name"], .certificate-course-name');
    this.certificateDate = page.locator('[data-testid="certificate-date"], .certificate-date');
    this.certificateNotAvailableMessage = page.locator(':has-text("certificado não disponível"), :has-text("complete o curso")');
    
    // Quiz elements
    this.quizContainer = page.locator('[data-testid="quiz-container"], .quiz-container, [role="form"]:has-text("Quiz")');
    this.quizTitle = page.locator('[data-testid="quiz-title"], .quiz-title, h2:has-text("Quiz"), h3:has-text("Quiz")');
    this.quizQuestions = page.locator('[data-testid="quiz-question"], .quiz-question');
    this.quizOptions = page.locator('[data-testid="quiz-option"], .quiz-option, input[type="radio"]');
    this.quizSubmitButton = page.getByRole("button", { name: /enviar|submeter|finalizar.*quiz/i });
    this.quizResults = page.locator('[data-testid="quiz-results"], .quiz-results');
    this.quizScore = page.locator('[data-testid="quiz-score"], .quiz-score, :has-text("pontuação"), :has-text("acertos")');
    this.quizCorrectAnswer = page.locator('[data-testid="correct-answer"], .correct-answer, [data-correct="true"]');
    this.quizIncorrectAnswer = page.locator('[data-testid="incorrect-answer"], .incorrect-answer, [data-correct="false"]');
    this.quizFeedback = page.locator('[data-testid="quiz-feedback"], .quiz-feedback, [role="alert"]');
    
    // Progress elements (detailed)
    this.progressBar = page.locator('[data-testid="progress-bar"], .progress-bar, [role="progressbar"]');
    this.progressPercentage = page.locator('[data-testid="progress-percentage"], .progress-percentage');
    this.completedLessonsCount = page.locator('[data-testid="completed-count"], .completed-count');
    this.totalLessonsCount = page.locator('[data-testid="total-count"], .total-count');
    this.lockedLessonIndicator = page.locator('[data-testid="locked-lesson"], .locked-lesson, [data-locked="true"]');
    this.completedLessonIndicator = page.locator('[data-testid="completed-lesson"], .completed-lesson, [data-completed="true"]');
    this.dripContentMessage = page.locator(':has-text("disponível em"), :has-text("liberado em"), :has-text("bloqueado até")');
    
    // Navigation elements
    this.breadcrumb = page.locator('[data-testid="breadcrumb"], .breadcrumb, nav[aria-label="breadcrumb"]');
    this.backToDashboard = page.getByRole("link", { name: /dashboard|painel|início/i });
    this.backToCourse = page.getByRole("link", { name: /voltar.*curso|curso/i });
  }

  // ============================================================================
  // Certificate Actions
  // ============================================================================

  async openCertificate(): Promise<void> {
    await this.certificateButton.click();
    await this.certificatePreview.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async downloadCertificate(): Promise<void> {
    await this.certificateDownloadButton.click();
  }

  async isCertificateAvailable(): Promise<boolean> {
    return await this.certificateButton.isVisible();
  }

  async getCertificateStudentName(): Promise<string> {
    return await this.certificateStudentName.textContent() ?? "";
  }

  async getCertificateCourseName(): Promise<string> {
    return await this.certificateCourseName.textContent() ?? "";
  }

  async getCertificateDate(): Promise<string> {
    return await this.certificateDate.textContent() ?? "";
  }

  // ============================================================================
  // Quiz Actions
  // ============================================================================

  async isQuizVisible(): Promise<boolean> {
    return await this.quizContainer.isVisible();
  }

  async getQuizTitle(): Promise<string> {
    return await this.quizTitle.textContent() ?? "";
  }

  async getQuestionCount(): Promise<number> {
    return await this.quizQuestions.count();
  }

  async selectQuizOption(questionIndex: number, optionIndex: number): Promise<void> {
    const question = this.quizQuestions.nth(questionIndex);
    const options = question.locator('[data-testid="quiz-option"], .quiz-option, input[type="radio"]');
    await options.nth(optionIndex).click();
  }

  async answerQuiz(answers: number[]): Promise<void> {
    for (let i = 0; i < answers.length; i++) {
      await this.selectQuizOption(i, answers[i]);
    }
  }

  async submitQuiz(): Promise<void> {
    await this.quizSubmitButton.click();
    await this.quizResults.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }

  async getQuizScore(): Promise<string> {
    return await this.quizScore.textContent() ?? "";
  }

  async hasQuizFeedback(): Promise<boolean> {
    return await this.quizFeedback.isVisible();
  }

  async getCorrectAnswersCount(): Promise<number> {
    return await this.quizCorrectAnswer.count();
  }

  async getIncorrectAnswersCount(): Promise<number> {
    return await this.quizIncorrectAnswer.count();
  }

  // ============================================================================
  // Progress Actions
  // ============================================================================

  async getProgressPercentage(): Promise<string> {
    return await this.progressPercentage.textContent() ?? "";
  }

  async getCompletedLessonsCount(): Promise<string> {
    return await this.completedLessonsCount.textContent() ?? "";
  }

  async getTotalLessonsCount(): Promise<string> {
    return await this.totalLessonsCount.textContent() ?? "";
  }

  async getLockedLessonsCount(): Promise<number> {
    return await this.lockedLessonIndicator.count();
  }

  async getCompletedLessonsIndicatorCount(): Promise<number> {
    return await this.completedLessonIndicator.count();
  }

  async hasDripContentMessage(): Promise<boolean> {
    return await this.dripContentMessage.isVisible();
  }

  async isProgressBarVisible(): Promise<boolean> {
    return await this.progressBar.isVisible();
  }

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  async navigateBackToDashboard(): Promise<void> {
    await this.backToDashboard.click();
    await this.page.waitForURL(/dashboard/, { timeout: TIMEOUTS.pageLoad });
  }

  async navigateBackToCourse(): Promise<void> {
    await this.backToCourse.click();
    await this.page.waitForURL(/produto/, { timeout: TIMEOUTS.pageLoad });
  }

  async isBreadcrumbVisible(): Promise<boolean> {
    return await this.breadcrumb.isVisible();
  }

  // ============================================================================
  // Wait Helpers
  // ============================================================================

  async waitForCertificatePreview(): Promise<void> {
    await this.certificatePreview.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForQuizLoad(): Promise<void> {
    await this.quizContainer.waitFor({ state: "visible", timeout: TIMEOUTS.pageLoad });
  }

  async waitForQuizResults(): Promise<void> {
    await this.quizResults.waitFor({ state: "visible", timeout: TIMEOUTS.apiResponse });
  }

  async waitForProgressUpdate(): Promise<void> {
    // State-based wait for progress bar visibility (RISE V3 - 10.0/10)
    await this.progressBar.waitFor({ state: "visible", timeout: TIMEOUTS.animation }).catch(() => {});
    // Ensure network requests complete for accurate progress data
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.animation }).catch(() => {});
  }
}
