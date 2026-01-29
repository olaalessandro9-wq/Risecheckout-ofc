/**
 * MSW Request Handlers
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Defines mock API handlers for testing.
 * Organized by domain: auth, orders, products, etc.
 * 
 * @module test/mocks/handlers
 */

import { http, HttpResponse } from "msw";
import { domainHandlers } from "./handlers/index";

// ============================================================================
// Constants
// ============================================================================

const API_URL = "https://api.risecheckout.com/functions/v1";
const SUPABASE_URL = "https://wivbtmtgpsxupfjwwovf.supabase.co";

// ============================================================================
// Mock Data Factories
// ============================================================================

export const mockUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  timezone: "America/Sao_Paulo",
};

export const mockProduct = {
  id: "test-product-id-456",
  name: "Test Product",
  description: "A test product",
  price: 9990, // R$ 99,90 in cents
  status: "active",
};

export const mockCheckout = {
  id: "test-checkout-id-789",
  name: "Test Checkout",
  product_id: mockProduct.id,
  status: "active",
};

// ============================================================================
// Auth Handlers
// ============================================================================

const authHandlers = [
  // Validate session
  http.post(`${API_URL}/unified-auth/validate`, () => {
    return HttpResponse.json({
      valid: false,
    });
  }),

  // Login
  http.post(`${API_URL}/unified-auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        user: mockUser,
        roles: ["seller"],
        activeRole: "seller",
        expiresIn: 14400,
      });
    }
    
    return HttpResponse.json(
      { success: false, error: "Credenciais inválidas" },
      { status: 401 }
    );
  }),

  // Logout
  http.post(`${API_URL}/unified-auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Register
  http.post(`${API_URL}/unified-auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; name: string };
    
    return HttpResponse.json({
      success: true,
      user: {
        ...mockUser,
        email: body.email,
        name: body.name,
      },
      roles: ["seller"],
      activeRole: "seller",
    });
  }),

  // Switch context
  http.post(`${API_URL}/unified-auth/switch-context`, async ({ request }) => {
    const body = (await request.json()) as { role: string };
    
    return HttpResponse.json({
      success: true,
      activeRole: body.role,
    });
  }),
];

// ============================================================================
// Order Handlers
// ============================================================================

const orderHandlers = [
  // Create order
  http.post(`${API_URL}/create-order`, async ({ request }) => {
    const body = (await request.json()) as {
      product_id: string;
      checkout_id: string;
      customer_email: string;
    };
    
    return HttpResponse.json({
      success: true,
      order_id: "test-order-id-" + Date.now(),
      pix_data: {
        qr_code: "00020126580014br.gov.bcb.pix...",
        qr_code_base64: "data:image/png;base64,...",
        expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });
  }),

  // Get PIX status
  http.get(`${API_URL}/get-pix-status`, ({ request }) => {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("order_id");
    
    return HttpResponse.json({
      success: true,
      order_id: orderId,
      status: "pending",
      pix_data: {
        qr_code: "00020126580014br.gov.bcb.pix...",
      },
    });
  }),
];

// ============================================================================
// Legacy Product Handlers (Supabase REST - kept for backward compatibility)
// ============================================================================

const legacyProductHandlers = [
  // Get product via Supabase REST
  http.get(`${SUPABASE_URL}/rest/v1/products`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (id) {
      return HttpResponse.json([mockProduct]);
    }
    
    return HttpResponse.json([mockProduct]);
  }),
];

// ============================================================================
// Checkout Handlers
// ============================================================================

const checkoutHandlers = [
  // Get checkout data
  http.post(`${API_URL}/get-checkout-data`, async ({ request }) => {
    const body = (await request.json()) as { checkout_id?: string; slug?: string };
    
    return HttpResponse.json({
      success: true,
      checkout: mockCheckout,
      product: mockProduct,
    });
  }),
];

// ============================================================================
// Coupon Handlers
// ============================================================================

const couponHandlers = [
  // Validate coupon
  http.post(`${API_URL}/validate-coupon`, async ({ request }) => {
    const body = (await request.json()) as { code: string; product_id: string };
    
    if (body.code === "VALID10") {
      return HttpResponse.json({
        success: true,
        coupon: {
          id: "coupon-id-123",
          code: "VALID10",
          discount_type: "percentage",
          discount_value: 10,
        },
        discount_amount: 999, // 10% of 9990
      });
    }
    
    return HttpResponse.json(
      { success: false, error: "Cupom inválido" },
      { status: 400 }
    );
  }),
];

// ============================================================================
// Export All Handlers
// ============================================================================

export const handlers = [
  ...authHandlers,
  ...orderHandlers,
  ...legacyProductHandlers,
  ...checkoutHandlers,
  ...couponHandlers,
  ...domainHandlers,
];
