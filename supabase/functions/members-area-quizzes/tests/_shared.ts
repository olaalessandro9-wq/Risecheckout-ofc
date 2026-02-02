/**
 * Shared Test Infrastructure for members-area-quizzes
 * 
 * @module members-area-quizzes/tests/_shared
 * @version 2.0.0 - RISE Protocol V3 Compliant (Zero Hardcoded Credentials)
 */

import { getTestConfig, skipIntegration, integrationTestOptions } from "../../_shared/testing/mod.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const FUNCTION_NAME = "members-area-quizzes";

const config = getTestConfig();

export function getFunctionUrl(): string {
  return config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/${FUNCTION_NAME}`
    : `https://mock.supabase.co/functions/v1/${FUNCTION_NAME}`;
}

// ============================================================================
// RE-EXPORT CENTRALIZED TEST HELPERS
// ============================================================================

export { skipIntegration, integrationTestOptions };

// ============================================================================
// VALID ACTIONS
// ============================================================================

export const VALID_ACTIONS = [
  "list",
  "get",
  "create",
  "update",
  "delete",
  "submit",
  "get-attempts",
] as const;

export type QuizAction = typeof VALID_ACTIONS[number];

export function isValidAction(action: string): action is QuizAction {
  return (VALID_ACTIONS as readonly string[]).includes(action);
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export interface QuizPayload {
  action: string;
  content_id?: string;
  quiz_id?: string;
  data?: Record<string, unknown>;
}

export function createListPayload(contentId: string = "test-content-id"): QuizPayload {
  return { action: "list", content_id: contentId };
}

export function createGetPayload(quizId: string = "test-quiz-id"): QuizPayload {
  return { action: "get", quiz_id: quizId };
}

export function createDeletePayload(quizId: string = "test-quiz-id"): QuizPayload {
  return { action: "delete", quiz_id: quizId };
}

export function createUpdatePayload(
  quizId: string = "test-quiz-id",
  data: Record<string, unknown> = { title: "Updated Quiz" }
): QuizPayload {
  return { action: "update", quiz_id: quizId, data };
}

export function createCreatePayload(
  contentId: string = "test-content-id",
  data: Record<string, unknown> = { title: "Test Quiz", description: "Test description" }
): QuizPayload {
  return { action: "create", content_id: contentId, data };
}

export function createSubmitPayload(
  quizId: string = "test-quiz-id",
  answers: Record<string, string> = { "question-1": "answer-1" }
): QuizPayload {
  return { action: "submit", quiz_id: quizId, data: { answers } };
}

export function createGetAttemptsPayload(quizId: string = "test-quiz-id"): QuizPayload {
  return { action: "get-attempts", quiz_id: quizId };
}

export function createInvalidActionPayload(quizId: string = "test-quiz-id"): QuizPayload {
  return { action: "invalid-action", quiz_id: quizId };
}

export function createMockRequest(payload: QuizPayload): Request {
  return new Request(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

export function createSampleQuestionData() {
  return {
    title: "Test Quiz",
    questions: [
      {
        question_text: "What is 2+2?",
        question_type: "multiple_choice",
        points: 10,
        position: 0,
        answers: [
          { answer_text: "3", is_correct: false, position: 0 },
          { answer_text: "4", is_correct: true, position: 1 },
        ],
      },
    ],
  };
}
