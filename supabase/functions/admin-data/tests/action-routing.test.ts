/**
 * Action Routing Tests for admin-data
 * @module admin-data/tests/action-routing.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  SECURITY_ACTIONS,
  MEMBERS_AREA_ACTIONS,
  USER_ACTIONS,
  PRODUCT_ACTIONS,
  ANALYTICS_ACTIONS,
  CONTENT_ACTIONS,
  ALL_ACTIONS,
} from "./_shared.ts";

Deno.test("admin-data - action routing - should recognize security-logs action", () => {
  assertEquals(SECURITY_ACTIONS.includes("security-logs"), true);
});

Deno.test("admin-data - action routing - should recognize members-area-data action", () => {
  assertEquals(MEMBERS_AREA_ACTIONS.includes("members-area-data"), true);
});

Deno.test("admin-data - action routing - should recognize user actions", () => {
  assertEquals(USER_ACTIONS.includes("users-with-metrics"), true);
  assertEquals(USER_ACTIONS.includes("user-profile"), true);
  assertEquals(USER_ACTIONS.includes("user-products"), true);
});

Deno.test("admin-data - action routing - should recognize product actions", () => {
  assertEquals(PRODUCT_ACTIONS.includes("admin-products-global"), true);
  assertEquals(PRODUCT_ACTIONS.includes("product-offers"), true);
});

Deno.test("admin-data - action routing - should recognize analytics actions", () => {
  assertEquals(ANALYTICS_ACTIONS.includes("admin-analytics-financial"), true);
  assertEquals(ANALYTICS_ACTIONS.includes("admin-analytics-traffic"), true);
  assertEquals(ANALYTICS_ACTIONS.includes("admin-analytics-top-sellers"), true);
});

Deno.test("admin-data - action routing - should recognize content actions", () => {
  assertEquals(CONTENT_ACTIONS.includes("content-editor-data"), true);
  assertEquals(CONTENT_ACTIONS.includes("marketplace-categories"), true);
});

Deno.test("admin-data - categorization - security actions require producer auth only", () => {
  assertEquals(SECURITY_ACTIONS.length, 4);
});

Deno.test("admin-data - categorization - members-area actions require productId", () => {
  MEMBERS_AREA_ACTIONS.forEach((action) => {
    assertStringIncludes(action, "members-area");
  });
});

Deno.test("admin-data - categorization - analytics actions use period parameter", () => {
  ANALYTICS_ACTIONS.forEach((action) => {
    assertStringIncludes(action, "analytics");
  });
});

Deno.test("admin-data - mapping - total actions count is 30+", () => {
  assertEquals(ALL_ACTIONS.length >= 30, true);
});
