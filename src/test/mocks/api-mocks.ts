/**
 * API Mocks for Testing
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized mocks for API calls used in tests.
 * Provides consistent mock responses for Edge Functions.
 * 
 * @module test/mocks/api-mocks
 */

import { vi } from "vitest";

// ============================================================================
// API Mock Factory
// ============================================================================

/**
 * Creates a mock API call function
 * @param mockResponse - Response to return
 * @returns Mocked API call function
 */
export function createMockApiCall<T>(mockResponse: { data?: T; error?: { message: string } }) {
  return vi.fn().mockResolvedValue(mockResponse);
}

// ============================================================================
// Product CRUD Mocks
// ============================================================================

/**
 * Mock successful product creation
 */
export const mockProductCreateSuccess = {
  data: {
    success: true,
    product: {
      id: "test-product-id-123",
      name: "Produto de Teste",
      price: 9900,
    },
  },
  error: null,
};

/**
 * Mock product creation error
 */
export const mockProductCreateError = {
  data: null,
  error: {
    message: "Erro ao criar produto",
  },
};

/**
 * Mock successful product update
 */
export const mockProductUpdateSuccess = {
  data: {
    success: true,
    product: {
      id: "test-product-id-123",
      name: "Produto Atualizado",
    },
  },
  error: null,
};

/**
 * Mock successful product deletion
 */
export const mockProductDeleteSuccess = {
  data: {
    success: true,
  },
  error: null,
};

// ============================================================================
// Order Bump Mocks
// ============================================================================

/**
 * Mock successful order bump creation
 */
export const mockOrderBumpCreateSuccess = {
  data: {
    success: true,
    order_bump: {
      id: "test-bump-id-123",
      name: "Order Bump de Teste",
      price: 4900,
    },
  },
  error: null,
};

/**
 * Mock order bump creation error
 */
export const mockOrderBumpCreateError = {
  data: null,
  error: {
    message: "Erro ao criar order bump",
  },
};

// ============================================================================
// Coupon Mocks
// ============================================================================

/**
 * Mock successful coupon creation
 */
export const mockCouponCreateSuccess = {
  data: {
    success: true,
    coupon: {
      id: "test-coupon-id-123",
      code: "TESTE10",
      discount_value: 10,
    },
  },
  error: null,
};

/**
 * Mock coupon creation error
 */
export const mockCouponCreateError = {
  data: null,
  error: {
    message: "Código de cupom já existe",
  },
};

// ============================================================================
// API Module Mock
// ============================================================================

/**
 * Creates a complete mock for the @/lib/api module
 * @param customMocks - Custom mock implementations
 * @returns Mock API object
 */
export function createApiMock(customMocks?: Record<string, unknown>) {
  return {
    call: vi.fn().mockResolvedValue({
      data: { success: true },
      error: null,
    }),
    ...customMocks,
  };
}

// ============================================================================
// Logger Mock
// ============================================================================

/**
 * Mock logger for tests
 */
export const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

/**
 * Creates a mock logger factory
 */
export function createMockLogger() {
  return vi.fn().mockReturnValue(mockLogger);
}

// ============================================================================
// Toast Mock
// ============================================================================

/**
 * Mock toast notifications
 */
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

// ============================================================================
// Router Mock
// ============================================================================

/**
 * Mock react-router-dom navigate function
 */
export const mockNavigate = vi.fn();

/**
 * Creates a mock for useNavigate hook
 */
export function createMockUseNavigate() {
  return vi.fn().mockReturnValue(mockNavigate);
}
