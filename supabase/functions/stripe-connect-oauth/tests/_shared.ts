/**
 * Shared Types & Mock Data for stripe-connect-oauth Tests
 * 
 * @module stripe-connect-oauth/tests/_shared
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

export interface StripeTokenResponse {
  stripe_user_id: string;
  access_token: string;
  refresh_token: string | null;
  livemode: boolean;
}

export interface StripeAccount {
  id: string;
  email: string;
  business_type: string;
}

export interface IntegrationConfig {
  stripe_account_id: string;
  livemode: boolean;
  email: string;
  connected_at: string;
  credentials_in_vault: boolean;
}

export interface VendorIntegration {
  vendor_id: string;
  integration_type: string;
  active: boolean;
  config: IntegrationConfig;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_VENDOR_ID = "vendor-uuid-12345";
export const MOCK_STATE = "state-uuid-67890";
export const MOCK_CODE = "ac_test_code_12345";
export const MOCK_STRIPE_ACCOUNT_ID = "acct_test_123456789";

export const mockOAuthState: OAuthStateRecord = {
  state: MOCK_STATE,
  vendor_id: MOCK_VENDOR_ID,
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  used_at: null,
};

export const mockExpiredState: OAuthStateRecord = {
  ...mockOAuthState,
  expires_at: new Date(Date.now() - 1000).toISOString(),
};

export const mockUsedState: OAuthStateRecord = {
  ...mockOAuthState,
  used_at: new Date().toISOString(),
};

export const mockTokenResponse: StripeTokenResponse = {
  stripe_user_id: MOCK_STRIPE_ACCOUNT_ID,
  access_token: "sk_test_access_token",
  refresh_token: "rt_test_refresh_token",
  livemode: false,
};

export const mockStripeAccount: StripeAccount = {
  id: MOCK_STRIPE_ACCOUNT_ID,
  email: "business@example.com",
  business_type: "company",
};

export const mockIntegration: VendorIntegration = {
  vendor_id: MOCK_VENDOR_ID,
  integration_type: "STRIPE",
  active: true,
  config: {
    stripe_account_id: MOCK_STRIPE_ACCOUNT_ID,
    livemode: false,
    email: "business@example.com",
    connected_at: new Date().toISOString(),
    credentials_in_vault: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateOAuthState(
  state: OAuthStateRecord | null
): { valid: boolean; error?: string } {
  if (!state) {
    return { valid: false, error: "Invalid OAuth state" };
  }
  if (state.used_at) {
    return { valid: false, error: "OAuth state already used" };
  }
  if (new Date(state.expires_at) < new Date()) {
    return { valid: false, error: "OAuth state expired" };
  }
  return { valid: true };
}

export function buildStripeConnectUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const { clientId, redirectUri, state } = params;
  const baseUrl = "https://connect.stripe.com/oauth/authorize";
  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: redirectUri,
    state,
  });
  return `${baseUrl}?${searchParams.toString()}`;
}

export function validateTokenResponse(
  response: StripeTokenResponse | null
): { valid: boolean; error?: string } {
  if (!response) {
    return { valid: false, error: "No token response" };
  }
  if (!response.stripe_user_id) {
    return { valid: false, error: "Missing stripe_user_id" };
  }
  if (!response.access_token) {
    return { valid: false, error: "Missing access_token" };
  }
  return { valid: true };
}

export function getConnectionStatus(integration: VendorIntegration | null): {
  connected: boolean;
  account_id: string | null;
  email: string | null;
  livemode: boolean | null;
} {
  if (!integration || !integration.active || !integration.config?.stripe_account_id) {
    return { connected: false, account_id: null, email: null, livemode: null };
  }
  return {
    connected: true,
    account_id: integration.config.stripe_account_id,
    email: integration.config.email || null,
    livemode: integration.config.livemode ?? null,
  };
}

export function isValidAction(action: string | null): boolean {
  const validActions = ["start", "callback", "disconnect", "status"];
  return action !== null && validActions.includes(action);
}

export function buildRedirectUrl(params: {
  frontendUrl: string;
  success: boolean;
  accountId?: string;
  error?: string;
}): string {
  const { frontendUrl, success, accountId, error } = params;
  const base = `${frontendUrl}/dashboard/financeiro`;
  if (success && accountId) {
    return `${base}?stripe_success=true&account=${accountId}`;
  }
  if (error) {
    return `${base}?stripe_error=${encodeURIComponent(error)}`;
  }
  return base;
}
