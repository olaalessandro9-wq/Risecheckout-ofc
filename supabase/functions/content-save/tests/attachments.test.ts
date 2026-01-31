/**
 * Attachment Handling & Orphan Cleanup Tests for content-save
 * 
 * @module content-save/tests/attachments.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  isValidBase64, 
  sanitizeFileName, 
  getOrphanAttachmentIds, 
  getNextPosition,
  MOCK_ATTACHMENTS,
  MOCK_CONTENT
} from "./_shared.ts";

// ============================================================================
// ATTACHMENT HANDLING TESTS
// ============================================================================

Deno.test("content-save - Attachments - should identify temp attachment", () => {
  const tempAtt = MOCK_ATTACHMENTS[1];
  assertEquals(tempAtt.is_temp, true);
  assertEquals(tempAtt.id.startsWith("temp-"), true);
});

Deno.test("content-save - Attachments - should identify existing attachment", () => {
  const existingAtt = MOCK_ATTACHMENTS[0];
  assertEquals(existingAtt.is_temp, false);
  assertEquals(existingAtt.id.startsWith("temp-"), false);
});

Deno.test("content-save - Attachments - should validate base64 format", () => {
  const validBase64 = "data:application/pdf;base64,JVBERi0xLjQ=";
  assertEquals(isValidBase64(validBase64), true);
});

Deno.test("content-save - Attachments - should reject invalid base64", () => {
  const invalidBase64 = "not-a-base64-string";
  assertEquals(isValidBase64(invalidBase64), false);
});

Deno.test("content-save - Attachments - should sanitize filename", () => {
  const fileName = "meu arquivo (1).pdf";
  const sanitized = sanitizeFileName(fileName);
  assertEquals(sanitized, "meu_arquivo__1_.pdf");
  assertEquals(sanitized.includes(" "), false);
});

Deno.test("content-save - Attachments - should keep valid chars in filename", () => {
  const fileName = "document-v2.0_final.pdf";
  const sanitized = sanitizeFileName(fileName);
  assertEquals(sanitized, fileName);
});

// ============================================================================
// ORPHAN CLEANUP TESTS
// ============================================================================

Deno.test("content-save - Orphans - should identify orphan attachments", () => {
  const existingIds = ["att-1", "att-2", "att-3"];
  const incomingIds = ["att-1", "att-3"];
  const orphans = getOrphanAttachmentIds(existingIds, incomingIds);
  assertEquals(orphans.length, 1);
  assertEquals(orphans[0], "att-2");
});

Deno.test("content-save - Orphans - should ignore temp IDs", () => {
  const existingIds = ["att-1", "att-2"];
  const incomingIds = ["att-1", "temp-new"];
  const orphans = getOrphanAttachmentIds(existingIds, incomingIds);
  assertEquals(orphans.length, 1);
  assertEquals(orphans[0], "att-2");
});

Deno.test("content-save - Orphans - should return all when incoming is empty", () => {
  const existingIds = ["att-1", "att-2"];
  const incomingIds: string[] = [];
  const orphans = getOrphanAttachmentIds(existingIds, incomingIds);
  assertEquals(orphans.length, 2);
});

Deno.test("content-save - Orphans - should return empty when all kept", () => {
  const existingIds = ["att-1", "att-2"];
  const incomingIds = ["att-1", "att-2"];
  const orphans = getOrphanAttachmentIds(existingIds, incomingIds);
  assertEquals(orphans.length, 0);
});

// ============================================================================
// CONTENT CREATION TESTS
// ============================================================================

Deno.test("content-save - Creation - should calculate next position", () => {
  const existingPositions = [0, 1, 2];
  const nextPos = getNextPosition(existingPositions);
  assertEquals(nextPos, 3);
});

Deno.test("content-save - Creation - should use position 0 when empty", () => {
  const existingPositions: number[] = [];
  const nextPos = getNextPosition(existingPositions);
  assertEquals(nextPos, 0);
});

Deno.test("content-save - Creation - should default content_type to mixed", () => {
  assertEquals(MOCK_CONTENT.content_type, "mixed");
});

Deno.test("content-save - Creation - should default is_active to true", () => {
  assertEquals(MOCK_CONTENT.is_active, true);
});
