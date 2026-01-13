/**
 * encryption.ts - Criptografia AES-256-GCM para dados sensíveis
 * 
 * Usa BUYER_ENCRYPTION_KEY do ambiente para criptografar/descriptografar
 * CPF, telefone e outros dados PII.
 * 
 * Formato do dado criptografado: base64(iv:ciphertext:tag)
 */

/**
 * Deriva uma chave AES-256 a partir da BUYER_ENCRYPTION_KEY
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
    ["encrypt", "decrypt"]
  );
}

/**
 * Criptografa um valor usando AES-256-GCM
 * @returns string no formato base64(iv:ciphertext:tag) ou null se falhar
 */
export async function encryptValue(plaintext: string | null | undefined): Promise<string | null> {
  if (!plaintext || plaintext.trim() === "") {
    return null;
  }
  
  const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
  if (!encryptionKey) {
    console.error("[encryption] BUYER_ENCRYPTION_KEY não configurada!");
    // SECURITY: Não salvar em texto plano se a chave não existir
    throw new Error("Encryption key not configured");
  }
  
  try {
    const key = await deriveKey(encryptionKey);
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Gerar IV aleatório de 12 bytes (recomendado para AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Criptografar
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    // Combinar IV + ciphertext (o tag já está incluído no ciphertext do WebCrypto)
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Converter para base64
    return btoa(String.fromCharCode(...combined));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[encryption] Erro ao criptografar:", errorMessage);
    throw new Error("Encryption failed");
  }
}

/**
 * Descriptografa um valor criptografado com AES-256-GCM
 * @returns string descriptografada ou null se falhar
 */
export async function decryptValue(encrypted: string | null | undefined): Promise<string | null> {
  if (!encrypted || encrypted.trim() === "") {
    return null;
  }
  
  const encryptionKey = Deno.env.get("BUYER_ENCRYPTION_KEY");
  if (!encryptionKey) {
    console.error("[encryption] BUYER_ENCRYPTION_KEY não configurada!");
    throw new Error("Encryption key not configured");
  }
  
  try {
    const key = await deriveKey(encryptionKey);
    
    // Decodificar base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extrair IV (primeiros 12 bytes) e ciphertext (resto)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    // Descriptografar
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[encryption] Erro ao descriptografar:", errorMessage);
    // Pode ser dado não criptografado (legado) - retornar null
    return null;
  }
}

/**
 * Verifica se um valor parece estar criptografado (formato base64 válido)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value || value.trim() === "") {
    return false;
  }
  
  try {
    // Tentar decodificar base64
    const decoded = atob(value);
    // Verificar se tem pelo menos 12 bytes de IV + algum dado
    return decoded.length > 12;
  } catch {
    return false;
  }
}

/**
 * Descriptografa de forma segura, retornando o valor original se não for criptografado
 * Útil para migração gradual de dados legados
 */
export async function safeDecrypt(value: string | null | undefined): Promise<string | null> {
  if (!value || value.trim() === "") {
    return null;
  }
  
  // Se não parece criptografado, retornar como está (dado legado)
  if (!isEncrypted(value)) {
    return value;
  }
  
  const decrypted = await decryptValue(value);
  // Se falhar na descriptografia, assumir que é dado legado
  return decrypted ?? value;
}
