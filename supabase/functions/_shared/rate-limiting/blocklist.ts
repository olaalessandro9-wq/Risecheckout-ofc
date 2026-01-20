/**
 * IP Blocklist Service
 * 
 * Verificação de IPs bloqueados via RPC.
 * 
 * @version 1.0.0 - RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlocklistResult } from "./types.ts";
import { createLogger } from "../logger.ts";
import { translateBlocklistError } from "../error-translator.ts";

const log = createLogger("Blocklist");

// ============================================================================
// Types
// ============================================================================

interface BlocklistRPCResult {
  is_blocked: boolean;
  reason: string | null;
  expires_at: string | null;
}

// ============================================================================
// Blocklist Check
// ============================================================================

/**
 * Verifica se um IP está na blocklist
 * 
 * @param supabase - Cliente Supabase
 * @param ipAddress - Endereço IP a verificar
 * @returns Resultado da verificação
 */
export async function checkIPBlocklist(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<BlocklistResult> {
  if (!ipAddress || ipAddress === "unknown") {
    return { blocked: false, reason: null, expiresAt: null };
  }

  try {
    const { data, error } = await supabase.rpc("is_ip_blocked", {
      check_ip: ipAddress,
    });

    if (error) {
      log.error("RPC error", error.message);
      // Em caso de erro, permitir a requisição (fail-open)
      return { blocked: false, reason: null, expiresAt: null };
    }

    const result = data as BlocklistRPCResult | null;

    if (!result || !result.is_blocked) {
      return { blocked: false, reason: null, expiresAt: null };
    }

    return {
      blocked: true,
      reason: result.reason,
      expiresAt: result.expires_at,
    };
  } catch (err) {
    log.error("Unexpected error", err);
    // Em caso de erro, permitir a requisição (fail-open)
    return { blocked: false, reason: null, expiresAt: null };
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Cria response 403 para IPs bloqueados
 * 
 * @param result - Resultado da verificação de blocklist
 * @param corsHeaders - Headers CORS
 * @returns Response 403
 */
export function createBlocklistResponse(
  result: BlocklistResult,
  corsHeaders: Record<string, string>
): Response {
  // Usar mensagem amigável em português
  const message = translateBlocklistError(result.expiresAt, result.reason);

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
