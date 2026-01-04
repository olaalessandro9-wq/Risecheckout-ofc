/**
 * Progress Calculator
 * Calculates progress percentages and statistics for members area
 */

import type {
  ContentProgress,
  ModuleProgress,
  OverallProgress,
  MemberModule,
  MemberContent,
} from '../types';

/**
 * Calculate progress percentage for a single content item
 */
export function calculateContentProgress(
  watchedSeconds: number,
  totalDurationSeconds: number | null
): number {
  if (!totalDurationSeconds || totalDurationSeconds <= 0) {
    return 0;
  }

  const percent = (watchedSeconds / totalDurationSeconds) * 100;
  return Math.min(Math.round(percent), 100);
}

/**
 * Determine if content should be marked as complete
 * Usually 90%+ is considered complete for videos
 */
export function isContentComplete(
  progressPercent: number,
  threshold: number = 90
): boolean {
  return progressPercent >= threshold;
}

/**
 * Calculate aggregated progress for a module
 */
export function calculateModuleProgress(
  module: MemberModule,
  contents: MemberContent[],
  progressRecords: ContentProgress[]
): ModuleProgress {
  const moduleContents = contents.filter(c => c.module_id === module.id);
  const totalContents = moduleContents.length;

  if (totalContents === 0) {
    return {
      module_id: module.id,
      module_title: module.title,
      total_contents: 0,
      completed_contents: 0,
      progress_percent: 0,
      total_duration_seconds: 0,
      watched_seconds: 0,
    };
  }

  const progressMap = new Map(
    progressRecords.map(p => [p.content_id, p])
  );

  let completedContents = 0;
  let totalDuration = 0;
  let watchedSeconds = 0;

  for (const content of moduleContents) {
    totalDuration += content.duration_seconds || 0;

    const progress = progressMap.get(content.id);
    if (progress) {
      watchedSeconds += progress.watch_time_seconds || 0;
      if (progress.completed_at) {
        completedContents++;
      }
    }
  }

  const progressPercent = totalContents > 0
    ? Math.round((completedContents / totalContents) * 100)
    : 0;

  return {
    module_id: module.id,
    module_title: module.title,
    total_contents: totalContents,
    completed_contents: completedContents,
    progress_percent: progressPercent,
    total_duration_seconds: totalDuration,
    watched_seconds: watchedSeconds,
  };
}

/**
 * Calculate overall progress for a product
 */
export function calculateOverallProgress(
  productId: string,
  modules: MemberModule[],
  contents: MemberContent[],
  progressRecords: ContentProgress[]
): OverallProgress {
  const totalModules = modules.length;
  const totalContents = contents.length;

  if (totalContents === 0) {
    return {
      product_id: productId,
      total_modules: totalModules,
      completed_modules: 0,
      total_contents: 0,
      completed_contents: 0,
      overall_percent: 0,
      total_watch_time_seconds: 0,
      last_accessed_at: null,
      last_content_id: null,
    };
  }

  const progressMap = new Map(
    progressRecords.map(p => [p.content_id, p])
  );

  let completedContents = 0;
  let totalWatchTime = 0;
  let lastAccessedAt: string | null = null;
  let lastContentId: string | null = null;

  for (const content of contents) {
    const progress = progressMap.get(content.id);
    if (progress) {
      totalWatchTime += progress.watch_time_seconds || 0;

      if (progress.completed_at) {
        completedContents++;
      }

      if (progress.updated_at) {
        if (!lastAccessedAt || progress.updated_at > lastAccessedAt) {
          lastAccessedAt = progress.updated_at;
          lastContentId = content.id;
        }
      }
    }
  }

  // Calculate completed modules (100% of contents completed)
  let completedModules = 0;
  for (const module of modules) {
    const moduleContents = contents.filter(c => c.module_id === module.id);
    const moduleCompletedCount = moduleContents.filter(c => {
      const progress = progressMap.get(c.id);
      return progress?.completed_at;
    }).length;

    if (moduleContents.length > 0 && moduleCompletedCount === moduleContents.length) {
      completedModules++;
    }
  }

  const overallPercent = totalContents > 0
    ? Math.round((completedContents / totalContents) * 100)
    : 0;

  return {
    product_id: productId,
    total_modules: totalModules,
    completed_modules: completedModules,
    total_contents: totalContents,
    completed_contents: completedContents,
    overall_percent: overallPercent,
    total_watch_time_seconds: totalWatchTime,
    last_accessed_at: lastAccessedAt,
    last_content_id: lastContentId,
  };
}

/**
 * Format watch time as human-readable string
 */
export function formatWatchTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (remainingSeconds > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Estimate remaining time to complete
 */
export function estimateRemainingTime(
  totalDurationSeconds: number,
  watchedSeconds: number
): number {
  return Math.max(0, totalDurationSeconds - watchedSeconds);
}
