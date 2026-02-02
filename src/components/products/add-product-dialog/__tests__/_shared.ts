/**
 * Shared Test Utilities for AddProductDialog
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized mocks and setup for useAddProduct tests.
 * 
 * @module components/products/add-product-dialog/__tests__/_shared
 */

import { vi } from "vitest";
import { mockProductCreateSuccess } from "@/test/mocks/api-mocks";
import * as apiModule from "@/lib/api";

/**
 * Setup all mocks for useAddProduct tests
 */
export function setupMocks() {
  const mockApiCall = vi.fn().mockResolvedValue(mockProductCreateSuccess);
  (apiModule.api as { call: typeof mockApiCall }).call = mockApiCall;
  
  return { mockApiCall };
}

/**
 * Mock dependencies
 */
export function mockDependencies() {
  vi.mock("@/lib/api");
  vi.mock("react-router-dom", async () => ({
    useNavigate: vi.fn(() => vi.fn()),
  }));
  vi.mock("sonner", () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }));
  vi.mock("@/lib/logger", () => ({
    createLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  }));
}

/**
 * Default props for useAddProduct hook
 */
export function getDefaultProps() {
  return {
    onOpenChange: vi.fn(),
    onProductAdded: vi.fn(),
  };
}
