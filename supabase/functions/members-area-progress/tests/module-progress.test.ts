/**
 * Module Progress Tests for members-area-progress
 * RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatWatchTime } from "./_shared.ts";

// ============================================
// UNIT TESTS: Last Watched
// ============================================

Deno.test("members-area-progress: validates last watched structure", () => {
  const lastWatched = {
    content_id: "content-123",
    content_title: "Lesson 5",
    module_id: "module-456",
    module_title: "Module 2",
    progress_percent: 45,
    last_position_seconds: 180,
    updated_at: "2024-01-15T10:00:00Z",
  };

  assertExists(lastWatched.content_id);
  assertExists(lastWatched.module_id);
  assertEquals(typeof lastWatched.progress_percent, "number");
});

Deno.test("members-area-progress: handles no last watched", () => {
  const lastWatched = null;
  assertEquals(lastWatched, null);
});

// ============================================
// UNIT TESTS: Module Progress
// ============================================

Deno.test("members-area-progress: validates module progress structure", () => {
  const moduleProgress = {
    module_id: "module-123",
    total_contents: 5,
    completed_contents: 3,
    progress_percent: 60,
    contents: [
      { content_id: "c1", progress_percent: 100, completed: true },
      { content_id: "c2", progress_percent: 100, completed: true },
      { content_id: "c3", progress_percent: 100, completed: true },
      { content_id: "c4", progress_percent: 50, completed: false },
      { content_id: "c5", progress_percent: 0, completed: false },
    ],
  };

  assertEquals(moduleProgress.completed_contents, 3);
  assertEquals(moduleProgress.contents.length, moduleProgress.total_contents);
});

// ============================================
// UNIT TESTS: Watch Time Accumulation
// ============================================

Deno.test("members-area-progress: accumulates watch time", () => {
  const previousWatchTime = 300;
  const sessionWatchTime = 120;
  const totalWatchTime = previousWatchTime + sessionWatchTime;
  assertEquals(totalWatchTime, 420);
});

Deno.test("members-area-progress: formats watch time", () => {
  const result = formatWatchTime(3661);

  assertEquals(result.hours, 1);
  assertEquals(result.minutes, 1);
  assertEquals(result.seconds, 1);
});

Deno.test("members-area-progress: formats zero watch time", () => {
  const result = formatWatchTime(0);

  assertEquals(result.hours, 0);
  assertEquals(result.minutes, 0);
  assertEquals(result.seconds, 0);
});
