/**
 * useStudentProgress Hook
 * Tracks and manages student progress in the members area
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { progressService } from '../services/progress.service';
import type {
  ProgressSummary,
  ContentProgress,
  UpdateProgressInput,
  ContentAccessStatus,
} from '../types';

interface UseStudentProgressReturn {
  summary: ProgressSummary | null;
  currentProgress: ContentProgress | null;
  isLoading: boolean;
  isSaving: boolean;
  fetchSummary: (buyerId: string, productId: string) => Promise<void>;
  getContentProgress: (buyerId: string, contentId: string) => Promise<ContentProgress | null>;
  updateProgress: (buyerId: string, input: UpdateProgressInput) => Promise<boolean>;
  markComplete: (buyerId: string, contentId: string) => Promise<boolean>;
  unmarkComplete: (buyerId: string, contentId: string) => Promise<boolean>;
  checkAccess: (buyerId: string, contentId: string) => Promise<ContentAccessStatus | null>;
  getLastWatched: (buyerId: string, productId: string) => Promise<ContentProgress | null>;
}

export function useStudentProgress(): UseStudentProgressReturn {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [currentProgress, setCurrentProgress] = useState<ContentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSummary = useCallback(async (buyerId: string, productId: string) => {
    setIsLoading(true);

    const { data, error } = await progressService.getSummary(buyerId, productId);

    if (error) {
      toast.error('Erro ao carregar progresso');
    } else if (data) {
      setSummary(data);
    }

    setIsLoading(false);
  }, []);

  const getContentProgress = useCallback(async (
    buyerId: string,
    contentId: string
  ): Promise<ContentProgress | null> => {
    const { data, error } = await progressService.getContent(buyerId, contentId);

    if (error) {
      return null;
    }

    setCurrentProgress(data);
    return data;
  }, []);

  const updateProgress = useCallback(async (
    buyerId: string,
    input: UpdateProgressInput
  ): Promise<boolean> => {
    setIsSaving(true);

    const { data, error } = await progressService.update(buyerId, input);

    if (error) {
      setIsSaving(false);
      return false;
    }

    if (data) {
      setCurrentProgress(data);
    }

    setIsSaving(false);
    return true;
  }, []);

  const markComplete = useCallback(async (
    buyerId: string,
    contentId: string
  ): Promise<boolean> => {
    setIsSaving(true);

    const { data, error } = await progressService.markComplete(buyerId, {
      content_id: contentId,
    });

    if (error) {
      toast.error('Erro ao marcar como concluído');
      setIsSaving(false);
      return false;
    }

    if (data) {
      setCurrentProgress(data);
      toast.success('Conteúdo concluído!');
    }

    setIsSaving(false);
    return true;
  }, []);

  const unmarkComplete = useCallback(async (
    buyerId: string,
    contentId: string
  ): Promise<boolean> => {
    setIsSaving(true);

    const { error } = await progressService.unmarkComplete(buyerId, contentId);

    if (error) {
      toast.error('Erro ao desmarcar conclusão');
      setIsSaving(false);
      return false;
    }

    toast.success('Conclusão removida');
    setIsSaving(false);
    return true;
  }, []);

  const checkAccess = useCallback(async (
    buyerId: string,
    contentId: string
  ): Promise<ContentAccessStatus | null> => {
    const { data, error } = await progressService.checkAccess(buyerId, contentId);

    if (error) {
      return null;
    }

    return data;
  }, []);

  const getLastWatched = useCallback(async (
    buyerId: string,
    productId: string
  ): Promise<ContentProgress | null> => {
    const { data, error } = await progressService.getLastWatched(buyerId, productId);

    if (error) {
      return null;
    }

    return data;
  }, []);

  return {
    summary,
    currentProgress,
    isLoading,
    isSaving,
    fetchSummary,
    getContentProgress,
    updateProgress,
    markComplete,
    unmarkComplete,
    checkAccess,
    getLastWatched,
  };
}
