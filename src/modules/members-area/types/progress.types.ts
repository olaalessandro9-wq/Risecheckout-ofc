/**
 * Types for Student Progress Tracking
 * Tracks completion and watch time
 */

/** Progress status for a content item */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/** Individual content progress record */
export interface ContentProgress {
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

/** Progress with content details */
export interface ContentProgressWithDetails extends ContentProgress {
  content_title: string;
  content_type: string;
  module_id: string;
  module_title: string;
}

/** Aggregated progress for a module */
export interface ModuleProgress {
  module_id: string;
  module_title: string;
  total_contents: number;
  completed_contents: number;
  progress_percent: number;
  total_duration_seconds: number;
  watched_seconds: number;
}

/** Overall progress for a product */
export interface OverallProgress {
  product_id: string;
  total_modules: number;
  completed_modules: number;
  total_contents: number;
  completed_contents: number;
  overall_percent: number;
  total_watch_time_seconds: number;
  last_accessed_at: string | null;
  last_content_id: string | null;
}

/** Progress summary for dashboard */
export interface ProgressSummary {
  overall: OverallProgress;
  modules: ModuleProgress[];
  recent_contents: ContentProgressWithDetails[];
}

/** Input for updating content progress */
export interface UpdateProgressInput {
  content_id: string;
  progress_percent: number;
  watch_time_seconds?: number;
  last_position_seconds?: number;
}

/** Input for marking content complete */
export interface MarkCompleteInput {
  content_id: string;
  watch_time_seconds?: number;
}

/** Content access status (for drip content) */
export interface ContentAccessStatus {
  content_id: string;
  is_accessible: boolean;
  unlock_date: string | null;
  reason: 'available' | 'drip_locked' | 'group_locked' | 'not_purchased';
}
