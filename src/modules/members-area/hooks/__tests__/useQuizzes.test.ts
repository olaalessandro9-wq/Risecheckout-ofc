/**
 * useQuizzes Hook Tests
 * 
 * RISE V3 Compliant - 10.0/10
 * Tests quiz CRUD, questions, and student attempts
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizzes } from "../useQuizzes";
import { quizzesService } from "../../services/quizzes.service";
import type { QuizWithQuestions, QuizResult, QuizAttempt, QuizAttemptAnswer } from "../../types";

// Mock dependencies
vi.mock("../../services/quizzes.service", () => ({
  quizzesService: {
    get: vi.fn(),
    create: vi.fn(),
    addQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    submit: vi.fn(),
    getAttempts: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test factories
function createMockQuiz(): QuizWithQuestions {
  return {
    id: "quiz-1",
    content_id: "content-1",
    title: "Module 1 Quiz",
    description: "Test your knowledge",
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: null,
    shuffle_questions: false,
    show_correct_answers: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: "q-1",
        quiz_id: "quiz-1",
        question_text: "What is 2+2?",
        question_type: "multiple_choice",
        points: 10,
        position: 0,
        explanation: "Basic math",
        created_at: new Date().toISOString(),
        answers: [
          { id: "a-1", question_id: "q-1", answer_text: "3", is_correct: false, position: 0 },
          { id: "a-2", question_id: "q-1", answer_text: "4", is_correct: true, position: 1 },
          { id: "a-3", question_id: "q-1", answer_text: "5", is_correct: false, position: 2 },
        ],
      },
    ],
  };
}

function createMockResult(passed: boolean = true): QuizResult {
  return {
    attempt_id: "attempt-1",
    quiz_id: "quiz-1",
    quiz_title: "Module 1 Quiz",
    score: passed ? 80 : 50,
    total_points: 100,
    score_percent: passed ? 80 : 50,
    passed,
    passing_score: 70,
    time_spent_seconds: 120,
    correct_answers: passed ? 8 : 5,
    total_questions: 10,
    completed_at: new Date().toISOString(),
  };
}

function createMockAttempt(): QuizAttempt {
  const answers: QuizAttemptAnswer[] = [
    { question_id: "q-1", selected_answer_ids: ["a-2"], is_correct: true, points_earned: 10 },
  ];
  return {
    id: "attempt-1",
    quiz_id: "quiz-1",
    buyer_id: "buyer-1",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    score: 80,
    total_points: 100,
    passed: true,
    time_spent_seconds: 120,
    answers,
  };
}

describe("useQuizzes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should start with null quiz and empty attempts", () => {
      const { result } = renderHook(() => useQuizzes());

      expect(result.current.currentQuiz).toBeNull();
      expect(result.current.attempts).toEqual([]);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe("fetchQuiz", () => {
    it("should fetch quiz and set currentQuiz", async () => {
      const mockQuiz = createMockQuiz();
      (quizzesService.get as Mock).mockResolvedValueOnce({
        data: mockQuiz,
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let fetched: QuizWithQuestions | null = null;
      await act(async () => {
        fetched = await result.current.fetchQuiz("quiz-1");
      });

      expect(fetched).toEqual(mockQuiz);
      expect(result.current.currentQuiz).toEqual(mockQuiz);
    });

    it("should return null on fetch error", async () => {
      (quizzesService.get as Mock).mockResolvedValueOnce({
        data: null,
        error: "Not found",
      });

      const { result } = renderHook(() => useQuizzes());

      let fetched: QuizWithQuestions | null = null;
      await act(async () => {
        fetched = await result.current.fetchQuiz("quiz-1");
      });

      expect(fetched).toBeNull();
    });
  });

  describe("createQuiz", () => {
    it("should create quiz and return ID", async () => {
      (quizzesService.create as Mock).mockResolvedValueOnce({
        data: { id: "new-quiz-id" },
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let quizId: string | null = null;
      await act(async () => {
        quizId = await result.current.createQuiz({
          content_id: "content-1",
          title: "New Quiz",
        });
      });

      expect(quizId).toBe("new-quiz-id");
    });

    it("should return null on create error", async () => {
      (quizzesService.create as Mock).mockResolvedValueOnce({
        data: null,
        error: "Create failed",
      });

      const { result } = renderHook(() => useQuizzes());

      let quizId: string | null = null;
      await act(async () => {
        quizId = await result.current.createQuiz({
          content_id: "content-1",
          title: "New Quiz",
        });
      });

      expect(quizId).toBeNull();
    });
  });

  describe("addQuestion", () => {
    it("should add question successfully", async () => {
      (quizzesService.addQuestion as Mock).mockResolvedValueOnce({
        data: { question_id: "q-new" },
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.addQuestion({
          quiz_id: "quiz-1",
          question_text: "New question?",
          question_type: "multiple_choice",
          answers: [
            { answer_text: "A", is_correct: true },
            { answer_text: "B", is_correct: false },
          ],
          points: 10,
        });
      });

      expect(success).toBe(true);
    });
  });

  describe("deleteQuestion", () => {
    it("should delete question successfully", async () => {
      (quizzesService.deleteQuestion as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteQuestion("q-1");
      });

      expect(success).toBe(true);
    });
  });

  describe("submitQuiz", () => {
    it("should submit quiz and set lastResult when passed", async () => {
      const mockResult = createMockResult(true);
      (quizzesService.submit as Mock).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let quizResult: QuizResult | null = null;
      await act(async () => {
        quizResult = await result.current.submitQuiz("buyer-1", {
          quiz_id: "quiz-1",
          answers: [{ question_id: "q-1", selected_answer_ids: ["a-2"] }],
          time_spent_seconds: 120,
        });
      });

      expect(quizResult).toEqual(mockResult);
      expect(result.current.lastResult).toEqual(mockResult);
    });

    it("should handle failed quiz submission", async () => {
      const mockResult = createMockResult(false);
      (quizzesService.submit as Mock).mockResolvedValueOnce({
        data: mockResult,
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      let quizResult: QuizResult | null = null;
      await act(async () => {
        quizResult = await result.current.submitQuiz("buyer-1", {
          quiz_id: "quiz-1",
          answers: [],
          time_spent_seconds: 60,
        });
      });

      expect(quizResult?.passed).toBe(false);
    });
  });

  describe("fetchAttempts", () => {
    it("should fetch and set attempts", async () => {
      const mockAttempts: QuizAttempt[] = [createMockAttempt()];

      (quizzesService.getAttempts as Mock).mockResolvedValueOnce({
        data: mockAttempts,
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.fetchAttempts("quiz-1", "buyer-1");
      });

      expect(result.current.attempts).toEqual(mockAttempts);
    });
  });

  describe("deleteQuiz", () => {
    it("should delete quiz and clear currentQuiz", async () => {
      const mockQuiz = createMockQuiz();
      (quizzesService.get as Mock).mockResolvedValueOnce({
        data: mockQuiz,
        error: null,
      });
      (quizzesService.delete as Mock).mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.fetchQuiz("quiz-1");
      });

      expect(result.current.currentQuiz).not.toBeNull();

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteQuiz("quiz-1");
      });

      expect(success).toBe(true);
      expect(result.current.currentQuiz).toBeNull();
    });
  });
});
