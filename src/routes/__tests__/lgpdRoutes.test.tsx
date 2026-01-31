/**
 * @file lgpdRoutes.test.tsx
 * @description Tests for LGPD Routes configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { lgpdRoutes } from "../lgpdRoutes";
import { isValidRouteObject } from "./_shared";

describe("lgpdRoutes Configuration", () => {
  it("should be defined", () => {
    expect(lgpdRoutes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(lgpdRoutes)).toBe(true);
  });

  it("should have at least 2 routes", () => {
    expect(lgpdRoutes.length).toBeGreaterThanOrEqual(2);
  });

  it("all routes should be valid RouteObjects", () => {
    lgpdRoutes.forEach((route) => {
      expect(isValidRouteObject(route)).toBe(true);
    });
  });

  it("should have GDPR request route", () => {
    const requestRoute = lgpdRoutes.find((r) => 
      r.path?.includes("esquecimento")
    );
    expect(requestRoute).toBeDefined();
  });

  it("should have GDPR confirm route", () => {
    const confirmRoute = lgpdRoutes.find((r) => 
      r.path?.includes("confirmar")
    );
    expect(confirmRoute).toBeDefined();
  });

  it("all routes should have elements", () => {
    lgpdRoutes.forEach((route) => {
      expect(route.element).toBeDefined();
    });
  });
});
