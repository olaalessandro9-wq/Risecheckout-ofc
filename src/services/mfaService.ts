/**
 * MFA Service - API Layer for Multi-Factor Authentication
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralizes all MFA API calls via Edge Functions.
 * Frontend NEVER accesses the database directly.
 * 
 * @module services/mfaService
 * @version 1.0.0
 */

import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("MfaService");

// ============================================================================
// TYPES
// ============================================================================

export interface MfaSetupResponse {
  success: boolean;
  otpauthUri: string;
}

export interface MfaVerifySetupResponse {
  success: boolean;
  message: string;
  backupCodes: string[];
}

export interface MfaVerifyResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  roles?: string[];
  activeRole?: string;
  expiresIn?: number;
  error?: string;
}

export interface MfaDisableResponse {
  success: boolean;
  message: string;
}

export interface MfaStatusResponse {
  mfaEnabled: boolean;
}

// ============================================================================
// API CALLS
// ============================================================================

/**
 * Initiates MFA setup - generates TOTP secret and QR code URI.
 * Requires authenticated admin/owner session.
 */
export async function mfaSetup(): Promise<MfaSetupResponse> {
  const { data, error } = await api.call<MfaSetupResponse>(
    "unified-auth/mfa-setup",
    {}
  );

  if (error) {
    log.error("MFA setup failed:", error.message);
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error("Erro ao configurar MFA");
  }

  return data;
}

/**
 * Confirms MFA setup by verifying the first TOTP code.
 * Returns one-time backup codes on success.
 */
export async function mfaVerifySetup(code: string): Promise<MfaVerifySetupResponse> {
  const { data, error } = await api.call<MfaVerifySetupResponse>(
    "unified-auth/mfa-verify-setup",
    { code }
  );

  if (error) {
    log.error("MFA verify setup failed:", error.message);
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error("Código inválido");
  }

  return data;
}

/**
 * Verifies MFA code during login flow.
 * Uses the temporary mfa_session_token from login response.
 */
export async function mfaVerify(
  mfaSessionToken: string,
  code: string,
  isBackupCode: boolean = false
): Promise<MfaVerifyResponse> {
  const { data, error } = await api.publicCall<MfaVerifyResponse>(
    "unified-auth/mfa-verify",
    {
      mfa_session_token: mfaSessionToken,
      code,
      is_backup_code: isBackupCode,
    }
  );

  if (error) {
    log.error("MFA verify failed:", error.message);
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error(data?.error || "Código MFA inválido");
  }

  return data;
}

/**
 * Disables MFA for the authenticated user.
 * Requires current password AND TOTP code for security.
 */
export async function mfaDisable(
  password: string,
  code: string
): Promise<MfaDisableResponse> {
  const { data, error } = await api.call<MfaDisableResponse>(
    "unified-auth/mfa-disable",
    { password, code }
  );

  if (error) {
    log.error("MFA disable failed:", error.message);
    throw new Error(error.message);
  }

  if (!data?.success) {
    throw new Error("Erro ao desativar MFA");
  }

  return data;
}

/**
 * Checks if the authenticated user has MFA enabled.
 */
export async function getMfaStatus(): Promise<MfaStatusResponse> {
  const { data, error } = await api.call<MfaStatusResponse>(
    "unified-auth/mfa-status",
    {}
  );

  if (error) {
    log.error("MFA status check failed:", error.message);
    return { mfaEnabled: false };
  }

  return data ?? { mfaEnabled: false };
}
