/**
 * Types for members-area-progress Edge Function
 * RISE V3 Compliant - Separated from main router
 */

export interface ProgressData {
  progress_percent?: number;
  last_position_seconds?: number;
  watch_time_seconds?: number;
}

export interface ProgressRequest {
  action: 
    | "get" 
    | "get_content" 
    | "get_summary" 
    | "get_last_watched" 
    | "update" 
    | "complete" 
    | "uncomplete" 
    | "get-module-progress" 
    | "get-product-progress";
  content_id?: string;
  module_id?: string;
  product_id?: string;
  buyer_id?: string;
  data?: ProgressData;
}

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

export interface ExistingProgress {
  id: string;
  started_at: string | null;
}

export interface ContentRecord {
  id: string;
}

export interface ModuleRecord {
  id: string;
}

export interface ContentWithModule {
  id: string;
  module_id: string;
}

export interface ProgressWithCompletion {
  content_id: string;
  completed_at: string | null;
}

export interface ModuleProgress {
  total: number;
  completed: number;
}

export interface ContentWithDetails {
  id: string;
  title: string;
  content_type: string;
  module_id: string;
  duration_seconds: number | null;
  position: number;
}

export interface ModuleWithDetails {
  id: string;
  title: string;
  position: number;
}

export interface ModuleProgressStats {
  module_id: string;
  module_title: string;
  total_contents: number;
  completed_contents: number;
  progress_percent: number;
  total_duration_seconds: number;
  watched_seconds: number;
}

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

export interface ProgressSummary {
  overall: OverallProgress;
  modules: ModuleProgressStats[];
  recent_contents: ProgressRecord[];
}
