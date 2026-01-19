/**
 * ============================================================================
 * KMS Encryptor - Encryption with Key Versioning
 * ============================================================================
 * 
 * Criptografa dados usando a chave ativa e adiciona prefixo de versão.
 * 
 * Formato: ENC_V{version}:{base64(iv:ciphertext:tag)}
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../logger.ts";
import type { EncryptResult, KeyProvider } from "./types.ts";
import { ENCRYPTION_PREFIX } from "./types.ts";

const log = createLogger("KMS-Encryptor");

/**
 * Deriva uma chave AES-256 a partir do material da chave
 */
async function deriveKey(keyMaterial: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  // Usar SHA-256 para derivar exatamente 32 bytes
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

/**
 * Criptografa um valor usando a chave ativa
 * 
 * @param plaintext - Texto a criptografar
 * @param keyProvider - Provedor de chaves
 * @returns Resultado com string criptografada versionada
 */
export async function encryptWithVersion(
  plaintext: string | null | undefined,
  keyProvider: KeyProvider
): Promise<EncryptResult> {
  if (!plaintext || plaintext.trim() === "") {
    return { success: true, encrypted: null as unknown as string };
  }

  try {
    // Obter versão ativa
    const version = await keyProvider.getActiveVersion();
    
    // Obter chave
    const key = await keyProvider.getKey(version);
    if (!key) {
      return { success: false, error: `Key version ${version} not available` };
    }

    // Criptografar
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Gerar IV aleatório de 12 bytes
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    // Combinar IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Converter para base64
    const payload = btoa(String.fromCharCode(...combined));
    
    // Formato versionado: ENC_V{version}:{payload}
    const encrypted = `${ENCRYPTION_PREFIX}${version}:${payload}`;
    
    log.debug(`Encrypted with version ${version}`);
    
    return { success: true, encrypted, version };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Encryption failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Criptografa usando uma versão específica (para re-criptografia)
 */
export async function encryptWithSpecificVersion(
  plaintext: string,
  version: number,
  keyProvider: KeyProvider
): Promise<EncryptResult> {
  try {
    const key = await keyProvider.getKey(version);
    if (!key) {
      return { success: false, error: `Key version ${version} not available` };
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    const payload = btoa(String.fromCharCode(...combined));
    const encrypted = `${ENCRYPTION_PREFIX}${version}:${payload}`;
    
    return { success: true, encrypted, version };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
