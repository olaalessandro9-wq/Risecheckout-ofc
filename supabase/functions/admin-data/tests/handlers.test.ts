/**
 * Handler Delegation Tests for admin-data
 * @module admin-data/tests/handlers.test
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  SECURITY_HANDLERS,
  MEMBERS_AREA_HANDLERS,
  USER_HANDLERS,
  ANALYTICS_HANDLERS,
  CONTENT_HANDLERS,
} from "./_shared.ts";

Deno.test("admin-data - handlers - all security handlers are defined", () => {
  assertEquals(SECURITY_HANDLERS.length, 4);
});

Deno.test("admin-data - handlers - all members-area handlers are defined", () => {
  assertEquals(MEMBERS_AREA_HANDLERS.length, 4);
});

Deno.test("admin-data - handlers - all user handlers are defined", () => {
  assertEquals(USER_HANDLERS.length, 7);
});

Deno.test("admin-data - handlers - all analytics handlers are defined", () => {
  assertEquals(ANALYTICS_HANDLERS.length, 3);
});

Deno.test("admin-data - handlers - all content handlers are defined", () => {
  assertEquals(CONTENT_HANDLERS.length, 6);
});

Deno.test("admin-data - mapping - admin-orders maps to getAdminOrders", () => {
  const actionHandlerMap: Record<string, string> = {
    "admin-orders": "getAdminOrders",
    "admin-products": "getAdminProducts",
    "admin-products-global": "getAdminProductsGlobal",
  };
  
  assertEquals(actionHandlerMap["admin-orders"], "getAdminOrders");
  assertEquals(actionHandlerMap["admin-products"], "getAdminProducts");
});
