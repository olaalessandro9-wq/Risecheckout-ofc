/**
 * Types for Quizzes and Assessments
 * Supports multiple choice questions with scoring
 */

/** Question type */
export type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_select';

/** Quiz structure */
export interface Quiz {
  id: string;
  content_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_attempts: number | null;
  time_limit_minutes: number | null;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Individual question in a quiz */
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  position: number;
  explanation: string | null;
  created_at: string;
}

/** Answer option for a question */
export interface QuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  position: number;
}

/** Question with its answers loaded */
export interface QuestionWithAnswers extends QuizQuestion {
  answers: QuizAnswer[];
}

/** Quiz with all questions and answers */
export interface QuizWithQuestions extends Quiz {
  questions: QuestionWithAnswers[];
}

/** Student's quiz attempt */
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  buyer_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_points: number | null;
  passed: boolean | null;
  time_spent_seconds: number | null;
  answers: QuizAttemptAnswer[];
}

/** Individual answer in an attempt */
export interface QuizAttemptAnswer {
  question_id: string;
  selected_answer_ids: string[];
  is_correct: boolean;
  points_earned: number;
}

/** Result summary for a completed quiz */
export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_points: number;
  score_percent: number;
  passed: boolean;
  passing_score: number;
  time_spent_seconds: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

/** Input for creating a quiz */
export interface CreateQuizInput {
  content_id: string;
  title: string;
  description?: string;
  passing_score?: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  shuffle_questions?: boolean;
  show_correct_answers?: boolean;
}

/** Input for creating a question */
export interface CreateQuestionInput {
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  points?: number;
  position?: number;
  explanation?: string;
  answers: CreateAnswerInput[];
}

/** Input for creating an answer */
export interface CreateAnswerInput {
  answer_text: string;
  is_correct: boolean;
  position?: number;
}

/** Input for submitting a quiz */
export interface SubmitQuizInput {
  quiz_id: string;
  answers: {
    question_id: string;
    selected_answer_ids: string[];
  }[];
  time_spent_seconds: number;
}
