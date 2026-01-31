/**
 * @file _shared.ts
 * @description Shared utilities and mocks for routes tests
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";
import type { RouteObject } from "react-router-dom";

// ============================================================================
// MOCK LAZY COMPONENTS
// ============================================================================

/**
 * Creates a mock lazy-loaded component name for testing
 */
export function createMockComponentName(name: string): string {
  return `Mock${name}`;
}

// ============================================================================
// ROUTE VALIDATION HELPERS
// ============================================================================

/**
 * Validates that a route object has required fields
 */
export function isValidRouteObject(route: RouteObject): boolean {
  return (
    (route.path !== undefined || route.index === true) &&
    (route.element !== undefined || route.children !== undefined)
  );
}

/**
 * Extracts all paths from a route configuration (including nested)
 */
export function extractAllPaths(routes: RouteObject[], parentPath = ""): string[] {
  const paths: string[] = [];

  routes.forEach((route) => {
    if (route.path) {
      const fullPath = parentPath + "/" + route.path;
      paths.push(fullPath.replace(/\/+/g, "/"));
    }

    if (route.children) {
      const childPaths = extractAllPaths(
        route.children,
        route.path ? parentPath + "/" + route.path : parentPath
      );
      paths.push(...childPaths);
    }
  });

  return paths;
}

/**
 * Counts total number of routes (including nested)
 */
export function countTotalRoutes(routes: RouteObject[]): number {
  let count = routes.length;

  routes.forEach((route) => {
    if (route.children) {
      count += countTotalRoutes(route.children);
    }
  });

  return count;
}

// ============================================================================
// MOCK MODULES
// ============================================================================

/**
 * Mock for lazyWithRetry utility
 */
export const mockLazyWithRetry = vi.fn((loader) => loader);
