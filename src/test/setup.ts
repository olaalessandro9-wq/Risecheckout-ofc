/**
 * Test Setup - Global Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This file runs before each test file.
 * Sets up DOM mocks, testing library matchers, and global utilities.
 * 
 * @module test/setup
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// ============================================================================
// MSW Server Lifecycle
// ============================================================================

beforeAll(() => {
  // Start MSW server before all tests
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  // Clean up React Testing Library after each test
  cleanup();
  // Reset MSW handlers to defaults
  server.resetHandlers();
});

afterAll(() => {
  // Stop MSW server after all tests
  server.close();
});

// ============================================================================
// DOM API Mocks
// ============================================================================

/**
 * Mock window.matchMedia
 * Required for components using media queries
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

/**
 * Mock ResizeObserver
 * Required for components observing element sizes
 */
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * Mock IntersectionObserver
 * Required for lazy loading and visibility detection
 */
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

/**
 * Mock window.scrollTo
 * Prevents errors from scroll operations in tests
 */
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

/**
 * Mock navigator.clipboard
 * Required for copy-to-clipboard functionality
 */
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
});

// ============================================================================
// Console Suppression (Optional - Enable for cleaner test output)
// ============================================================================

// Uncomment to suppress expected console warnings during tests
// const originalConsoleError = console.error;
// console.error = (...args: unknown[]) => {
//   if (
//     typeof args[0] === "string" &&
//     args[0].includes("Warning: ReactDOM.render")
//   ) {
//     return;
//   }
//   originalConsoleError(...args);
// };

// ============================================================================
// Global Test Utilities
// ============================================================================

/**
 * Helper to wait for async operations
 */
export const waitForAsync = (ms = 0) => 
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to flush all pending promises
 */
export const flushPromises = () => 
  new Promise((resolve) => setImmediate(resolve));
