/**
 * ============================================================================
 * KMS Types - Key Management System Type Definitions
 * ============================================================================
 * 
 * Tipos centralizados para o sistema de gerenciamento de chaves.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

// ============================================================================
// KEY VERSION TYPES
// ============================================================================

export type KeyStatus = 'active' | 'rotating' | 'deprecated' | 'revoked';

export interface KeyVersion {
  id: number;
  version: number;
  keyIdentifier: string;
  algorithm: string;
  status: KeyStatus;
  createdAt: Date;
  activatedAt: Date | null;
  deprecatedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// ENCRYPTION FORMAT
// ============================================================================

/**
 * Formato de dados criptografados:
 * - V1: base64(iv:ciphertext:tag)
 * - Versioned:   ENC_V{version}:{base64(iv:ciphertext:tag)}
 */
export interface EncryptedData {
  version: number;
  payload: string;  // base64 encoded
}

export const ENCRYPTION_PREFIX = 'ENC_V';
export const LEGACY_VERSION = 1;

// ============================================================================
// OPERATION RESULTS
// ============================================================================

export interface EncryptResult {
  success: boolean;
  encrypted?: string;
  version?: number;
  error?: string;
}

export interface DecryptResult {
  success: boolean;
  decrypted?: string;
  version?: number;
  error?: string;
}

export interface RotationResult {
  success: boolean;
  recordsProcessed?: number;
  recordsFailed?: number;
  fromVersion?: number;
  toVersion?: number;
  error?: string;
}

// ============================================================================
// KEY PROVIDER INTERFACE
// ============================================================================

/**
 * Interface abstrata para provedores de chaves.
 * Permite trocar a implementação (env vars, Vault, HSM, etc.)
 */
export interface KeyProvider {
  /**
   * Obtém a chave para uma versão específica
   */
  getKey(version: number): Promise<CryptoKey | null>;
  
  /**
   * Obtém a versão ativa atual
   */
  getActiveVersion(): Promise<number>;
  
  /**
   * Verifica se uma versão está disponível
   */
  hasVersion(version: number): Promise<boolean>;
}

// ============================================================================
// ROTATION CONFIG
// ============================================================================

export interface RotationConfig {
  batchSize: number;
  delayBetweenBatches: number;  // ms
  maxRetries: number;
  tables: TableRotationConfig[];
}

export interface TableRotationConfig {
  tableName: string;
  encryptedColumns: string[];
  primaryKey: string;
  whereClause?: string;  // filtro opcional
}

// ============================================================================
// DEFAULT ROTATION CONFIG
// ============================================================================

export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  batchSize: 100,
  delayBetweenBatches: 100,
  maxRetries: 3,
  tables: [
    {
      tableName: 'orders',
      encryptedColumns: ['customer_phone_encrypted', 'customer_cpf_encrypted'],
      primaryKey: 'id',
    },
    {
      tableName: 'buyer_profiles',
      encryptedColumns: ['document_encrypted'],
      primaryKey: 'id',
    },
  ],
};
