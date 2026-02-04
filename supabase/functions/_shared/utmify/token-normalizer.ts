/**
 * ============================================================================
 * Token Normalizer - SSOT (Single Source of Truth)
 * ============================================================================
 * 
 * @module _shared/utmify/token-normalizer
 * @version 1.0.0 - RISE Protocol V3
 * 
 * Centraliza TODA a lógica de normalização de tokens UTMify.
 * Usado por:
 * - vault-save (no momento de salvar)
 * - token-retriever (no momento de recuperar)
 * - utmify-conversion (compatibilidade)
 * 
 * REGRAS (ordem importa):
 * 1. NFKC normalization (unicode "parecido")
 * 2. Remove invisible chars
 * 3. Remove tabs, CR, LF
 * 4. Trim bordas
 * 5. Remove aspas envolventes (múltiplas)
 * 6. NÃO remove espaços internos (podem ser significativos)
 * ============================================================================
 */

import type { TokenNormalizationResult } from "./types.ts";

/**
 * Regex para caracteres invisíveis conhecidos
 * - U+0000-001F: C0 control characters
 * - U+007F: DELETE
 * - U+00A0: Non-breaking space (NBSP)
 * - U+200B-200F: Zero-width chars e direction marks
 * - U+FEFF: BOM / Zero-width no-break space
 * - U+2028-2029: Line/paragraph separators
 */
const INVISIBLE_CHARS_REGEX = /[\u0000-\u001F\u007F\u00A0\u200B-\u200F\uFEFF\u2028\u2029]/g;

/**
 * Normaliza token UTMify removendo caracteres problemáticos
 * 
 * Esta função é a SSOT para normalização de tokens.
 * Qualquer lugar que precise normalizar um token deve usar esta função.
 * 
 * @param raw - Token bruto (pode conter chars invisíveis, aspas, etc)
 * @returns Objeto com token normalizado e lista de alterações
 */
export function normalizeUTMifyToken(raw: string): TokenNormalizationResult {
  const changes: string[] = [];
  let token = raw;
  const originalLength = raw.length;
  
  // 1. NFKC normalization (normaliza unicode "parecido")
  const nfkc = token.normalize('NFKC');
  if (nfkc !== token) {
    changes.push('applied_nfkc');
    token = nfkc;
  }
  
  // 2. Remove invisible chars
  const noInvisible = token.replace(INVISIBLE_CHARS_REGEX, '');
  if (noInvisible !== token) {
    const removedCount = token.length - noInvisible.length;
    changes.push(`removed_${removedCount}_invisible_chars`);
    token = noInvisible;
  }
  
  // 3. Remove tabs, CR, LF (explícito para clareza)
  const noWhitespace = token.replace(/[\r\n\t]/g, '');
  if (noWhitespace !== token) {
    changes.push('removed_tabs_or_newlines');
    token = noWhitespace;
  }
  
  // 4. Trim bordas (espaços normais nas extremidades)
  const trimmed = token.trim();
  if (trimmed !== token) {
    changes.push('trimmed_edges');
    token = trimmed;
  }
  
  // 5. Remove aspas envolventes (uma ou mais)
  const noQuotes = token.replace(/^["']+|["']+$/g, '');
  if (noQuotes !== token) {
    changes.push('removed_surrounding_quotes');
    token = noQuotes;
  }
  
  // NOTA: NÃO removemos espaços internos - podem ser significativos
  // Se a UTMify aceitar tokens com espaços, devemos preservá-los
  
  return {
    normalized: token,
    originalLength,
    normalizedLength: token.length,
    changes,
  };
}

/**
 * Computa fingerprint seguro do token (para logs)
 * Retorna primeiros 12 caracteres do SHA-256 hex
 * 
 * @param token - Token para computar fingerprint
 * @returns String com 12 caracteres hexadecimais
 */
export async function computeTokenFingerprint(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 12);
}
