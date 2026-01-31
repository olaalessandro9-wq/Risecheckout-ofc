/**
 * @file index.test.ts
 * @description Tests for Routes Module Exports
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import * as RoutesModule from "../index";

describe("Routes Module Exports", () => {
  it("should export publicRoutes", () => {
    expect(RoutesModule.publicRoutes).toBeDefined();
    expect(Array.isArray(RoutesModule.publicRoutes)).toBe(true);
  });

  it("should export dashboardRoutes", () => {
    expect(RoutesModule.dashboardRoutes).toBeDefined();
    expect(Array.isArray(RoutesModule.dashboardRoutes)).toBe(true);
  });

  it("should export builderRoutes", () => {
    expect(RoutesModule.builderRoutes).toBeDefined();
    expect(Array.isArray(RoutesModule.builderRoutes)).toBe(true);
  });

  it("should export buyerRoutes", () => {
    expect(RoutesModule.buyerRoutes).toBeDefined();
    expect(Array.isArray(RoutesModule.buyerRoutes)).toBe(true);
  });

  it("should export lgpdRoutes", () => {
    expect(RoutesModule.lgpdRoutes).toBeDefined();
    expect(Array.isArray(RoutesModule.lgpdRoutes)).toBe(true);
  });

  it("should have at least 5 exports", () => {
    const exportedKeys = Object.keys(RoutesModule);
    expect(exportedKeys.length).toBeGreaterThanOrEqual(5);
  });
});
