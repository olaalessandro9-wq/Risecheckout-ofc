/**
 * ============================================================================
 * Token Normalizer Tests
 * ============================================================================
 * 
 * @module _shared/utmify/tests/token-normalizer.test
 * @version 1.0.0 - RISE Protocol V3
 * ============================================================================
 */

import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeUTMifyToken, computeTokenFingerprint } from "../token-normalizer.ts";

Deno.test("normalizeUTMifyToken - removes tabs and newlines", () => {
  const result = normalizeUTMifyToken("abc\t\n\rdef");
  assertEquals(result.normalized, "abcdef");
  assertArrayIncludes(result.changes, ["removed_tabs_or_newlines"]);
});

Deno.test("normalizeUTMifyToken - removes NBSP (non-breaking space)", () => {
  const result = normalizeUTMifyToken("abc\u00A0def");
  assertEquals(result.normalized, "abcdef");
  assertArrayIncludes(result.changes, ["removed_1_invisible_chars"]);
});

Deno.test("normalizeUTMifyToken - removes zero-width chars", () => {
  const result = normalizeUTMifyToken("abc\u200Bdef");
  assertEquals(result.normalized, "abcdef");
});

Deno.test("normalizeUTMifyToken - removes surrounding quotes (single)", () => {
  const result = normalizeUTMifyToken('"abc123"');
  assertEquals(result.normalized, "abc123");
  assertArrayIncludes(result.changes, ["removed_surrounding_quotes"]);
});

Deno.test("normalizeUTMifyToken - removes surrounding quotes (multiple)", () => {
  const result = normalizeUTMifyToken('""abc123""');
  assertEquals(result.normalized, "abc123");
});

Deno.test("normalizeUTMifyToken - removes mixed quotes", () => {
  const result = normalizeUTMifyToken("'\"abc123\"'");
  assertEquals(result.normalized, "abc123");
});

Deno.test("normalizeUTMifyToken - preserves internal spaces", () => {
  const result = normalizeUTMifyToken("abc def ghi");
  assertEquals(result.normalized, "abc def ghi");
  // Internal spaces should NOT be removed
  assertEquals(result.changes.length, 0);
});

Deno.test("normalizeUTMifyToken - trims edge spaces but preserves internal", () => {
  const result = normalizeUTMifyToken("  abc def  ");
  assertEquals(result.normalized, "abc def");
  assertArrayIncludes(result.changes, ["trimmed_edges"]);
});

Deno.test("normalizeUTMifyToken - handles BOM character", () => {
  const result = normalizeUTMifyToken("\uFEFFabc123");
  assertEquals(result.normalized, "abc123");
});

Deno.test("normalizeUTMifyToken - handles empty string", () => {
  const result = normalizeUTMifyToken("");
  assertEquals(result.normalized, "");
  assertEquals(result.originalLength, 0);
  assertEquals(result.normalizedLength, 0);
});

Deno.test("normalizeUTMifyToken - handles clean token (no changes)", () => {
  const result = normalizeUTMifyToken("abc123xyz");
  assertEquals(result.normalized, "abc123xyz");
  assertEquals(result.changes.length, 0);
});

Deno.test("normalizeUTMifyToken - applies NFKC normalization", () => {
  // ﬁ (ligature) should become fi
  const result = normalizeUTMifyToken("ﬁle");
  assertEquals(result.normalized, "file");
  assertArrayIncludes(result.changes, ["applied_nfkc"]);
});

Deno.test("computeTokenFingerprint - returns 12 char hex string", async () => {
  const fingerprint = await computeTokenFingerprint("test-token-123");
  assertEquals(fingerprint.length, 12);
  // Should be valid hex characters
  assertEquals(/^[0-9a-f]+$/.test(fingerprint), true);
});

Deno.test("computeTokenFingerprint - same input produces same fingerprint", async () => {
  const fp1 = await computeTokenFingerprint("same-token");
  const fp2 = await computeTokenFingerprint("same-token");
  assertEquals(fp1, fp2);
});

Deno.test("computeTokenFingerprint - different input produces different fingerprint", async () => {
  const fp1 = await computeTokenFingerprint("token-a");
  const fp2 = await computeTokenFingerprint("token-b");
  assertEquals(fp1 !== fp2, true);
});
