/**
 * @file _mocks.ts
 * @description Mock utilities for Pixels module
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { vi } from "vitest";
import type { PixelsMachineContext } from "../machines/types";
import { initialPixelsContext } from "../machines/types";
import { mockVendorPixels } from "./_fixtures";

// ============================================================================
// CONTEXT MOCKS
// ============================================================================

/**
 * Creates a mock PixelsMachineContext with custom overrides
 */
export function createMockPixelsContext(
  overrides: Partial<PixelsMachineContext> = {}
): PixelsMachineContext {
  return {
    ...initialPixelsContext,
    ...overrides,
  };
}

/**
 * Mock context with loaded pixels
 */
export const mockLoadedContext: PixelsMachineContext = {
  ...initialPixelsContext,
  pixels: mockVendorPixels,
  lastRefreshAt: Date.now(),
};

/**
 * Mock context with error
 */
export const mockErrorContext: PixelsMachineContext = {
  ...initialPixelsContext,
  error: "Failed to load pixels",
};

/**
 * Mock context with form open (create mode)
 */
export const mockFormOpenContext: PixelsMachineContext = {
  ...initialPixelsContext,
  pixels: mockVendorPixels,
  isFormOpen: true,
  editingPixel: null,
};

/**
 * Mock context with form open (edit mode)
 */
export const mockFormEditContext: PixelsMachineContext = {
  ...initialPixelsContext,
  pixels: mockVendorPixels,
  isFormOpen: true,
  editingPixel: mockVendorPixels[0],
};

/**
 * Mock context with delete confirmation
 */
export const mockDeleteContext: PixelsMachineContext = {
  ...initialPixelsContext,
  pixels: mockVendorPixels,
  deletingPixel: mockVendorPixels[0],
};

/**
 * Mock context with saving state
 */
export const mockSavingContext: PixelsMachineContext = {
  ...initialPixelsContext,
  pixels: mockVendorPixels,
  isFormOpen: true,
  isSaving: true,
};

// ============================================================================
// CONTEXT PROVIDER MOCK
// ============================================================================

/**
 * Mock PixelsContext value for testing components
 */
export function createMockPixelsContextValue(
  overrides: Partial<{
    context: PixelsMachineContext;
    send: ReturnType<typeof vi.fn>;
    isLoading: boolean;
    isError: boolean;
  }> = {}
) {
  return {
    context: mockLoadedContext,
    send: vi.fn(),
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

// ============================================================================
// API MOCKS
// ============================================================================

/**
 * Mock successful API response for loading pixels
 */
export const mockLoadPixelsSuccess = {
  data: mockVendorPixels,
  error: null,
};

/**
 * Mock error API response for loading pixels
 */
export const mockLoadPixelsError = {
  data: null,
  error: { message: "Failed to load pixels" },
};

/**
 * Mock successful API response for saving pixel
 */
export const mockSavePixelSuccess = {
  data: { success: true },
  error: null,
};

/**
 * Mock error API response for saving pixel
 */
export const mockSavePixelError = {
  data: null,
  error: { message: "Failed to save pixel" },
};

/**
 * Mock successful API response for deleting pixel
 */
export const mockDeletePixelSuccess = {
  data: { success: true },
  error: null,
};

/**
 * Mock error API response for deleting pixel
 */
export const mockDeletePixelError = {
  data: null,
  error: { message: "Failed to delete pixel" },
};
