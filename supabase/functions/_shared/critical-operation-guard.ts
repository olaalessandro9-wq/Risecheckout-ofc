/**
 * Critical Operation Guard - Step-Up MFA Middleware
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Classifies and protects operations by security level.
 * Single entry point for all step-up MFA checks in Edge Functions.
 * 
 * Usage in Edge Functions:
 * ```typescript
 * import { guardCriticalOperation, CriticalLevel } from "../_shared/critical-operation-guard.ts";
 * 
 * // In handler:
 * const guardResult = await guardCriticalOperation({
 *   supabase, req, corsHeaders,
 *   level: CriticalLevel.OWNER_MFA,
 *   totpCode: body.ownerMfaCode,
 *   callerId: producer.id,
 *   callerRole: producer.role,
 *   operationName: "manage-user-role",
 * });
 * if (guardResult) return guardResult; // 403 response
 * ```
 * 
 * @module _shared/critical-operation-guard
 * @version 1.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "./logger.ts";
import { requireSelfMfa, requireOwnerMfa } from "./step-up-mfa.ts";

const log = createLogger("CriticalGuard");

// ============================================================================
// TYPES
// ============================================================================

export enum CriticalLevel {
  /** No additional verification required */
  NONE = 0,
  /** Requires the caller's own TOTP code */
  SELF_MFA = 1,
  /** Requires the system Owner's TOTP code */
  OWNER_MFA = 2,
}

export interface GuardParams {
  supabase: SupabaseClient;
  req: Request;
  corsHeaders: Record<string, string>;
  level: CriticalLevel;
  totpCode?: string;
  callerId: string;
  callerRole: string;
  operationName: string;
}

// ============================================================================
// GUARD
// ============================================================================

/**
 * Guards a critical operation with step-up MFA verification.
 * 
 * @returns Response (403) if verification fails, null if verification passes
 */
export async function guardCriticalOperation(
  params: GuardParams
): Promise<Response | null> {
  const {
    supabase,
    req,
    corsHeaders,
    level,
    totpCode,
    callerId,
    callerRole,
    operationName,
  } = params;

  // Level 0: No verification needed
  if (level === CriticalLevel.NONE) {
    return null;
  }

  // Missing TOTP code
  if (!totpCode) {
    const levelLabel = level === CriticalLevel.OWNER_MFA
      ? "do Owner"
      : "do usuário";

    await logStepUpAttempt(supabase, req, {
      callerId,
      callerRole,
      operationName,
      level,
      success: false,
      reason: "TOTP code not provided",
    });

    return createForbiddenResponse(
      `Código MFA ${levelLabel} é obrigatório para esta operação`,
      level === CriticalLevel.OWNER_MFA ? "OWNER_MFA_REQUIRED" : "SELF_MFA_REQUIRED",
      corsHeaders
    );
  }

  // Level 1: Verify caller's own TOTP
  if (level === CriticalLevel.SELF_MFA) {
    const result = await requireSelfMfa(supabase, callerId, totpCode);

    await logStepUpAttempt(supabase, req, {
      callerId,
      callerRole,
      operationName,
      level,
      success: result.verified,
      reason: result.error,
    });

    if (!result.verified) {
      return createForbiddenResponse(
        result.error || "Código MFA inválido",
        "STEP_UP_MFA_FAILED",
        corsHeaders
      );
    }

    return null;
  }

  // Level 2: Verify Owner's TOTP
  if (level === CriticalLevel.OWNER_MFA) {
    const result = await requireOwnerMfa(supabase, totpCode);

    await logStepUpAttempt(supabase, req, {
      callerId,
      callerRole,
      operationName,
      level,
      success: result.verified,
      reason: result.error,
    });

    if (!result.verified) {
      return createForbiddenResponse(
        result.error || "Código MFA do Owner inválido",
        "STEP_UP_MFA_FAILED",
        corsHeaders
      );
    }

    return null;
  }

  // Unknown level (should never happen)
  return createForbiddenResponse(
    "Nível de segurança desconhecido",
    "UNKNOWN_CRITICAL_LEVEL",
    corsHeaders
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function createForbiddenResponse(
  message: string,
  code: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message, code }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

interface StepUpLogParams {
  callerId: string;
  callerRole: string;
  operationName: string;
  level: CriticalLevel;
  success: boolean;
  reason?: string;
}

async function logStepUpAttempt(
  supabase: SupabaseClient,
  req: Request,
  params: StepUpLogParams
): Promise<void> {
  const action = params.success
    ? "STEP_UP_MFA_SUCCESS"
    : "STEP_UP_MFA_FAILED";

  const levelLabel = params.level === CriticalLevel.OWNER_MFA
    ? "OWNER_MFA"
    : "SELF_MFA";

  try {
    await supabase.rpc("log_security_event", {
      p_user_id: params.callerId,
      p_action: action,
      p_resource: params.operationName,
      p_success: params.success,
      p_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      p_user_agent: req.headers.get("user-agent") || null,
      p_metadata: {
        callerRole: params.callerRole,
        criticalLevel: levelLabel,
        reason: params.reason || null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Failed to log step-up attempt:", msg);
  }
}
