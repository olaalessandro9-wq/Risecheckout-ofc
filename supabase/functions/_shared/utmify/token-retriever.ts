/**
 * ============================================================================
 * UTMify Token Retriever
 * ============================================================================
 * 
 * @module _shared/utmify/token-retriever
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Recupera e normaliza token UTMify do Vault.
 * Usa o normalizador SSOT para garantir consistência.
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import { normalizeUTMifyToken, computeTokenFingerprint } from "./token-normalizer.ts";
import type { TokenRetrievalResult } from "./types.ts";

const log = createLogger("UTMifyTokenRetriever");

/**
 * Recupera token UTMify do Vault com normalização SSOT
 * 
 * @param supabase - Cliente Supabase
 * @param vendorId - ID do vendedor
 * @returns Token normalizado, fingerprint e informações sobre normalização
 */
export async function getUTMifyToken(
  supabase: SupabaseClient,
  vendorId: string
): Promise<TokenRetrievalResult> {
  try {
    const { data, error } = await supabase.rpc("get_gateway_credentials", {
      p_vendor_id: vendorId,
      p_gateway: "utmify",
    });

    if (error) {
      log.warn("Erro ao recuperar credenciais UTMify:", error.message);
      return { token: null, fingerprint: null, normalizationApplied: false, changes: [] };
    }

    if (!data?.credentials?.api_token) {
      return { token: null, fingerprint: null, normalizationApplied: false, changes: [] };
    }

    // RISE V3: Usar normalizador SSOT
    const rawToken = data.credentials.api_token as string;
    const normalizationResult = normalizeUTMifyToken(rawToken);

    // Log de diagnóstico (sem expor o token)
    if (normalizationResult.changes.length > 0) {
      log.warn("Token UTMify normalizado", {
        originalLength: normalizationResult.originalLength,
        normalizedLength: normalizationResult.normalizedLength,
        changes: normalizationResult.changes
      });
    }

    if (normalizationResult.normalized.length === 0) {
      log.error("Token UTMify vazio após normalização");
      return { token: null, fingerprint: null, normalizationApplied: true, changes: normalizationResult.changes };
    }

    // Computar fingerprint para auditoria
    const fingerprint = await computeTokenFingerprint(normalizationResult.normalized);

    return {
      token: normalizationResult.normalized,
      fingerprint,
      normalizationApplied: normalizationResult.changes.length > 0,
      changes: normalizationResult.changes
    };
  } catch (error) {
    log.warn("Exceção ao recuperar token UTMify:", error);
    return { token: null, fingerprint: null, normalizationApplied: false, changes: [] };
  }
}
