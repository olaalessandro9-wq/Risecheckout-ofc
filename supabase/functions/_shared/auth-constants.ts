/**
 * Auth Constants - Centralized
 * 
 * RISE Protocol V3: Single source of truth for all auth constants.
 * This file eliminates duplication across buyer-auth-types.ts and producer-auth-helpers.ts.
 * 
 * @version 1.0.0
 */

// ============================================
// HASH CONSTANTS
// ============================================

/**
 * Current hash version (bcrypt only - SHA-256 legacy eliminated)
 */
export const CURRENT_HASH_VERSION = 2;

/**
 * bcrypt cost factor (10 = ~100ms per hash)
 */
export const BCRYPT_COST = 10;

// ============================================
// SESSION CONSTANTS
// ============================================

/**
 * Producer session duration in days (legacy - for backwards compatibility)
 */
export const PRODUCER_SESSION_DURATION_DAYS = 30;

/**
 * Buyer session duration in days (legacy - for backwards compatibility)
 */
export const BUYER_SESSION_DURATION_DAYS = 30;

/**
 * Alias for backwards compatibility with buyer-auth-types.ts
 */
export const SESSION_DURATION_DAYS = BUYER_SESSION_DURATION_DAYS;

// ============================================
// REFRESH TOKEN CONSTANTS (PHASE 3)
// ============================================

/**
 * Access token duration in minutes (short-lived for security)
 */
export const ACCESS_TOKEN_DURATION_MINUTES = 15;

/**
 * Refresh token duration in days (long-lived for convenience)
 */
export const REFRESH_TOKEN_DURATION_DAYS = 30;

/**
 * Password reset token expiry in hours
 */
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// ============================================
// ACCOUNT STATUS (PHASE 2: Replaces Password Markers)
// ============================================

/**
 * Account status enum - replaces password_hash markers
 * RISE V3: Single source of truth for account states
 */
export enum AccountStatus {
  ACTIVE = "active",
  PENDING_SETUP = "pending_setup",
  RESET_REQUIRED = "reset_required",
  OWNER_NO_PASSWORD = "owner_no_password",
}

// ============================================
// PASSWORD MARKERS (DEPRECATED)
// ============================================

/**
 * @deprecated Use AccountStatus.RESET_REQUIRED instead.
 * Kept for backwards compatibility during migration.
 */
export const PASSWORD_REQUIRES_RESET = "REQUIRES_RESET";

/**
 * @deprecated Use AccountStatus.PENDING_SETUP instead.
 * Kept for backwards compatibility during migration.
 */
export const PASSWORD_PENDING_SETUP = "PENDING_PASSWORD_SETUP";

/**
 * @deprecated Use AccountStatus.OWNER_NO_PASSWORD instead.
 * Kept for backwards compatibility during migration.
 */
export const PASSWORD_OWNER_NO_PASSWORD = "OWNER_NO_PASSWORD";

/**
 * @deprecated Use AccountStatus instead.
 * Kept for migration detection only.
 */
export const PENDING_MIGRATION = "PENDING_MIGRATION";
