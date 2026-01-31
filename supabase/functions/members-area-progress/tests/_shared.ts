/**
 * Shared types and utilities for members-area-progress tests
 * RISE Protocol V3 Compliant
 */

// ============================================
// TYPES
// ============================================

export interface ProgressRecord {
  id: string;
  buyer_id: string;
  content_id: string;
  progress_percent: number;
  watch_time_seconds: number;
  last_position_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface ProgressSummary {
  total_contents: number;
  completed_contents: number;
  in_progress_contents: number;
  not_started_contents: number;
  overall_progress: number;
}

export interface ModuleProgress {
  module_id: string;
  total_contents: number;
  completed_contents: number;
  progress_percent: number;
  contents: Array<{
    content_id: string;
    progress_percent: number;
    completed: boolean;
  }>;
}

export interface LastWatched {
  content_id: string;
  content_title: string;
  module_id: string;
  module_title: string;
  progress_percent: number;
  last_position_seconds: number;
  updated_at: string;
}

export interface UpdateData {
  progress_percent?: number;
  last_position_seconds?: number;
  watch_time_seconds?: number;
}

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = [
  "get_content",
  "get",
  "get_summary",
  "get_last_watched",
  "update",
  "complete",
  "uncomplete",
  "get-module-progress",
  "get-product-progress",
] as const;

export const COMPLETION_THRESHOLD = 95;

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number]);
}

export function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calculateProgress(current: number, total: number): number {
  return total === 0 ? 0 : Math.round((current / total) * 100);
}

export function isComplete(progress: number): boolean {
  return progress >= COMPLETION_THRESHOLD;
}

export function formatWatchTime(seconds: number): { hours: number; minutes: number; seconds: number } {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { hours, minutes, seconds: secs };
}

export function createDefaultProgress(buyerId: string, contentId: string): ProgressRecord {
  return {
    id: "",
    buyer_id: buyerId,
    content_id: contentId,
    progress_percent: 0,
    watch_time_seconds: 0,
    last_position_seconds: null,
    started_at: null,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };
}
