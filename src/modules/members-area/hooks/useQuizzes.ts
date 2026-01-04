/**
 * useQuizzes Hook
 * Manages quizzes, questions, and student attempts
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { quizzesService } from '../services/quizzes.service';
import type {
  QuizWithQuestions,
  QuizResult,
  QuizAttempt,
  CreateQuizInput,
  CreateQuestionInput,
  SubmitQuizInput,
} from '../types';

interface UseQuizzesReturn {
  currentQuiz: QuizWithQuestions | null;
  attempts: QuizAttempt[];
  lastResult: QuizResult | null;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  fetchQuiz: (quizId: string) => Promise<QuizWithQuestions | null>;
  createQuiz: (input: CreateQuizInput) => Promise<string | null>;
  addQuestion: (input: CreateQuestionInput) => Promise<boolean>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  submitQuiz: (buyerId: string, input: SubmitQuizInput) => Promise<QuizResult | null>;
  fetchAttempts: (quizId: string, buyerId: string) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<boolean>;
}

export function useQuizzes(): UseQuizzesReturn {
  const [currentQuiz, setCurrentQuiz] = useState<QuizWithQuestions | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuiz = useCallback(async (quizId: string): Promise<QuizWithQuestions | null> => {
    setIsLoading(true);

    const { data, error } = await quizzesService.get(quizId);

    if (error) {
      toast.error('Erro ao carregar quiz');
      setIsLoading(false);
      return null;
    }

    setCurrentQuiz(data);
    setIsLoading(false);
    return data;
  }, []);

  const createQuiz = useCallback(async (input: CreateQuizInput): Promise<string | null> => {
    setIsSaving(true);

    const { data, error } = await quizzesService.create(input);

    if (error) {
      toast.error('Erro ao criar quiz');
      setIsSaving(false);
      return null;
    }

    toast.success('Quiz criado com sucesso');
    setIsSaving(false);
    return data?.id ?? null;
  }, []);

  const addQuestion = useCallback(async (input: CreateQuestionInput): Promise<boolean> => {
    setIsSaving(true);

    const { error } = await quizzesService.addQuestion(input);

    if (error) {
      toast.error('Erro ao adicionar pergunta');
      setIsSaving(false);
      return false;
    }

    toast.success('Pergunta adicionada');
    setIsSaving(false);
    return true;
  }, []);

  const deleteQuestion = useCallback(async (questionId: string): Promise<boolean> => {
    setIsSaving(true);

    const { error } = await quizzesService.deleteQuestion(questionId);

    if (error) {
      toast.error('Erro ao excluir pergunta');
      setIsSaving(false);
      return false;
    }

    toast.success('Pergunta excluída');
    setIsSaving(false);
    return true;
  }, []);

  const submitQuiz = useCallback(async (
    buyerId: string,
    input: SubmitQuizInput
  ): Promise<QuizResult | null> => {
    setIsSubmitting(true);

    const { data, error } = await quizzesService.submit(buyerId, input);

    if (error) {
      toast.error('Erro ao enviar respostas');
      setIsSubmitting(false);
      return null;
    }

    if (data) {
      setLastResult(data);
      
      if (data.passed) {
        toast.success(`Parabéns! Você passou com ${data.score_percent.toFixed(0)}%`);
      } else {
        toast.error(`Você não atingiu a nota mínima. Sua nota: ${data.score_percent.toFixed(0)}%`);
      }
    }

    setIsSubmitting(false);
    return data;
  }, []);

  const fetchAttempts = useCallback(async (quizId: string, buyerId: string): Promise<void> => {
    setIsLoading(true);

    const { data, error } = await quizzesService.getAttempts(quizId, buyerId);

    if (error) {
      toast.error('Erro ao carregar tentativas');
    } else if (data) {
      setAttempts(data);
    }

    setIsLoading(false);
  }, []);

  const deleteQuiz = useCallback(async (quizId: string): Promise<boolean> => {
    setIsSaving(true);

    const { error } = await quizzesService.delete(quizId);

    if (error) {
      toast.error('Erro ao excluir quiz');
      setIsSaving(false);
      return false;
    }

    toast.success('Quiz excluído');
    setCurrentQuiz(null);
    setIsSaving(false);
    return true;
  }, []);

  return {
    currentQuiz,
    attempts,
    lastResult,
    isLoading,
    isSaving,
    isSubmitting,
    fetchQuiz,
    createQuiz,
    addQuestion,
    deleteQuestion,
    submitQuiz,
    fetchAttempts,
    deleteQuiz,
  };
}
