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
// SESSION CONSTANTS (REMOVED - RISE V3)
// ============================================
// Legacy constants PRODUCER_SESSION_DURATION_DAYS, BUYER_SESSION_DURATION_DAYS,
// and SESSION_DURATION_DAYS were removed in Fase 13 (2026-01-23).
// All session durations are now derived from ACCESS_TOKEN_DURATION_MINUTES
// and REFRESH_TOKEN_DURATION_DAYS below.

// ============================================
// REFRESH TOKEN CONSTANTS (SESSION COMMANDER)
// ============================================

/**
 * Access token duration in minutes
 * 
 * SESSION COMMANDER ARCHITECTURE - RISE V3 2026-01-26
 * 
 * Increased from 60 to 240 minutes (4 hours) to match market standards
 * (Cakto, Kiwify, Hotmart) and eliminate frequent logouts.
 * 
 * This change is part of the Session Commander Architecture:
 * 1. Fewer refreshes = fewer race conditions between tabs
 * 2. More time for retries in case of transient failures
 * 3. Better UX for users who leave tabs open
 * 
 * Security maintained via:
 * - Server-side refresh locks (refresh_locks table)
 * - Refresh token rotation (theft detection)
 * - httpOnly cookies (XSS protection)
 * - 30-day refresh token expiry (sliding window)
 */
export const ACCESS_TOKEN_DURATION_MINUTES = 240; // 4 hours

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
// PASSWORD MARKERS (REMOVED)
// ============================================
// RISE V3: Eliminados em 2026-01-20.
// A fonte de verdade é EXCLUSIVAMENTE o campo `account_status`.
// Constantes PASSWORD_REQUIRES_RESET, PASSWORD_PENDING_SETUP, 
// PASSWORD_OWNER_NO_PASSWORD e PENDING_MIGRATION foram removidas.
