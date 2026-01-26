/**
 * ============================================================================
 * KMS Decryptor - Decryption with Key Version Fallback
 * ============================================================================
 * 
 * Descriptografa dados, detectando automaticamente a versão da chave.
 * Suporta fallback para versões anteriores e dados V1.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../logger.ts";
import type { DecryptResult, KeyProvider, EncryptedData } from "./types.ts";
import { ENCRYPTION_PREFIX, LEGACY_VERSION } from "./types.ts";

const log = createLogger("KMS-Decryptor");

/**
 * Parseia o formato de dados criptografados
 * 
 * Detecta:
 * - Formato versionado: ENC_V{version}:{payload}
 * - Formato V1: base64 puro
 */
export function parseEncryptedData(encrypted: string): EncryptedData {
  // Verificar se tem prefixo de versão
  if (encrypted.startsWith(ENCRYPTION_PREFIX)) {
    const colonIndex = encrypted.indexOf(':', ENCRYPTION_PREFIX.length);
    if (colonIndex === -1) {
      throw new Error('Invalid versioned format: missing colon');
    }
    
    const versionStr = encrypted.substring(ENCRYPTION_PREFIX.length, colonIndex);
    const version = parseInt(versionStr, 10);
    
    if (isNaN(version) || version < 1) {
      throw new Error(`Invalid version: ${versionStr}`);
    }
    
    const payload = encrypted.substring(colonIndex + 1);
    return { version, payload };
  }
  
  // Formato V1 (versão 1)
  return { version: LEGACY_VERSION, payload: encrypted };
}

/**
 * Verifica se um valor parece estar criptografado
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") {
    return false;
  }
  
  // Verificar formato versionado
  if (value.startsWith(ENCRYPTION_PREFIX)) {
    return true;
  }
  
  // Verificar formato V1 (base64 válido com comprimento mínimo)
  try {
    const decoded = atob(value);
    return decoded.length > 12; // IV (12 bytes) + algum dado
  } catch {
    return false;
  }
}

/**
 * Descriptografa usando o provedor de chaves
 * 
 * @param encrypted - Dados criptografados (versionado ou V1)
 * @param keyProvider - Provedor de chaves
 * @returns Resultado com texto descriptografado
 */
export async function decryptWithVersion(
  encrypted: string | null | undefined,
  keyProvider: KeyProvider
): Promise<DecryptResult> {
  if (!encrypted || encrypted.trim() === "") {
    return { success: true, decrypted: null as unknown as string };
  }

  try {
    // Parsear formato
    const { version, payload } = parseEncryptedData(encrypted);
    
    // Obter chave para a versão
    const key = await keyProvider.getKey(version);
    if (!key) {
      return { success: false, error: `Key version ${version} not available` };
    }

    // Decodificar payload
    const combined = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
    
    // Extrair IV e ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    // Descriptografar
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);
    
    log.debug(`Decrypted from version ${version}`);
    
    return { success: true, decrypted: plaintext, version };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Decryption failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Descriptografa de forma segura, retornando valor original se não for criptografado
 * Útil para migração gradual de dados V1
 */
export async function safeDecryptWithVersion(
  value: string | null | undefined,
  keyProvider: KeyProvider
): Promise<DecryptResult> {
  if (!value || value.trim() === "") {
    return { success: true, decrypted: null as unknown as string };
  }
  
  // Se não parece criptografado, retornar como está
  if (!isEncrypted(value)) {
    return { success: true, decrypted: value, version: 0 }; // version 0 = não criptografado
  }
  
  const result = await decryptWithVersion(value, keyProvider);
  
  // Se falhar, retornar valor original (pode ser V1 mal formatado)
  if (!result.success) {
    log.warn(`Decryption failed, returning original value`);
    return { success: true, decrypted: value, version: 0 };
  }
  
  return result;
}

/**
 * Extrai a versão de um valor criptografado sem descriptografar
 */
export function getEncryptedVersion(encrypted: string | null | undefined): number | null {
  if (!encrypted || !isEncrypted(encrypted)) {
    return null;
  }
  
  try {
    const { version } = parseEncryptedData(encrypted);
    return version;
  } catch {
    return null;
  }
}
