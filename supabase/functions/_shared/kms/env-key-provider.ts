/**
 * ============================================================================
 * KMS Environment Key Provider - Key Provider using Environment Variables
 * ============================================================================
 * 
 * Implementação do KeyProvider que usa variáveis de ambiente.
 * 
 * Convenção de nomes:
 * - Versão 1: BUYER_ENCRYPTION_KEY (legado)
 * - Versão 2+: BUYER_ENCRYPTION_KEY_V{version}
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../logger.ts";
import type { KeyProvider } from "./types.ts";
import { LEGACY_VERSION } from "./types.ts";

const log = createLogger("KMS-EnvProvider");

/**
 * Cache de chaves derivadas para evitar re-derivação
 */
const keyCache = new Map<number, CryptoKey>();

/**
 * Deriva uma chave AES-256 a partir do material
 */
async function deriveKey(keyMaterial: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
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
 * Obtém o nome da variável de ambiente para uma versão
 */
function getEnvVarName(version: number): string {
  if (version === LEGACY_VERSION) {
    return "BUYER_ENCRYPTION_KEY";
  }
  return `BUYER_ENCRYPTION_KEY_V${version}`;
}

/**
 * Provider de chaves baseado em variáveis de ambiente
 */
export class EnvKeyProvider implements KeyProvider {
  private activeVersion: number | null = null;

  /**
   * Define a versão ativa manualmente (para testes ou override)
   */
  setActiveVersion(version: number): void {
    this.activeVersion = version;
  }

  /**
   * Obtém a chave para uma versão específica
   */
  async getKey(version: number): Promise<CryptoKey | null> {
    // Verificar cache
    if (keyCache.has(version)) {
      return keyCache.get(version)!;
    }

    // Obter material da chave
    const envVarName = getEnvVarName(version);
    const keyMaterial = Deno.env.get(envVarName);

    if (!keyMaterial) {
      log.warn(`Key not found for version ${version} (${envVarName})`);
      return null;
    }

    // Derivar e cachear
    const key = await deriveKey(keyMaterial);
    keyCache.set(version, key);

    log.debug(`Loaded key for version ${version}`);
    return key;
  }

  /**
   * Obtém a versão ativa atual
   * 
   * Estratégia:
   * 1. Se definida manualmente, usa essa
   * 2. Procura a maior versão disponível nas env vars
   */
  async getActiveVersion(): Promise<number> {
    if (this.activeVersion !== null) {
      return this.activeVersion;
    }

    // Procurar versões disponíveis (máximo razoável: 100)
    let highestVersion = LEGACY_VERSION;
    
    for (let v = 2; v <= 100; v++) {
      const envVarName = getEnvVarName(v);
      if (Deno.env.get(envVarName)) {
        highestVersion = v;
      } else {
        // Parar na primeira versão não encontrada (assumindo sequência)
        break;
      }
    }

    // Verificar se versão 1 existe (obrigatória)
    if (!Deno.env.get(getEnvVarName(LEGACY_VERSION))) {
      log.error("BUYER_ENCRYPTION_KEY not configured!");
      throw new Error("Encryption key not configured");
    }

    log.debug(`Active version detected: ${highestVersion}`);
    return highestVersion;
  }

  /**
   * Verifica se uma versão está disponível
   */
  async hasVersion(version: number): Promise<boolean> {
    const envVarName = getEnvVarName(version);
    return !!Deno.env.get(envVarName);
  }

  /**
   * Limpa o cache de chaves (útil para testes)
   */
  clearCache(): void {
    keyCache.clear();
    this.activeVersion = null;
  }
}

/**
 * Singleton do provider padrão
 */
let defaultProvider: EnvKeyProvider | null = null;

export function getDefaultKeyProvider(): EnvKeyProvider {
  if (!defaultProvider) {
    defaultProvider = new EnvKeyProvider();
  }
  return defaultProvider;
}
