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
 * Producer session duration in days
 */
export const PRODUCER_SESSION_DURATION_DAYS = 30;

/**
 * Buyer session duration in days
 */
export const BUYER_SESSION_DURATION_DAYS = 30;

/**
 * Alias for backwards compatibility with buyer-auth-types.ts
 */
export const SESSION_DURATION_DAYS = BUYER_SESSION_DURATION_DAYS;

/**
 * Password reset token expiry in hours
 */
export const RESET_TOKEN_EXPIRY_HOURS = 1;

// ============================================
// PASSWORD MARKERS
// ============================================

/**
 * Marker for passwords that require reset (e.g., forgot password flow)
 */
export const PASSWORD_REQUIRES_RESET = "REQUIRES_RESET";

/**
 * Marker for newly created accounts pending password setup
 */
export const PASSWORD_PENDING_SETUP = "PENDING_PASSWORD_SETUP";

/**
 * Marker for owner/producer accounts that don't need password (access via producer auth)
 */
export const PASSWORD_OWNER_NO_PASSWORD = "OWNER_NO_PASSWORD";

/**
 * @deprecated Use PASSWORD_REQUIRES_RESET or PASSWORD_PENDING_SETUP instead.
 * Kept for migration detection only.
 */
export const PENDING_MIGRATION = "PENDING_MIGRATION";
