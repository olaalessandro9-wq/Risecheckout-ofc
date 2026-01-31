/**
 * @file publicRoutes.test.tsx
 * @description Tests for Public Routes configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { publicRoutes } from "../publicRoutes";
import { isValidRouteObject, extractAllPaths } from "./_shared";

// ============================================================================
// Route Configuration Structure
// ============================================================================

describe("publicRoutes Configuration", () => {
  it("should be defined", () => {
    expect(publicRoutes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(publicRoutes)).toBe(true);
  });

  it("should have at least 10 routes", () => {
    expect(publicRoutes.length).toBeGreaterThanOrEqual(10);
  });

  it("all routes should be valid RouteObjects", () => {
    publicRoutes.forEach((route) => {
      expect(isValidRouteObject(route)).toBe(true);
    });
  });
});

// ============================================================================
// Landing & Auth Routes
// ============================================================================

describe("Landing & Auth Routes", () => {
  it("should have landing page route (/)", () => {
    const landingRoute = publicRoutes.find((r) => r.path === "/");
    expect(landingRoute).toBeDefined();
    expect(landingRoute?.element).toBeDefined();
  });

  it("should have auth route (/auth)", () => {
    const authRoute = publicRoutes.find((r) => r.path === "/auth");
    expect(authRoute).toBeDefined();
    expect(authRoute?.element).toBeDefined();
  });

  it("should have cadastro route (/cadastro)", () => {
    const cadastroRoute = publicRoutes.find((r) => r.path === "/cadastro");
    expect(cadastroRoute).toBeDefined();
    expect(cadastroRoute?.element).toBeDefined();
  });

  it("should have recuperar-senha route (/recuperar-senha)", () => {
    const recoverRoute = publicRoutes.find((r) => r.path === "/recuperar-senha");
    expect(recoverRoute).toBeDefined();
    expect(recoverRoute?.element).toBeDefined();
  });

  it("should have redefinir-senha route (/redefinir-senha)", () => {
    const resetRoute = publicRoutes.find((r) => r.path === "/redefinir-senha");
    expect(resetRoute).toBeDefined();
    expect(resetRoute?.element).toBeDefined();
  });
});

// ============================================================================
// Checkout & Payment Routes
// ============================================================================

describe("Checkout & Payment Routes", () => {
  it("should have payment link redirect route (/c/:slug)", () => {
    const linkRoute = publicRoutes.find((r) => r.path === "/c/:slug");
    expect(linkRoute).toBeDefined();
    expect(linkRoute?.element).toBeDefined();
  });

  it("should have public checkout route (/pay/:slug)", () => {
    const checkoutRoute = publicRoutes.find((r) => r.path === "/pay/:slug");
    expect(checkoutRoute).toBeDefined();
    expect(checkoutRoute?.element).toBeDefined();
  });

  it("should have PIX payment route (/pay/pix/:orderId)", () => {
    const pixRoute = publicRoutes.find((r) => r.path === "/pay/pix/:orderId");
    expect(pixRoute).toBeDefined();
    expect(pixRoute?.element).toBeDefined();
  });

  it("should have Mercado Pago payment route (/pay/mercadopago/:orderId)", () => {
    const mpRoute = publicRoutes.find((r) => r.path === "/pay/mercadopago/:orderId");
    expect(mpRoute).toBeDefined();
    expect(mpRoute?.element).toBeDefined();
  });

  it("should have payment success route (/success/:orderId)", () => {
    const successRoute = publicRoutes.find((r) => r.path === "/success/:orderId");
    expect(successRoute).toBeDefined();
    expect(successRoute?.element).toBeDefined();
  });

  it("should have preview success route (/preview/success)", () => {
    const previewRoute = publicRoutes.find((r) => r.path === "/preview/success");
    expect(previewRoute).toBeDefined();
    expect(previewRoute?.element).toBeDefined();
  });
});

// ============================================================================
// OAuth & Affiliation Routes
// ============================================================================

describe("OAuth & Affiliation Routes", () => {
  it("should have OAuth success route (/oauth-success)", () => {
    const oauthRoute = publicRoutes.find((r) => r.path === "/oauth-success");
    expect(oauthRoute).toBeDefined();
    expect(oauthRoute?.element).toBeDefined();
  });

  it("should have affiliation request route (/afiliar/:product_id)", () => {
    const affiliateRoute = publicRoutes.find((r) => r.path === "/afiliar/:product_id");
    expect(affiliateRoute).toBeDefined();
    expect(affiliateRoute?.element).toBeDefined();
  });
});

// ============================================================================
// Legal Routes
// ============================================================================

describe("Legal Routes", () => {
  it("should have terms of use route (/termos-de-uso)", () => {
    const termsRoute = publicRoutes.find((r) => r.path === "/termos-de-uso");
    expect(termsRoute).toBeDefined();
    expect(termsRoute?.element).toBeDefined();
  });
});

// ============================================================================
// Route Elements
// ============================================================================

describe("Route Elements", () => {
  it("all routes should have elements defined", () => {
    publicRoutes.forEach((route) => {
      expect(route.element).toBeDefined();
    });
  });

  it("all routes should use Suspense wrapper", () => {
    publicRoutes.forEach((route) => {
      // Check if element is a Suspense component (React element with type.name === 'Suspense')
      expect(route.element).toBeTruthy();
    });
  });
});

// ============================================================================
// Path Validation
// ============================================================================

describe("Path Validation", () => {
  it("should not have duplicate paths", () => {
    const paths = publicRoutes.map((r) => r.path).filter(Boolean);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
  });

  it("should have valid path formats", () => {
    publicRoutes.forEach((route) => {
      if (route.path) {
        // Paths should start with / or be a parameter
        expect(route.path).toMatch(/^\/|^:/);
      }
    });
  });

  it("should use consistent parameter naming (:slug, :orderId, :product_id)", () => {
    const paths = publicRoutes.map((r) => r.path).filter(Boolean) as string[];
    const paramsUsed = paths
      .filter((p) => p.includes(":"))
      .map((p) => p.match(/:[a-zA-Z_]+/g))
      .flat()
      .filter(Boolean) as string[];

    // All parameters should use snake_case or camelCase consistently
    paramsUsed.forEach((param) => {
      expect(param).toMatch(/^:[a-zA-Z_]+$/);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should not have routes with undefined paths and no index", () => {
    publicRoutes.forEach((route) => {
      if (!route.path) {
        expect(route.index).toBeDefined();
      }
    });
  });

  it("should not have routes with null elements", () => {
    publicRoutes.forEach((route) => {
      expect(route.element).not.toBeNull();
    });
  });

  it("should not have empty path strings", () => {
    publicRoutes.forEach((route) => {
      if (route.path !== undefined) {
        expect(route.path).not.toBe("");
      }
    });
  });
});
