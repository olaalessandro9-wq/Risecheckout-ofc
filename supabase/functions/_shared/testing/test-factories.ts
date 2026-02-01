/**
 * Testing Infrastructure - Data Factories
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Type-safe factories for generating test data.
 * Replaces scattered mock data across 38 test files.
 * 
 * @module _shared/testing/test-factories
 * @version 1.0.0
 */

import type {
  MockUser,
  MockSession,
  MockProduct,
  MockOrder,
  MockAffiliate,
  MockWebhook,
  MockRequestOptions,
  AuthenticatedRequestOptions,
  UserRole,
  AccountStatus,
  OrderStatus,
  PaymentMethod,
  PaymentGateway,
  AffiliateStatus,
} from "./types.ts";

// ============================================================================
// ID GENERATORS
// ============================================================================

/**
 * Generates a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generates a prefixed ID for better test readability
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateId().slice(0, 8)}`;
}

// ============================================================================
// USER FACTORIES
// ============================================================================

/**
 * Default mock user values
 */
const defaultUser: MockUser = {
  id: "",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  account_status: "active",
  is_active: true,
  email_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Creates a mock user with optional overrides
 * 
 * @example
 * ```typescript
 * const user = createMockUser({ email: "custom@test.com" });
 * const admin = createMockUser({ role: "admin" });
 * ```
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    ...defaultUser,
    id: generatePrefixedId("user"),
    email: `user-${Date.now()}@test.com`,
    ...overrides,
  };
}

/**
 * Creates a mock producer (vendor)
 */
export function createMockProducer(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    role: "user",
    name: "Test Producer",
    ...overrides,
  });
}

/**
 * Creates a mock admin user
 */
export function createMockAdmin(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    role: "admin",
    name: "Admin User",
    ...overrides,
  });
}

/**
 * Creates a mock owner user
 */
export function createMockOwner(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    role: "owner",
    name: "Owner User",
    ...overrides,
  });
}

/**
 * Creates a mock inactive user
 */
export function createMockInactiveUser(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    is_active: false,
    account_status: "suspended",
    ...overrides,
  });
}

/**
 * Creates a mock user pending setup (no password)
 */
export function createMockPendingUser(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    account_status: "pending_setup",
    email_verified: false,
    ...overrides,
  });
}

// ============================================================================
// SESSION FACTORIES
// ============================================================================

/**
 * Default mock session values
 */
const defaultSession: MockSession = {
  id: "",
  user_id: "",
  access_token: "",
  refresh_token: "",
  expires_at: "",
  created_at: new Date().toISOString(),
  is_active: true,
};

/**
 * Creates a mock session for a user
 * 
 * @example
 * ```typescript
 * const user = createMockUser();
 * const session = createMockSession(user.id);
 * ```
 */
export function createMockSession(
  userId: string,
  overrides: Partial<MockSession> = {}
): MockSession {
  const sessionId = generatePrefixedId("session");
  return {
    ...defaultSession,
    id: sessionId,
    user_id: userId,
    access_token: `access_${sessionId}`,
    refresh_token: `refresh_${sessionId}`,
    expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    ...overrides,
  };
}

/**
 * Creates an expired mock session
 */
export function createMockExpiredSession(
  userId: string,
  overrides: Partial<MockSession> = {}
): MockSession {
  return createMockSession(userId, {
    expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    ...overrides,
  });
}

// ============================================================================
// PRODUCT FACTORIES
// ============================================================================

/**
 * Default mock product values
 */
