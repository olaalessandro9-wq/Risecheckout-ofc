/**
 * Shared Test Infrastructure for checkout-editor
 * 
 * @module checkout-editor/tests/_shared
 * @version 2.0.0 - Type-safe factories (zero 'as never')
 * RISE Protocol V3 Compliant
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const FUNCTION_NAME = "checkout-editor";

export const VALID_ACTIONS = ["get-editor-data", "update-design"] as const;

export type ValidAction = typeof VALID_ACTIONS[number];

// ============================================================================
// TYPES
// ============================================================================

export interface EditorPayload {
  action?: string;
  checkoutId?: string;
  design?: DesignData;
  topComponents?: ComponentData[];
  bottomComponents?: ComponentData[];
}

export interface DesignData {
  theme?: string;
  font?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
  };
  backgroundImage?: {
    url?: string;
    expand?: boolean;
    fixed?: boolean;
    repeat?: boolean;
  } | null;
}

export interface ComponentData {
  type: string;
  visible: boolean;
}

export interface MockCheckout {
  id: string;
  product_id: string;
  name?: string;
  is_default?: boolean;
  design?: DesignData | null;
  products?: { user_id: string };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidAction(action: string): action is ValidAction {
  return VALID_ACTIONS.includes(action as ValidAction);
}

export function hasCheckoutOwnership(checkout: MockCheckout, producerId: string): boolean {
  return checkout.products?.user_id === producerId;
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockRequest(body: EditorPayload): Request {
  const url = `https://test.supabase.co/functions/v1/${FUNCTION_NAME}`;
  return new Request(url, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": "Bearer mock-token",
    }),
    body: JSON.stringify(body),
  });
}

export function createMockSupabaseClient(): Record<string, unknown> {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  };
}

export function createMockProducer(): { id: string; email: string } {
  return { id: "producer-123", email: "test@example.com" };
}

export function createMockCheckout(overrides: Partial<MockCheckout> = {}): MockCheckout {
  return {
    id: "checkout-123",
    product_id: "product-123",
    name: "Test Checkout",
    is_default: true,
    design: {
      theme: "modern",
      font: "Inter",
      colors: { primary: "#3B82F6", secondary: "#10B981" },
    },
    products: { user_id: "producer-123" },
    ...overrides,
  };
}
