/**
 * Auth Fixtures
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Reusable test fixtures for authentication tests.
 * 
 * @module unified-auth/__fixtures__
 */

// ============================================================================
// User Fixtures
// ============================================================================

export const mockUser = {
  id: "user-123-test",
  email: "test@example.com",
  name: "Test User",
  password_hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // bcrypt hash of "Test123456"
  account_status: "active",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockInactiveUser = {
  ...mockUser,
  id: "user-inactive",
  email: "inactive@example.com",
  is_active: false,
};

export const mockPendingUser = {
  ...mockUser,
  id: "user-pending",
  email: "pending@example.com",
  account_status: "pending_setup",
};

export const mockResetRequiredUser = {
  ...mockUser,
  id: "user-reset",
  email: "reset@example.com",
  account_status: "reset_required",
};

// ============================================================================
// Session Fixtures
// ============================================================================

export const mockSession = {
  id: "session-123-test",
  user_id: "user-123-test",
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMy10ZXN0IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.test",
  refresh_token: "refresh_token_test_123",
  expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
};

export const mockExpiredSession = {
  ...mockSession,
  id: "session-expired",
  expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
};

export const mockInactiveSession = {
  ...mockSession,
  id: "session-inactive",
  is_active: false,
};

// ============================================================================
// Token Fixtures
// ============================================================================

export const mockTokens = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk4ODAwfQ.test",
  refreshToken: "refresh_token_test_123",
  expiresIn: 3600,
};

export const mockExpiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQwOTk1MjAwfQ.expired";

export const mockInvalidToken = "invalid.token.format";

// ============================================================================
// Request Fixtures
// ============================================================================

export const mockLoginRequest = {
  email: "test@example.com",
  password: "Test123456",
};

export const mockRegisterRequest = {
  email: "newuser@example.com",
  password: "NewPass123",
  name: "New User",
};

export const mockRefreshRequest = {
  refreshToken: "refresh_token_test_123",
};

// ============================================================================
// Security Test Payloads
// ============================================================================

export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "'; DROP TABLE users--",
  "' UNION SELECT * FROM users--",
  "1' AND '1'='1",
];

export const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')",
  "<svg onload=alert('XSS')>",
  "';alert('XSS');//",
];

export const pathTraversalPayloads = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32",
  "....//....//....//etc/passwd",
];

// ============================================================================
// Mock Responses
// ============================================================================

export const mockAuthResponse = {
  user: {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
  },
  session: mockSession,
  tokens: mockTokens,
};

export const mockErrorResponse = {
  error: "Invalid credentials",
  code: "INVALID_CREDENTIALS",
  status: 401,
};

// ============================================================================
// Helper Functions
// ============================================================================

export function createMockRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/unified-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function createMockCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}
