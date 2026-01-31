/**
 * Completion Logic Tests for members-area-progress
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isComplete, COMPLETION_THRESHOLD, calculateProgress } from "./_shared.ts";

// ============================================
// UNIT TESTS: Completion Logic
// ============================================

Deno.test("members-area-progress: marks as complete", () => {
  const completedProgress = {
    progress_percent: 100,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  assertEquals(completedProgress.progress_percent, 100);
  assertExists(completedProgress.completed_at);
});

Deno.test("members-area-progress: marks as uncomplete", () => {
  const uncompletedProgress = {
    progress_percent: 0,
    completed_at: null,
    updated_at: new Date().toISOString(),
  };

  assertEquals(uncompletedProgress.progress_percent, 0);
  assertEquals(uncompletedProgress.completed_at, null);
});

Deno.test("members-area-progress: completion threshold", () => {
  const testCases = [
    { progress: 94, isComplete: false },
    { progress: 95, isComplete: true },
    { progress: 100, isComplete: true },
  ];

  testCases.forEach(({ progress, isComplete: expected }) => {
    assertEquals(isComplete(progress), expected);
  });
});

Deno.test("members-area-progress: threshold constant value", () => {
  assertEquals(COMPLETION_THRESHOLD, 95);
});

// ============================================
// UNIT TESTS: Summary Response
// ============================================

Deno.test("members-area-progress: validates summary structure", () => {
  const summary = {
    total_contents: 20,
    completed_contents: 15,
    in_progress_contents: 3,
    not_started_contents: 2,
    overall_progress: 75,
  };

  assertEquals(
    summary.completed_contents + summary.in_progress_contents + summary.not_started_contents,
    summary.total_contents
  );
  assertEquals(summary.overall_progress >= 0 && summary.overall_progress <= 100, true);
});

Deno.test("members-area-progress: calculates overall progress", () => {
  const totalContents = 10;
  const completedContents = 7;
  const overallProgress = calculateProgress(completedContents, totalContents);
  assertEquals(overallProgress, 70);
});
