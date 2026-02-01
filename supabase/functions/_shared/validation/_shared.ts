/**
 * Validation Testing Infrastructure - RISE V3 Compliant
 * 
 * Type-safe mock factories for validation module tests.
 * 
 * @module _shared/validation/_shared
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SecurityViolation, OrderRecord, CustomerData } from "./types.ts";

// ============================================================================
// MOCK TYPES
// ============================================================================

/**
 * Insert result returned by Supabase client
 */
export interface MockInsertResult {
  error: Error | null;
}

/**
 * Chain methods for from().insert()
 */
export interface MockFromChain {
  insert: (data: Record<string, unknown>) => MockInsertResult;
  select: () => MockSelectChain;
}

/**
 * Select chain for queries
 */
export interface MockSelectChain {
  eq: (column: string, value: string) => MockSelectChain;
  single: () => Promise<{ data: OrderRecord | null; error: Error | null }>;
}

/**
 * Minimal Supabase client interface for validation tests
 */
export interface MockValidationSupabaseClient {
  from: (table: string) => MockFromChain;
}

// ============================================================================
// MOCK SUPABASE CLIENT FACTORY
// ============================================================================

export interface CreateMockSupabaseOptions {
  /**
   * If true, database operations will return errors
   */
  shouldFail?: boolean;
  
  /**
   * Custom insert handler for assertions
   */
  onInsert?: (table: string, data: Record<string, unknown>) => void;
  
  /**
   * Custom from handler for assertions
   */
  onFrom?: (table: string) => void;
  
  /**
   * Order data to return from select queries
   */
  orderData?: OrderRecord | null;
}

/**
 * Creates a type-safe mock Supabase client for validation tests.
 * 
 * The mock implements the minimal interface required by validation functions,
 * avoiding unsafe `as never` casts while maintaining full test control.
 * 
 * @param options Configuration options for the mock
 * @returns Type-compatible Supabase client subset
 */
export function createMockSupabase(
  options: CreateMockSupabaseOptions = {}
): SupabaseClient {
  const { 
    shouldFail = false, 
    onInsert, 
    onFrom,
    orderData = null 
  } = options;
  
  const mockClient: MockValidationSupabaseClient = {
    from: (table: string) => {
      if (onFrom) {
        onFrom(table);
      }
      
      return {
        insert: (data: Record<string, unknown>) => {
          if (onInsert) {
            onInsert(table, data);
          }
          
          if (shouldFail) {
            return { error: new Error("Database error") };
          }
          return { error: null };
        },
        select: () => ({
          eq: function(column: string, value: string) {
            return this;
          },
          single: async () => {
            if (shouldFail) {
              return { data: null, error: new Error("Database error") };
            }
            return { data: orderData, error: null };
          },
        }),
      };
    },
  };
  
  // Cast through unknown to satisfy SupabaseClient type
  // This is the ONLY place where casting happens - centralized and controlled
  return mockClient as unknown as SupabaseClient;
}

// ============================================================================
// SECURITY VIOLATION FACTORIES
// ============================================================================

/**
 * Creates a minimal security violation for testing
 */
export function createMinimalViolation(
  overrides: Partial<SecurityViolation> = {}
): SecurityViolation {
  return {
    type: "order_not_found",
    orderId: `order-${Date.now()}`,
    gateway: "stripe",
    ...overrides,
  };
}

/**
 * Creates a price tampering violation for testing
 */
export function createPriceTamperingViolation(
  overrides: Partial<SecurityViolation> = {}
): SecurityViolation {
  return {
    type: "price_tampering",
    orderId: `order-${Date.now()}`,
    gateway: "mercadopago",
    expectedAmount: 10000,
    actualAmount: 5000,
    clientIp: "192.168.1.1",
    details: "Price mismatch detected",
    ...overrides,
  };
}

/**
 * Creates an order not found violation for testing
 */
export function createOrderNotFoundViolation(
  overrides: Partial<SecurityViolation> = {}
): SecurityViolation {
  return {
    type: "order_not_found",
    orderId: `order-${Date.now()}`,
    gateway: "stripe",
    clientIp: "10.0.0.1",
    details: "Order does not exist in database",
    ...overrides,
  };
}

/**
 * Creates an order status invalid violation for testing
 */
export function createOrderStatusInvalidViolation(
  overrides: Partial<SecurityViolation> = {}
): SecurityViolation {
  return {
    type: "order_status_invalid",
    orderId: `order-${Date.now()}`,
    gateway: "asaas",
    clientIp: "172.16.0.1",
    details: "Order status is 'completed'",
    ...overrides,
  };
}

/**
 * Creates a validation failed violation for testing
 */
export function createValidationFailedViolation(
  overrides: Partial<SecurityViolation> = {}
): SecurityViolation {
  return {
    type: "validation_failed",
    orderId: `order-${Date.now()}`,
    gateway: "mercadopago",
    details: "Customer data validation failed",
    ...overrides,
  };
}

// ============================================================================
// ORDER RECORD FACTORIES
// ============================================================================

/**
 * Creates a mock order record for testing
 */
export function createMockOrderRecord(
  overrides: Partial<OrderRecord> = {}
): OrderRecord {
  return {
    id: `order-${Date.now()}`,
    amount_cents: 10000,
    status: "pending",
    vendor_id: `vendor-${Date.now()}`,
    product_id: `product-${Date.now()}`,
    customer_email: "test@example.com",
    ...overrides,
  };
}

// ============================================================================
// CUSTOMER DATA FACTORIES
// ============================================================================

/**
 * Creates mock customer data for testing
 */
export function createMockCustomerData(
  overrides: Partial<CustomerData> = {}
): CustomerData {
  return {
    name: "Test Customer",
    email: "test@example.com",
    document: "12345678901",
    phone: "+5511999999999",
    ...overrides,
  };
}

/**
 * Creates minimal customer data (required fields only)
 */
export function createMinimalCustomerData(
  overrides: Partial<CustomerData> = {}
): CustomerData {
  return {
    name: "Test Customer",
    email: "test@example.com",
    ...overrides,
  };
}
