/**
 * Token Persistence - localStorage Operations
 * 
 * RISE Protocol V3: Single Responsibility - Storage Only
 * 
 * This module handles all localStorage operations for token state,
 * isolating I/O from the main service logic.
 */

import type { TokenState, TokenContext, TokenType } from "./types";
import { STORAGE_KEYS } from "./types";
import { createLogger } from "@/lib/logger";

const log = createLogger("TokenPersistence");

// ============================================
// PERSISTED STATE INTERFACE
// ============================================

export interface PersistedState {
  state: TokenState | null;
  expiresAt: number | null;
  lastRefreshAttempt: number | null;
}

// ============================================
// PERSISTENCE FUNCTIONS
// ============================================

/**
 * Save token state to localStorage
 */
export function persistTokenState(
  type: TokenType,
  state: TokenState,
  context: TokenContext
): void {
  const keys = STORAGE_KEYS[type];
  
  try {
    if (state === "idle") {
      clearPersistedState(type);
    } else {
      localStorage.setItem(keys.state, state);
      if (context.expiresAt) {
        localStorage.setItem(keys.expiresAt, String(context.expiresAt));
      }
      if (context.lastRefreshAttempt) {
        localStorage.setItem(keys.lastRefresh, String(context.lastRefreshAttempt));
      }
    }
  } catch (error) {
    log.error("Failed to persist state", error);
  }
}

/**
 * Restore token state from localStorage
 */
export function restoreTokenState(type: TokenType): PersistedState {
  const keys = STORAGE_KEYS[type];
  
  try {
    const state = localStorage.getItem(keys.state) as TokenState | null;
    const expiresAtRaw = localStorage.getItem(keys.expiresAt);
    const lastRefreshRaw = localStorage.getItem(keys.lastRefresh);
    
    const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;
    const lastRefreshAttempt = lastRefreshRaw ? Number(lastRefreshRaw) : null;
    
    return { 
      state, 
      expiresAt: expiresAt || null, 
      lastRefreshAttempt: lastRefreshAttempt || null,
    };
  } catch (error) {
    log.error("Failed to restore state", error);
    return { state: null, expiresAt: null, lastRefreshAttempt: null };
  }
}

/**
 * Clear all persisted state for a token type
 */
export function clearPersistedState(type: TokenType): void {
  const keys = STORAGE_KEYS[type];
  
  try {
    localStorage.removeItem(keys.state);
    localStorage.removeItem(keys.expiresAt);
    localStorage.removeItem(keys.lastRefresh);
    log.debug("Cleared persisted state", { type });
  } catch (error) {
    log.error("Failed to clear persisted state", error);
  }
}
