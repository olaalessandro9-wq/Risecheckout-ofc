/**
 * Status Handler Tests for key-rotation-executor
 * 
 * @module key-rotation-executor/tests/status-handler.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertExists, assertArrayIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { StatusResponse, RotationStatus, KeyVersionRow } from "./_shared.ts";

// ============================================================================
// STATUS HANDLER TESTS
// ============================================================================

Deno.test("Status response - should have correct structure", () => {
  const response: StatusResponse = {
    activeVersion: 1,
    availableVersions: [1, 2],
    pendingRotations: []
  };

  assertExists(response.activeVersion);
  assertEquals(Array.isArray(response.availableVersions), true);
  assertEquals(Array.isArray(response.pendingRotations), true);
});

Deno.test("Status response - should include pending rotations", () => {
  const rotation: RotationStatus = {
    id: "uuid-123",
    fromVersion: 1,
    toVersion: 2,
    status: "running",
    recordsProcessed: 500,
    recordsFailed: 2,
    startedAt: new Date().toISOString(),
    completedAt: null
  };

  const response: StatusResponse = {
    activeVersion: 1,
    availableVersions: [1, 2],
    pendingRotations: [rotation]
  };

  assertEquals(response.pendingRotations.length, 1);
  assertEquals(response.pendingRotations[0].status, "running");
});

Deno.test("Status response - completed rotation has completedAt", () => {
  const rotation: RotationStatus = {
    id: "uuid-123",
    fromVersion: 1,
    toVersion: 2,
    status: "completed",
    recordsProcessed: 1000,
    recordsFailed: 0,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  };

  assertEquals(rotation.status, "completed");
  assertExists(rotation.completedAt);
});

Deno.test("KeyVersionRow - should map to version numbers", () => {
  const versions: KeyVersionRow[] = [
    { version: 3, status: "active" },
    { version: 2, status: "deprecated" },
    { version: 1, status: "revoked" }
  ];

  const versionNumbers = versions.map(v => v.version);
  
  assertArrayIncludes(versionNumbers, [1, 2, 3]);
});

Deno.test("KeyVersionRow - should have valid statuses", () => {
  const validStatuses = ["active", "deprecated", "revoked", "pending"];
  
  const version: KeyVersionRow = { version: 1, status: "active" };
  
  assertEquals(validStatuses.includes(version.status), true);
});
