/**
 * Quizzes Service Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getQuiz,
  createQuiz,
  addQuestion,
  deleteQuestion,
  submitQuiz,
  getAttempts,
  getAttemptResult,
  deleteQuiz,
  quizzesService,
} from '../quizzes.service';

// Mock SUPABASE_URL
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
}));

describe('quizzes.service', () => {
  const originalFetch = global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
  });

  describe('invokeQuizzesFunction', () => {
    it('should include credentials in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await getQuiz('quiz-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/members-area-quizzes',
        expect.objectContaining({
          credentials: 'include',
          method: 'POST',
        })
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      const result = await getQuiz('quiz-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Forbidden');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await getQuiz('quiz-123');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Timeout');
    });
  });

  describe('getQuiz', () => {
    it('should fetch quiz with questions', async () => {
      const quiz = {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          { id: 'q1', text: 'Question 1' },
          { id: 'q2', text: 'Question 2' },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(quiz),
      });

      const result = await getQuiz('quiz-1');

      expect(result.data).toEqual(quiz);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get');
      expect(body.quiz_id).toBe('quiz-1');
    });
  });

  describe('createQuiz', () => {
    it('should create a new quiz', async () => {
      const newQuiz = { id: 'quiz-new', title: 'New Quiz' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newQuiz),
      });

      const result = await createQuiz({
        content_id: 'content-1',
        title: 'New Quiz',
        passing_score: 70,
      });

      expect(result.data).toEqual(newQuiz);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('create');
      expect(body.title).toBe('New Quiz');
      expect(body.passing_score).toBe(70);
    });
  });

  describe('addQuestion', () => {
    it('should add a question to a quiz', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ question_id: 'q-new' }),
      });

      const result = await addQuestion({
        quiz_id: 'quiz-1',
        question_text: 'What is 2+2?',
        question_type: 'multiple_choice',
        answers: [
          { answer_text: '3', is_correct: false },
          { answer_text: '4', is_correct: true },
        ],
      });

      expect(result.data).toEqual({ question_id: 'q-new' });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('add_question');
      expect(body.quiz_id).toBe('quiz-1');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteQuestion('q-1');

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('delete_question');
      expect(body.question_id).toBe('q-1');
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz answers and get result', async () => {
      const quizResult = {
        attempt_id: 'att-1',
        score: 80,
        passed: true,
        total_points: 100,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(quizResult),
      });

      const result = await submitQuiz('buyer-123', {
        quiz_id: 'quiz-1',
        answers: [
          { question_id: 'q1', selected_answer_ids: ['opt-1'] },
          { question_id: 'q2', selected_answer_ids: ['opt-3'] },
        ],
        time_spent_seconds: 120,
      });

      expect(result.data).toEqual(quizResult);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('submit');
      expect(body.buyer_id).toBe('buyer-123');
      expect(body.quiz_id).toBe('quiz-1');
    });
  });

  describe('getAttempts', () => {
    it('should fetch all attempts for a quiz', async () => {
      const attempts = [
        { id: 'att-1', score: 60, passed: false },
        { id: 'att-2', score: 85, passed: true },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(attempts),
      });

      const result = await getAttempts('quiz-1', 'buyer-123');

      expect(result.data).toEqual(attempts);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_attempts');
      expect(body.quiz_id).toBe('quiz-1');
      expect(body.buyer_id).toBe('buyer-123');
    });
  });

  describe('getAttemptResult', () => {
    it('should fetch a specific attempt result', async () => {
      const attemptResult = {
        attempt_id: 'att-1',
        score: 90,
        passed: true,
        answers_review: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(attemptResult),
      });

      const result = await getAttemptResult('att-1');

      expect(result.data).toEqual(attemptResult);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('get_result');
      expect(body.attempt_id).toBe('att-1');
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz and its questions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteQuiz('quiz-1');

      expect(result.data).toEqual({ success: true });
      
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.action).toBe('delete');
      expect(body.quiz_id).toBe('quiz-1');
    });
  });

  describe('quizzesService object', () => {
    it('should export all methods', () => {
      expect(quizzesService.get).toBe(getQuiz);
      expect(quizzesService.create).toBe(createQuiz);
      expect(quizzesService.addQuestion).toBe(addQuestion);
      expect(quizzesService.deleteQuestion).toBe(deleteQuestion);
      expect(quizzesService.submit).toBe(submitQuiz);
      expect(quizzesService.getAttempts).toBe(getAttempts);
      expect(quizzesService.getAttemptResult).toBe(getAttemptResult);
      expect(quizzesService.delete).toBe(deleteQuiz);
    });
  });
});
