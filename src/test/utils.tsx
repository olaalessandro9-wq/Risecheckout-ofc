/**
 * Test Utilities - Render Helpers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Custom render functions and test utilities for React components.
 * Wraps components with necessary providers for testing.
 * 
 * @module test/utils
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ============================================================================
// Test Query Client
// ============================================================================

/**
 * Creates a new QueryClient configured for testing
 * Disables retries and caching for predictable test behavior
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Provider Wrapper
// ============================================================================

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * AllTheProviders wraps children with all necessary context providers
 * for testing React components.
 */
function AllTheProviders({ children }: ProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// ============================================================================
// Custom Render
// ============================================================================

/**
 * Custom render function that wraps components with providers
 * 
 * @param ui - The React element to render
 * @param options - Additional render options
 * @returns Render result with all testing-library queries
 * 
 * @example
 * ```typescript
 * import { render, screen } from "@/test/utils";
 * 
 * test("renders component", () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText("Hello")).toBeInTheDocument();
 * });
 * ```
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render with custom render
export { customRender as render };

// Export user-event for interaction testing
export { default as userEvent } from "@testing-library/user-event";

// ============================================================================
// Additional Test Helpers
// ============================================================================

/**
 * Helper to create a user event instance with proper setup
 * @returns Configured userEvent instance
 */
export function setupUser() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const userEvent = require("@testing-library/user-event");
  return userEvent.setup();
}

/**
 * Helper to wait for loading states to resolve
 * @param ms - Milliseconds to wait (default: 0)
 */
export const waitForLoading = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to generate random test data
 */
export const testData = {
  email: () => `test-${Date.now()}@example.com`,
  name: () => `Test User ${Date.now()}`,
  uuid: () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  price: () => Math.floor(Math.random() * 100000) + 100, // 1.00 to 1000.00
};

/**
 * Helper to mock console methods
 * Returns cleanup function
 */
export async function mockConsole(methods: ("log" | "warn" | "error")[]) {
  const { vi } = await import("vitest");
  const originals: Record<string, typeof console.log> = {};
  
  methods.forEach((method) => {
    originals[method] = console[method];
    console[method] = vi.fn() as typeof console.log;
  });

  return () => {
    methods.forEach((method) => {
      console[method] = originals[method];
    });
  };
}
