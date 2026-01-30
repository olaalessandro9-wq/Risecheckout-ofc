/**
 * Progress Calculator Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from 'vitest';
import {
  calculateContentProgress,
  isContentComplete,
  calculateModuleProgress,
  calculateOverallProgress,
  formatWatchTime,
  formatDuration,
  estimateRemainingTime,
} from '../progress-calculator';
import type { MemberModule, MemberContent, ContentProgress } from '../../types';

describe('calculateContentProgress', () => {
  it('should return 0 for null duration', () => {
    expect(calculateContentProgress(100, null)).toBe(0);
  });

  it('should return 0 for zero duration', () => {
    expect(calculateContentProgress(100, 0)).toBe(0);
  });

  it('should return 0 for negative duration', () => {
    expect(calculateContentProgress(100, -10)).toBe(0);
  });

  it('should calculate correct percentage', () => {
    expect(calculateContentProgress(50, 100)).toBe(50);
    expect(calculateContentProgress(75, 100)).toBe(75);
    expect(calculateContentProgress(25, 100)).toBe(25);
  });

  it('should round to nearest integer', () => {
    expect(calculateContentProgress(33, 100)).toBe(33);
    expect(calculateContentProgress(66, 100)).toBe(66);
  });

  it('should cap at 100%', () => {
    expect(calculateContentProgress(150, 100)).toBe(100);
    expect(calculateContentProgress(1000, 100)).toBe(100);
  });
});

describe('isContentComplete', () => {
  it('should return true at 90% (default threshold)', () => {
    expect(isContentComplete(90)).toBe(true);
    expect(isContentComplete(95)).toBe(true);
    expect(isContentComplete(100)).toBe(true);
  });

  it('should return false below threshold', () => {
    expect(isContentComplete(89)).toBe(false);
    expect(isContentComplete(50)).toBe(false);
  });

  it('should respect custom threshold', () => {
    expect(isContentComplete(80, 80)).toBe(true);
    expect(isContentComplete(79, 80)).toBe(false);
    expect(isContentComplete(50, 50)).toBe(true);
  });
});

describe('calculateModuleProgress', () => {
  const createModule = (id: string): MemberModule => ({
    id,
    product_id: 'product-1',
    title: `Module ${id}`,
    description: null,
    cover_image_url: null,
    width: null,
    height: null,
    position: 1,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  });

  const createContent = (id: string, moduleId: string, duration: number | null = 600): MemberContent => ({
    id,
    module_id: moduleId,
    title: `Content ${id}`,
    description: null,
    content_type: 'video',
    content_url: null,
    body: null,
    content_data: null,
    position: 1,
    is_active: true,
    duration_seconds: duration,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  });

  const createProgress = (contentId: string, watchTime: number, completed = false): ContentProgress => ({
    id: `progress-${contentId}`,
    buyer_id: 'buyer-1',
    content_id: contentId,
    progress_percent: 0,
    watch_time_seconds: watchTime,
    last_position_seconds: watchTime,
    completed_at: completed ? '2024-01-15' : null,
    started_at: '2024-01-01',
    updated_at: '2024-01-15',
  });

  it('should return zeros for empty module', () => {
    const module = createModule('m1');
    const result = calculateModuleProgress(module, [], []);

    expect(result.total_contents).toBe(0);
    expect(result.completed_contents).toBe(0);
    expect(result.progress_percent).toBe(0);
  });

  it('should calculate progress for module with contents', () => {
    const module = createModule('m1');
    const contents = [
      createContent('c1', 'm1', 600),
      createContent('c2', 'm1', 600),
    ];
    const progress = [
      createProgress('c1', 600, true),
    ];

    const result = calculateModuleProgress(module, contents, progress);

    expect(result.total_contents).toBe(2);
    expect(result.completed_contents).toBe(1);
    expect(result.progress_percent).toBe(50);
    expect(result.watched_seconds).toBe(600);
  });

  it('should filter contents by module_id', () => {
    const module = createModule('m1');
    const contents = [
      createContent('c1', 'm1'),
      createContent('c2', 'm2'), // Different module
    ];

    const result = calculateModuleProgress(module, contents, []);

    expect(result.total_contents).toBe(1);
  });
});

describe('calculateOverallProgress', () => {
  const createModule = (id: string): MemberModule => ({
    id,
    product_id: 'product-1',
    title: `Module ${id}`,
    description: null,
    cover_image_url: null,
    width: null,
    height: null,
    position: 1,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  });

  const createContent = (id: string, moduleId: string): MemberContent => ({
    id,
    module_id: moduleId,
    title: `Content ${id}`,
    description: null,
    content_type: 'video',
    content_url: null,
    body: null,
    content_data: null,
    position: 1,
    is_active: true,
    duration_seconds: 600,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  });

  it('should return zeros for empty product', () => {
    const result = calculateOverallProgress('p1', [], [], []);

    expect(result.overall_percent).toBe(0);
    expect(result.completed_modules).toBe(0);
    expect(result.last_accessed_at).toBeNull();
  });

  it('should calculate overall progress', () => {
    const modules = [createModule('m1'), createModule('m2')];
    const contents = [
      createContent('c1', 'm1'),
      createContent('c2', 'm1'),
      createContent('c3', 'm2'),
      createContent('c4', 'm2'),
    ];
    const progress: ContentProgress[] = [
      { id: 'p1', buyer_id: 'b1', content_id: 'c1', progress_percent: 100, watch_time_seconds: 600, last_position_seconds: null, started_at: null, completed_at: '2024-01-10', updated_at: '2024-01-10' },
      { id: 'p2', buyer_id: 'b1', content_id: 'c2', progress_percent: 100, watch_time_seconds: 600, last_position_seconds: null, started_at: null, completed_at: '2024-01-11', updated_at: '2024-01-11' },
    ];

    const result = calculateOverallProgress('p1', modules, contents, progress);

    expect(result.total_contents).toBe(4);
    expect(result.completed_contents).toBe(2);
    expect(result.overall_percent).toBe(50);
    expect(result.completed_modules).toBe(1); // m1 is 100% complete
    expect(result.total_watch_time_seconds).toBe(1200);
    expect(result.last_accessed_at).toBe('2024-01-11');
    expect(result.last_content_id).toBe('c2');
  });
});

describe('formatWatchTime', () => {
  it('should format seconds only', () => {
    expect(formatWatchTime(45)).toBe('45s');
  });

  it('should format minutes and seconds', () => {
    expect(formatWatchTime(90)).toBe('1m 30s');
    expect(formatWatchTime(125)).toBe('2m 5s');
  });

  it('should format hours and minutes', () => {
    expect(formatWatchTime(3600)).toBe('1h 0m');
    expect(formatWatchTime(3660)).toBe('1h 1m');
    expect(formatWatchTime(7200)).toBe('2h 0m');
  });

  it('should hide seconds when showing hours', () => {
    expect(formatWatchTime(3665)).toBe('1h 1m');
  });

  it('should format whole minutes without seconds', () => {
    expect(formatWatchTime(120)).toBe('2m');
    expect(formatWatchTime(300)).toBe('5m');
  });
});

describe('formatDuration', () => {
  it('should return "--:--" for null', () => {
    expect(formatDuration(null)).toBe('--:--');
  });

  it('should return "--:--" for zero', () => {
    expect(formatDuration(0)).toBe('--:--');
  });

  it('should return "--:--" for negative', () => {
    expect(formatDuration(-10)).toBe('--:--');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('should format hours:minutes:seconds', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7265)).toBe('2:01:05');
  });
});

describe('estimateRemainingTime', () => {
  it('should calculate remaining time', () => {
    expect(estimateRemainingTime(600, 200)).toBe(400);
    expect(estimateRemainingTime(1000, 750)).toBe(250);
  });

  it('should return 0 when watched exceeds total', () => {
    expect(estimateRemainingTime(100, 150)).toBe(0);
    expect(estimateRemainingTime(100, 100)).toBe(0);
  });

  it('should return full duration when nothing watched', () => {
    expect(estimateRemainingTime(600, 0)).toBe(600);
  });
});