const defaultProduct: MockProduct = {
  id: "",
  user_id: "",
  name: "Test Product",
  description: "A test product for unit tests",
  price: 9900, // R$ 99.00 in cents
  status: "active",
  members_area_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Creates a mock product
 * 
 * @example
 * ```typescript
 * const producer = createMockProducer();
 * const product = createMockProduct(producer.id);
 * ```
 */
export function createMockProduct(
  userId: string,
  overrides: Partial<MockProduct> = {}
): MockProduct {
  return {
    ...defaultProduct,
    id: generatePrefixedId("product"),
    user_id: userId,
    ...overrides,
  };
}

/**
 * Creates a mock product with members area enabled
 */
export function createMockCourseProduct(
  userId: string,
  overrides: Partial<MockProduct> = {}
): MockProduct {
  return createMockProduct(userId, {
    name: "Test Course",
    description: "A test course with members area",
    members_area_enabled: true,
    price: 29900, // R$ 299.00
    ...overrides,
  });
}

// ============================================================================
// ORDER FACTORIES
// ============================================================================

/**
 * Default mock order values
 */
const defaultOrder: MockOrder = {
  id: "",
  vendor_id: "",
  product_id: "",
  checkout_id: null,
  customer_name: "Test Customer",
  customer_email: "customer@test.com",
  customer_phone: "11999999999",
  customer_cpf: "12345678900",
  amount_cents: 9900,
  status: "pending",
  payment_method: "pix",
  gateway: "PUSHINPAY",
  gateway_payment_id: null,
  pix_qr_code: null,
  pix_code: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  paid_at: null,
};

/**
 * Creates a mock order
 * 
 * @example
 * ```typescript
 * const producer = createMockProducer();
 * const product = createMockProduct(producer.id);
 * const order = createMockOrder(producer.id, product.id);
 * ```
 */
export function createMockOrder(
  vendorId: string,
  productId: string,
  overrides: Partial<MockOrder> = {}
): MockOrder {
  return {
    ...defaultOrder,
    id: generatePrefixedId("order"),
    vendor_id: vendorId,
    product_id: productId,
    ...overrides,
  };
}

/**
 * Creates a mock paid order
 */
export function createMockPaidOrder(
  vendorId: string,
  productId: string,
  overrides: Partial<MockOrder> = {}
): MockOrder {
  return createMockOrder(vendorId, productId, {
    status: "paid",
    paid_at: new Date().toISOString(),
    gateway_payment_id: generatePrefixedId("payment"),
    ...overrides,
  });
}

/**
 * Creates a mock PIX order with QR code
 */
export function createMockPixOrder(
  vendorId: string,
  productId: string,
  overrides: Partial<MockOrder> = {}
): MockOrder {
  return createMockOrder(vendorId, productId, {
    payment_method: "pix",
    gateway: "PUSHINPAY",
    pix_qr_code: "data:image/png;base64,iVBORw0KGgoAAAANS...",
    pix_code: "00020126580014br.gov.bcb.pix...",
    ...overrides,
  });
}

/**
 * Creates a mock credit card order
 */
export function createMockCreditCardOrder(
  vendorId: string,
  productId: string,
  overrides: Partial<MockOrder> = {}
): MockOrder {
  return createMockOrder(vendorId, productId, {
    payment_method: "credit_card",
    gateway: "MERCADOPAGO",
    ...overrides,
  });
}

// ============================================================================
// AFFILIATE FACTORIES
// ============================================================================

/**
 * Default mock affiliate values
 */
const defaultAffiliate: MockAffiliate = {
  id: "",
  user_id: "",
  product_id: "",
  affiliate_code: "",
  commission_rate: 30, // 30%
  status: "approved",
  total_sales_count: 0,
  total_sales_amount: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Creates a mock affiliate
 */
export function createMockAffiliate(
  userId: string,
  productId: string,
  overrides: Partial<MockAffiliate> = {}
): MockAffiliate {
  const affiliateId = generatePrefixedId("aff");
  return {
    ...defaultAffiliate,
    id: affiliateId,
    user_id: userId,
    product_id: productId,
    affiliate_code: `AFF${affiliateId.slice(-6).toUpperCase()}`,
    ...overrides,
  };
}

/**
 * Creates a mock pending affiliate
 */
export function createMockPendingAffiliate(
  userId: string,
  productId: string,
  overrides: Partial<MockAffiliate> = {}
): MockAffiliate {
  return createMockAffiliate(userId, productId, {
    status: "pending",
    ...overrides,
  });
}

// ============================================================================
// WEBHOOK FACTORIES
// ============================================================================

/**
 * Default mock webhook values
 */
const defaultWebhook: MockWebhook = {
  id: "",
  user_id: "",
  name: "Test Webhook",
  url: "https://example.com/webhook",
  events: ["order.paid", "order.refunded"],
  secret: "",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Creates a mock webhook configuration
 */
export function createMockWebhook(
  userId: string,
  overrides: Partial<MockWebhook> = {}
): MockWebhook {
  const webhookId = generatePrefixedId("webhook");
  return {
    ...defaultWebhook,
    id: webhookId,
    user_id: userId,
    secret: `whsec_${crypto.randomUUID().replace(/-/g, "")}`,
    ...overrides,
  };
}

// ============================================================================
// REQUEST FACTORIES
// ============================================================================

/**
 * Creates a mock HTTP request
 * 
 * @example
 * ```typescript
 * const req = createMockRequest({
 *   method: "POST",
 *   body: { action: "login" }
 * });
 * ```
 */
export function createMockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = "POST",
    headers = {},
    body,
    url = "https://example.com/api",
  } = options;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined && method !== "GET" && method !== "OPTIONS") {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Creates an authenticated request with session token
 * 
 * @example
 * ```typescript
 * const session = createMockSession(user.id);
 * const req = createAuthenticatedRequest({
 *   sessionToken: session.access_token,
 *   body: { action: "list" }
 * });
 * ```
 */
export function createAuthenticatedRequest(
  options: AuthenticatedRequestOptions = {}
): Request {
  const { sessionToken, bearerToken, internalSecret, headers = {}, ...rest } = options;

  const authHeaders: Record<string, string> = { ...headers };

  if (sessionToken) {
    authHeaders["x-producer-session-token"] = sessionToken;
  }

  if (bearerToken) {
    authHeaders["Authorization"] = `Bearer ${bearerToken}`;
  }

  if (internalSecret) {
    authHeaders["x-internal-secret"] = internalSecret;
  }

  return createMockRequest({ ...rest, headers: authHeaders });
}

/**
 * Creates a request with internal secret for service-to-service calls
 */
export function createInternalRequest(
  internalSecret: string,
  options: MockRequestOptions = {}
): Request {
  return createAuthenticatedRequest({
    ...options,
    internalSecret,
  });
}

// ============================================================================
// GATEWAY WEBHOOK FACTORIES
// ============================================================================

/**
 * Creates a PushinPay webhook request
 */
export function createPushinPayWebhookRequest(
  event: "pix.received" | "pix.expired" | "pix.refunded",
  transactionId: string,
  orderId: string
): Request {
  return createMockRequest({
    method: "POST",
    url: "https://example.com/webhooks/pushinpay",
    body: {
      event,
      data: {
        id: transactionId,
        reference_id: orderId,
        status: event === "pix.received" ? "paid" : event === "pix.expired" ? "expired" : "refunded",
        amount: 10000,
        [event === "pix.received" ? "paid_at" : event === "pix.expired" ? "expired_at" : "refunded_at"]: new Date().toISOString(),
      },
    },
  });
}

/**
 * Creates a MercadoPago webhook request
 */
export function createMercadoPagoWebhookRequest(
  action: "payment.created" | "payment.updated",
  paymentId: string
): Request {
  return createMockRequest({
    method: "POST",
    url: "https://example.com/webhooks/mercadopago",
    body: {
      action,
      api_version: "v1",
      data: { id: paymentId },
      date_created: new Date().toISOString(),
      id: crypto.randomUUID(),
      live_mode: false,
      type: "payment",
      user_id: "123456789",
    },
  });
}

/**
 * Creates an Asaas webhook request
 */
export function createAsaasWebhookRequest(
  event: "PAYMENT_RECEIVED" | "PAYMENT_CONFIRMED" | "PAYMENT_OVERDUE",
  paymentId: string,
  orderId: string
): Request {
  return createMockRequest({
    method: "POST",
    url: "https://example.com/webhooks/asaas",
    body: {
      event,
      payment: {
        id: paymentId,
        customer: "cus_000000000000",
        value: 100.0,
        netValue: 97.0,
        billingType: "PIX",
        status: event === "PAYMENT_RECEIVED" ? "RECEIVED" : event === "PAYMENT_CONFIRMED" ? "CONFIRMED" : "OVERDUE",
        externalReference: orderId,
      },
    },
  });
}
