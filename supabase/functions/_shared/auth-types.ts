/**
 * Tipos e Constantes para Buyer Auth
 * 
 * RISE V3: Constants imported from auth-constants.ts (Single Source of Truth)
 */

// Import centralized constants
export { 
  CURRENT_HASH_VERSION, 
  BCRYPT_COST,
  RESET_TOKEN_EXPIRY_HOURS,
  ACCESS_TOKEN_DURATION_MINUTES,
  REFRESH_TOKEN_DURATION_DAYS,
} from "./auth-constants.ts";

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
