/**
 * ============================================================================
 * encryption.ts - Criptografia AES-256-GCM para dados sensíveis
 * ============================================================================
 * 
 * Este módulo é um WRAPPER de compatibilidade para o novo sistema KMS.
 * Para novas implementações, use diretamente: import { ... } from "./kms/index.ts"
 * 
 * Formato do dado criptografado:
 * - Legacy (v1): base64(iv:ciphertext:tag)
 * - Versioned:   ENC_V{version}:{base64(iv:ciphertext:tag)}
 * 
 * @version 2.0.0 - KMS Integration
 * ============================================================================
 */

import { createLogger } from "./logger.ts";
import {
  encrypt,
  decrypt,
  safeDecrypt as kmsSafeDecrypt,
  isEncrypted as kmsIsEncrypted,
} from "./kms/index.ts";

const log = createLogger("Encryption");

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Criptografa um valor usando AES-256-GCM
 * @returns string criptografada versionada ou null se vazio
 * @deprecated Use import { encrypt } from "./kms/index.ts"
 */
export async function encryptValue(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext || plaintext.trim() === "") {
    return null;
  }
  
  try {
    return await encrypt(plaintext);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Erro ao criptografar: ${errorMessage}`);
    throw new Error("Encryption failed");
  }
}

/**
 * Descriptografa um valor criptografado com AES-256-GCM
 * @returns string descriptografada ou null se falhar
 * @deprecated Use import { decrypt } from "./kms/index.ts"
 */
export async function decryptValue(encrypted: string | null | undefined): Promise<string | null> {
  if (!encrypted || encrypted.trim() === "") {
    return null;
  }
  
  try {
    return await decrypt(encrypted);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Erro ao descriptografar: ${errorMessage}`);
    return null;
  }
}

/**
 * Verifica se um valor parece estar criptografado
 * @deprecated Use import { isEncrypted } from "./kms/index.ts"
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return kmsIsEncrypted(value);
}

/**
 * Descriptografa de forma segura, retornando o valor original se não for criptografado
 * @deprecated Use import { safeDecrypt } from "./kms/index.ts"
 */
export async function safeDecrypt(value: string | null | undefined): Promise<string | null> {
  if (!value || value.trim() === "") {
    return null;
  }
  
  return kmsSafeDecrypt(value);
}

// ============================================================================
// NEW KMS RE-EXPORTS (for gradual migration)
// ============================================================================

export {
  encrypt,
  decrypt,
  needsReEncryption,
  reEncrypt,
  getDefaultKeyProvider,
  ENCRYPTION_PREFIX,
  LEGACY_VERSION,
} from "./kms/index.ts";
