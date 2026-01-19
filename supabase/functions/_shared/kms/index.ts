/**
 * ============================================================================
 * KMS Module - Key Management System Entry Point
 * ============================================================================
 * 
 * Módulo central de gerenciamento de chaves de criptografia.
 * 
 * Features:
 * - Criptografia com versionamento de chaves
 * - Descriptografia com fallback para versões anteriores
 * - Provider baseado em variáveis de ambiente
 * - Suporte a rotação de chaves
 * 
 * Formato de dados:
 * - Legacy (v1): base64(iv:ciphertext:tag)
 * - Versioned:   ENC_V{version}:{base64(iv:ciphertext:tag)}
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

// Re-export types
export type {
  KeyStatus,
  KeyVersion,
  EncryptedData,
  EncryptResult,
  DecryptResult,
  RotationResult,
  KeyProvider,
  RotationConfig,
  TableRotationConfig,
} from "./types.ts";

export {
  ENCRYPTION_PREFIX,
  LEGACY_VERSION,
  DEFAULT_ROTATION_CONFIG,
} from "./types.ts";

// Re-export encryptor
export {
  encryptWithVersion,
  encryptWithSpecificVersion,
} from "./encryptor.ts";

// Re-export decryptor
export {
  parseEncryptedData,
  isEncrypted,
  decryptWithVersion,
  safeDecryptWithVersion,
  getEncryptedVersion,
} from "./decryptor.ts";

// Re-export provider
export {
  EnvKeyProvider,
  getDefaultKeyProvider,
} from "./env-key-provider.ts";

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

import { getDefaultKeyProvider } from "./env-key-provider.ts";
import { encryptWithVersion } from "./encryptor.ts";
import { decryptWithVersion, safeDecryptWithVersion, isEncrypted } from "./decryptor.ts";

/**
 * Criptografa um valor usando o provider padrão
 */
export async function encrypt(plaintext: string | null | undefined): Promise<string | null> {
  const result = await encryptWithVersion(plaintext, getDefaultKeyProvider());
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.encrypted ?? null;
}

/**
 * Descriptografa um valor usando o provider padrão
 */
export async function decrypt(encrypted: string | null | undefined): Promise<string | null> {
  const result = await decryptWithVersion(encrypted, getDefaultKeyProvider());
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.decrypted ?? null;
}

/**
 * Descriptografa de forma segura usando o provider padrão
 */
export async function safeDecrypt(value: string | null | undefined): Promise<string | null> {
  const result = await safeDecryptWithVersion(value, getDefaultKeyProvider());
  return result.decrypted ?? null;
}

/**
 * Verifica se precisa re-criptografar (versão antiga)
 */
export async function needsReEncryption(encrypted: string | null | undefined): Promise<boolean> {
  if (!encrypted || !isEncrypted(encrypted)) {
    return false;
  }
  
  const provider = getDefaultKeyProvider();
  const activeVersion = await provider.getActiveVersion();
  
  // Parsear versão do valor
  const { getEncryptedVersion } = await import("./decryptor.ts");
  const valueVersion = getEncryptedVersion(encrypted);
  
  return valueVersion !== null && valueVersion < activeVersion;
}

/**
 * Re-criptografa um valor para a versão ativa
 */
export async function reEncrypt(encrypted: string): Promise<string | null> {
  const provider = getDefaultKeyProvider();
  
  // Descriptografar
  const decrypted = await decrypt(encrypted);
  if (!decrypted) {
    return null;
  }
  
  // Re-criptografar com versão ativa
  return encrypt(decrypted);
}
