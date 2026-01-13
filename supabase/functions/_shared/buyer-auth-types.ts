/**
 * Tipos e Constantes para Buyer Auth
 * 
 * Separado do handler para manter arquivos < 300 linhas
 */

// ============================================
// HASH CONSTANTS
// ============================================
export const HASH_VERSION_SHA256 = 1;
export const HASH_VERSION_BCRYPT = 2;
export const CURRENT_HASH_VERSION = HASH_VERSION_BCRYPT;
export const BCRYPT_COST = 10;

// ============================================
// SESSION CONSTANTS
// ============================================
export const SESSION_DURATION_DAYS = 30;
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// ============================================
// REQUEST TYPES
// ============================================
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  sessionToken: string;
}

export interface ValidateRequest {
  sessionToken: string;
}

export interface CheckEmailRequest {
  email: string;
}

export interface RequestResetRequest {
  email: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface CheckProducerBuyerRequest {
  email: string;
  producerUserId?: string;
}

export interface EnsureProducerAccessRequest {
  email: string;
  productId: string;
  producerUserId?: string;
}

export interface ProducerLoginRequest {
  email: string;
}

// ============================================
// RESPONSE TYPES
// ============================================
export interface BuyerData {
  id: string;
  email: string;
  name: string | null;
}

export interface SessionResponse {
  success: boolean;
  sessionToken: string;
  expiresAt: string;
  buyer: BuyerData;
}

export interface ValidateResponse {
  valid: boolean;
  buyer?: BuyerData;
}

// ============================================
// INTERNAL TYPES
// ============================================
export interface BuyerRecord {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  password_hash_version: number | null;
  is_active: boolean;
  phone?: string | null;
}

export interface SessionRecord {
  id: string;
  buyer_id: string;
  session_token: string;
  expires_at: string;
  is_valid: boolean;
  buyer?: BuyerRecord | BuyerRecord[];
}
