/**
 * Pagination Tests for get-users-with-emails
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculatePagination, filterBySearch, filterByStatus } from "./_shared.ts";

Deno.test("get-users - pagination offset", () => assertEquals(calculatePagination(100, 1, 20).offset, 0));
Deno.test("get-users - pagination totalPages", () => assertEquals(calculatePagination(100, 1, 20).totalPages, 5));
Deno.test("get-users - pagination page 3", () => assertEquals(calculatePagination(100, 3, 20).offset, 40));
const mockUsers = [{email: "alice@test.com", name: "Alice", account_status: "active"}];
Deno.test("get-users - search by email", () => assertEquals(filterBySearch(mockUsers, "alice").length, 1));
Deno.test("get-users - search empty returns all", () => assertEquals(filterBySearch(mockUsers, "").length, 1));
Deno.test("get-users - filter by status", () => assertEquals(filterByStatus(mockUsers, "active").length, 1));
Deno.test("get-users - filter all returns all", () => assertEquals(filterByStatus(mockUsers, "all").length, 1));
