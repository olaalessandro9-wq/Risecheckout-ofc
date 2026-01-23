/**
 * Progress Service
 * Communicates with members-area-progress Edge Function
 * 
 * RISE V3: Uses credentials: 'include' for httpOnly cookies
 */

import { SUPABASE_URL } from '@/config/supabase';
import type {
  ProgressSummary,
  ContentProgress,
  UpdateProgressInput,
  MarkCompleteInput,
  ContentAccessStatus,
} from '../types';

const FUNCTION_NAME = 'members-area-progress';

interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Invoke the progress edge function with authentication
 */
async function invokeProgressFunction<T>(
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
 * Get full progress summary for a student on a product
 */
export async function getProgressSummary(
  buyerId: string,
  productId: string
): Promise<ServiceResponse<ProgressSummary>> {
  return invokeProgressFunction<ProgressSummary>('get_summary', {
    buyer_id: buyerId,
    product_id: productId,
  });
}

/**
 * Get progress for a specific content
 */
export async function getContentProgress(
  buyerId: string,
  contentId: string
): Promise<ServiceResponse<ContentProgress>> {
  return invokeProgressFunction<ContentProgress>('get_content', {
    buyer_id: buyerId,
    content_id: contentId,
  });
}

/**
 * Update progress for a content item
 */
export async function updateProgress(
  buyerId: string,
  input: UpdateProgressInput
): Promise<ServiceResponse<ContentProgress>> {
  return invokeProgressFunction<ContentProgress>('update', {
    buyer_id: buyerId,
    ...input,
  });
}

/**
 * Mark a content as complete
 */
export async function markComplete(
  buyerId: string,
  input: MarkCompleteInput
): Promise<ServiceResponse<ContentProgress>> {
  return invokeProgressFunction<ContentProgress>('mark_complete', {
    buyer_id: buyerId,
    ...input,
  });
}

/**
 * Check if a content is accessible (for drip content)
 */
export async function checkAccess(
  buyerId: string,
  contentId: string
): Promise<ServiceResponse<ContentAccessStatus>> {
  return invokeProgressFunction<ContentAccessStatus>('check_access', {
    buyer_id: buyerId,
    content_id: contentId,
  });
}

/**
 * Get the last watched content for "continue watching"
 */
export async function getLastWatched(
  buyerId: string,
  productId: string
): Promise<ServiceResponse<ContentProgress | null>> {
  return invokeProgressFunction<ContentProgress | null>('get_last_watched', {
    buyer_id: buyerId,
    product_id: productId,
  });
}

export const progressService = {
  getSummary: getProgressSummary,
  getContent: getContentProgress,
  update: updateProgress,
  markComplete,
  checkAccess,
  getLastWatched,
};
