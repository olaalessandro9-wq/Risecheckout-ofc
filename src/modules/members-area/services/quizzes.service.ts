/**
 * Quizzes Service
 * Communicates with members-area-quizzes Edge Function
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 */

import { SUPABASE_URL } from '@/config/supabase';
import type {
  Quiz,
  QuizWithQuestions,
  QuizAttempt,
  QuizResult,
  CreateQuizInput,
  CreateQuestionInput,
  SubmitQuizInput,
} from '../types';

const FUNCTION_NAME = 'members-area-quizzes';

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invoke the quizzes edge function with authentication
 */
async function invokeQuizzesFunction<T>(
  action: string,
  payload: object
): Promise<ServiceResponse<T>> {
  try {
    // RISE V3: Autenticação via cookies httpOnly (credentials: include)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}

/**
 * Get a quiz with all questions (for taking the quiz)
 */
export async function getQuiz(
  quizId: string
): Promise<ServiceResponse<QuizWithQuestions>> {
  return invokeQuizzesFunction<QuizWithQuestions>('get', { quiz_id: quizId });
}

/**
 * Create a new quiz
 */
export async function createQuiz(
  input: CreateQuizInput
): Promise<ServiceResponse<Quiz>> {
  return invokeQuizzesFunction<Quiz>('create', input);
}

/**
 * Add a question to a quiz
 */
export async function addQuestion(
  input: CreateQuestionInput
): Promise<ServiceResponse<{ question_id: string }>> {
  return invokeQuizzesFunction<{ question_id: string }>('add_question', input);
}

/**
 * Delete a question from a quiz
 */
export async function deleteQuestion(
  questionId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeQuizzesFunction<{ success: boolean }>('delete_question', {
    question_id: questionId,
  });
}

/**
 * Submit quiz answers
 */
export async function submitQuiz(
  buyerId: string,
  input: SubmitQuizInput
): Promise<ServiceResponse<QuizResult>> {
  return invokeQuizzesFunction<QuizResult>('submit', {
    buyer_id: buyerId,
    ...input,
  });
}

/**
 * Get all attempts for a quiz by a student
 */
export async function getAttempts(
  quizId: string,
  buyerId: string
): Promise<ServiceResponse<QuizAttempt[]>> {
  return invokeQuizzesFunction<QuizAttempt[]>('get_attempts', {
    quiz_id: quizId,
    buyer_id: buyerId,
  });
}

/**
 * Get a specific attempt result
 */
export async function getAttemptResult(
  attemptId: string
): Promise<ServiceResponse<QuizResult>> {
  return invokeQuizzesFunction<QuizResult>('get_result', {
    attempt_id: attemptId,
  });
}

/**
 * Delete a quiz and all its questions
 */
export async function deleteQuiz(
  quizId: string
): Promise<ServiceResponse<{ success: boolean }>> {
  return invokeQuizzesFunction<{ success: boolean }>('delete', {
    quiz_id: quizId,
  });
}

export const quizzesService = {
  get: getQuiz,
  create: createQuiz,
  addQuestion,
  deleteQuestion,
  submit: submitQuiz,
  getAttempts,
  getAttemptResult,
  delete: deleteQuiz,
};
