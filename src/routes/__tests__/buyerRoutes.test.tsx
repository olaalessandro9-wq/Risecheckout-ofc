/**
 * @file buyerRoutes.test.tsx
 * @description Tests for Buyer Routes configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { buyerRoutes } from "../buyerRoutes";
import { isValidRouteObject } from "./_shared";

describe("buyerRoutes Configuration", () => {
  it("should be defined", () => {
    expect(buyerRoutes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(buyerRoutes)).toBe(true);
  });

  it("should have at least 1 route", () => {
    expect(buyerRoutes.length).toBeGreaterThanOrEqual(1);
  });

  it("all routes should be valid RouteObjects", () => {
    buyerRoutes.forEach((route) => {
      expect(isValidRouteObject(route)).toBe(true);
    });
  });

  it("should have minha-conta route", () => {
    const accountRoute = buyerRoutes.find((r) => 
      r.path?.includes("minha-conta")
    );
    expect(accountRoute).toBeDefined();
  });

  it("all routes should have elements or children", () => {
    buyerRoutes.forEach((route) => {
      expect(route.element || route.children).toBeDefined();
    });
  });
});
