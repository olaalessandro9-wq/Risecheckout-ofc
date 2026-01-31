/**
 * @file builderRoutes.test.tsx
 * @description Tests for Builder Routes configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { builderRoutes } from "../builderRoutes";
import { isValidRouteObject } from "./_shared";

describe("builderRoutes Configuration", () => {
  it("should be defined", () => {
    expect(builderRoutes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(builderRoutes)).toBe(true);
  });

  it("should have at least 2 routes", () => {
    expect(builderRoutes.length).toBeGreaterThanOrEqual(2);
  });

  it("all routes should be valid RouteObjects", () => {
    builderRoutes.forEach((route) => {
      expect(isValidRouteObject(route)).toBe(true);
    });
  });

  it("should have checkout customizer route", () => {
    const customizerRoute = builderRoutes.find((r) => 
      r.path?.includes("personalizar")
    );
    expect(customizerRoute).toBeDefined();
  });

  it("should have members area builder route", () => {
    const membersRoute = builderRoutes.find((r) => 
      r.path?.includes("members-area/builder")
    );
    expect(membersRoute).toBeDefined();
  });

  it("all routes should have elements", () => {
    builderRoutes.forEach((route) => {
      expect(route.element).toBeDefined();
    });
  });
});
