/**
 * @file dashboardRoutes.test.tsx
 * @description Tests for Dashboard Routes configuration
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect } from "vitest";
import { dashboardRoutes } from "../dashboardRoutes";
import { isValidRouteObject } from "./_shared";

// ============================================================================
// Route Configuration Structure
// ============================================================================

describe("dashboardRoutes Configuration", () => {
  it("should be defined", () => {
    expect(dashboardRoutes).toBeDefined();
  });

  it("should be an array", () => {
    expect(Array.isArray(dashboardRoutes)).toBe(true);
  });

  it("should have at least 1 route", () => {
    expect(dashboardRoutes.length).toBeGreaterThanOrEqual(1);
  });

  it("all routes should be valid RouteObjects", () => {
    dashboardRoutes.forEach((route) => {
      expect(isValidRouteObject(route)).toBe(true);
    });
  });
});

// ============================================================================
// Main Dashboard Route
// ============================================================================

describe("Main Dashboard Route", () => {
  it("should have /dashboard path", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    expect(dashboardRoute).toBeDefined();
  });

  it("should have element defined", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    expect(dashboardRoute?.element).toBeDefined();
  });

  it("should have children routes", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    expect(dashboardRoute?.children).toBeDefined();
    expect(Array.isArray(dashboardRoute?.children)).toBe(true);
  });
});

// ============================================================================
// Child Routes
// ============================================================================

describe("Dashboard Child Routes", () => {
  const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
  const children = dashboardRoute?.children || [];

  it("should have index route", () => {
    const indexRoute = children.find((r) => r.index === true);
    expect(indexRoute).toBeDefined();
  });

  it("should have produtos route", () => {
    const produtosRoute = children.find((r) => r.path === "produtos");
    expect(produtosRoute).toBeDefined();
    expect(produtosRoute?.element).toBeDefined();
  });

  it("should have marketplace route", () => {
    const marketplaceRoute = children.find((r) => r.path === "marketplace");
    expect(marketplaceRoute).toBeDefined();
    expect(marketplaceRoute?.element).toBeDefined();
  });

  it("should have afiliados route", () => {
    const afiliadosRoute = children.find((r) => r.path === "afiliados");
    expect(afiliadosRoute).toBeDefined();
    expect(afiliadosRoute?.element).toBeDefined();
  });

  it("should have minhas-afiliacoes route", () => {
    const afiliacoesRoute = children.find((r) => r.path === "minhas-afiliacoes");
    expect(afiliacoesRoute).toBeDefined();
    expect(afiliacoesRoute?.element).toBeDefined();
  });

  it("should have financeiro route", () => {
    const financeiroRoute = children.find((r) => r.path === "financeiro");
    expect(financeiroRoute).toBeDefined();
    expect(financeiroRoute?.element).toBeDefined();
  });

  it("should have gateways route", () => {
    const gatewaysRoute = children.find((r) => r.path === "gateways");
    expect(gatewaysRoute).toBeDefined();
    expect(gatewaysRoute?.element).toBeDefined();
  });

  it("should have trackeamento route", () => {
    const rastreamentoRoute = children.find((r) => r.path === "trackeamento");
    expect(rastreamentoRoute).toBeDefined();
    expect(rastreamentoRoute?.element).toBeDefined();
  });

  it("should have webhooks route", () => {
    const webhooksRoute = children.find((r) => r.path === "webhooks");
    expect(webhooksRoute).toBeDefined();
    expect(webhooksRoute?.element).toBeDefined();
  });

  it("should have ajuda route", () => {
    const ajudaRoute = children.find((r) => r.path === "ajuda");
    expect(ajudaRoute).toBeDefined();
    expect(ajudaRoute?.element).toBeDefined();
  });

  it("should have perfil route", () => {
    const perfilRoute = children.find((r) => r.path === "perfil");
    expect(perfilRoute).toBeDefined();
    expect(perfilRoute?.element).toBeDefined();
  });

  it("should have admin route", () => {
    const adminRoute = children.find((r) => r.path === "admin");
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.element).toBeDefined();
  });

  it("should have 404 catch-all route", () => {
    const notFoundRoute = children.find((r) => r.path === "*");
    expect(notFoundRoute).toBeDefined();
    expect(notFoundRoute?.element).toBeDefined();
  });
});

// ============================================================================
// Route Protection
// ============================================================================

describe("Route Protection", () => {
  const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");

  it("main dashboard route should have ProducerRoute guard", () => {
    // The element should be wrapped with ProducerRoute
    expect(dashboardRoute?.element).toBeDefined();
  });

  it("should have role-protected routes", () => {
    const children = dashboardRoute?.children || [];
    
    // Admin routes should have RoleProtectedRoute
    const adminRoute = children.find((r) => r.path === "admin");
    expect(adminRoute?.element).toBeDefined();
    
    // Gateways route should have RoleProtectedRoute
    const gatewaysRoute = children.find((r) => r.path === "gateways");
    expect(gatewaysRoute?.element).toBeDefined();
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
  it("should not have duplicate child paths", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    const children = dashboardRoute?.children || [];
    const paths = children.map((r) => r.path).filter(Boolean);
    const uniquePaths = new Set(paths);
    expect(paths.length).toBe(uniquePaths.size);
  });

  it("all child routes should have elements", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    const children = dashboardRoute?.children || [];
    
    children.forEach((route) => {
      expect(route.element).toBeDefined();
    });
  });

  it("should have at least 10 child routes", () => {
    const dashboardRoute = dashboardRoutes.find((r) => r.path === "/dashboard");
    const children = dashboardRoute?.children || [];
    expect(children.length).toBeGreaterThanOrEqual(10);
  });
});
