/**
 * Shared Types & Mock Data for mercadopago-oauth-callback Tests
 * 
 * @module mercadopago-oauth-callback/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export interface OAuthStateRecord {
  state: string;
  vendor_id: string;
  expires_at: string;
  used_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  public_key: string;
  user_id: number;
}

export interface IntegrationData {
  vendorId: string;
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  collectorId: string;
  email: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-uuid-12345";
export const MOCK_STATE = "state-nonce-67890";
export const MOCK_CODE = "TG-authorization-code-123";
export const MOCK_USER_ID = 123456789;
export const MOCK_COLLECTOR_ID = "123456789";

export const ALLOWED_REDIRECT_DOMAINS = [
  'risecheckout.com',
  'www.risecheckout.com',
  'lovable.app',
];

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockValidState: OAuthStateRecord = {
  state: MOCK_STATE,
  vendor_id: MOCK_VENDOR_ID,
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  used_at: null,
};

export const mockExpiredState: OAuthStateRecord = {
  ...mockValidState,
  expires_at: new Date(Date.now() - 1000).toISOString(),
};

export const mockUsedState: OAuthStateRecord = {
  ...mockValidState,
  used_at: new Date().toISOString(),
};

export const mockTokenResponse: TokenResponse = {
  access_token: "APP_USR-access-token-12345",
  refresh_token: "TG-refresh-token-67890",
  public_key: "APP_USR-public-key-abcdef",
  user_id: MOCK_USER_ID,
};

export const mockIntegrationData: IntegrationData = {
  vendorId: MOCK_VENDOR_ID,
  accessToken: mockTokenResponse.access_token,
  refreshToken: mockTokenResponse.refresh_token,
  publicKey: mockTokenResponse.public_key,
  collectorId: MOCK_COLLECTOR_ID,
  email: "seller@example.com",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateOAuthState(
  state: OAuthStateRecord | null
): { valid: boolean; vendorId?: string; error?: string } {
  if (!state) return { valid: false, error: "Sessão expirada ou inválida. Por favor, tente novamente." };
  if (state.used_at) return { valid: false, error: "State já utilizado" };
  if (new Date(state.expires_at) < new Date()) return { valid: false, error: "Sessão expirada" };
  return { valid: true, vendorId: state.vendor_id };
}

export function isAllowedRedirectDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_REDIRECT_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function validateTokenResponse(
  response: TokenResponse | null
): { valid: boolean; error?: string; reason?: string } {
  if (!response) return { valid: false, error: "No response", reason: "empty_response" };
  if (!response.access_token) return { valid: false, error: "Missing access_token", reason: "missing_token" };
  if (!response.user_id || typeof response.user_id !== 'number') return { valid: false, error: "Dados inválidos retornados pelo Mercado Pago.", reason: "invalid_user_id" };
  return { valid: true };
}

export function buildErrorRedirectUrl(baseUrl: string, reason: string): string {
  return `${baseUrl}/oauth-error.html?reason=${reason}`;
}

export function buildSuccessRedirectUrl(baseUrl: string): string {
  return `${baseUrl}/oauth-success.html`;
}

export function validateIntegrationData(data: IntegrationData): { valid: boolean; error?: string } {
  if (!data.vendorId) return { valid: false, error: "Missing vendorId" };
  if (!data.accessToken) return { valid: false, error: "Missing accessToken" };
  if (!data.collectorId) return { valid: false, error: "Missing collectorId" };
  return { valid: true };
}

export function mapTokenErrorToReason(error: string): string {
  if (error.includes('invalid_grant')) return 'invalid_grant';
  if (error.includes('redirect_uri')) return 'redirect_uri_mismatch';
  return 'token_exchange_failed';
}
