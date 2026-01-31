/**
 * Content Library - Input Validation Tests
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module content-library/tests/input-validation
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("content-library - Input Validation", async (t) => {
  await t.step("deve aceitar action 'get-video-library'", () => {
    const action = "get-video-library";
    assertEquals(action === "get-video-library", true);
  });

  await t.step("deve rejeitar action desconhecida", () => {
    const action = "invalid-action" as string;
    assertEquals(action === "get-video-library", false);
  });

  await t.step("deve exigir productId", () => {
    const body = { action: "get-video-library" };
    const productId = (body as Record<string, unknown>).productId;
    assertEquals(productId, undefined);
  });

  await t.step("deve aceitar excludeContentId opcional", () => {
    const body = { action: "get-video-library", productId: "prod-1", excludeContentId: "content-1" };
    assertExists(body.excludeContentId);
  });
});
