/**
 * Email Configuration - Centralized Email Addresses
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Single Source of Truth for all email addresses used in the system.
 * Works with site-urls.ts for domain-based email generation.
 * 
 * Architecture:
 * - Uses SITE_BASE_DOMAIN for dynamic email construction
 * - Supports environment overrides for specific addresses
 * - Zero hardcoded emails in templates
 * 
 * Usage:
 * ```typescript
 * import { buildEmail, getSupportEmail, getNoReplyEmail } from "../_shared/email-config.ts";
 * 
 * buildEmail('support')  // → "suporte@risecheckout.com"
 * buildEmail('noreply')  // → "naoresponda@risecheckout.com"
 * ```
 * 
 * @version 1.0.0
 */

import { createLogger } from "./logger.ts";

const log = createLogger("EmailConfig");

// ============================================================================
// TYPES
// ============================================================================

export type EmailType = 'support' | 'noreply' | 'notifications' | 'privacy';

// ============================================================================
// DOMAIN RESOLUTION
// ============================================================================

let cachedEmailDomain: string | null = null;

/**
 * Gets the base domain for email addresses.
 * Uses SITE_BASE_DOMAIN for consistency with site-urls.ts
 * 
 * @throws Error if SITE_BASE_DOMAIN is not configured
 */
function getEmailDomain(): string {
  if (cachedEmailDomain) return cachedEmailDomain;
  
  const domain = Deno.env.get("SITE_BASE_DOMAIN");
  
  if (!domain) {
    log.error("SITE_BASE_DOMAIN not configured - required for email addresses");
    throw new Error("SITE_BASE_DOMAIN environment variable is required");
  }
  
  // Clean up: remove protocol and trailing slash if accidentally included
  cachedEmailDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  
  log.debug(`Email domain resolved: ${cachedEmailDomain}`);
  return cachedEmailDomain;
}

// ============================================================================
// EMAIL PREFIX MAPPING
// ============================================================================

/**
 * Maps email types to localized prefixes.
 * Portuguese prefixes for PT-BR user experience.
 */
const EMAIL_PREFIX_MAP: Record<EmailType, string> = {
  support: 'suporte',
  noreply: 'naoresponda',
  notifications: 'notificacoes',
  privacy: 'privacidade',
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Builds an email address for the given type.
 * 
 * @param type - Type of email address to build
 * @returns Full email address with domain
 * 
 * @example
 * buildEmail('support')        // → "suporte@risecheckout.com"
 * buildEmail('noreply')        // → "naoresponda@risecheckout.com"
 * buildEmail('notifications')  // → "notificacoes@risecheckout.com"
 * buildEmail('privacy')        // → "privacidade@risecheckout.com"
 */
export function buildEmail(type: EmailType): string {
  const domain = getEmailDomain();
  const prefix = EMAIL_PREFIX_MAP[type];
  
  return `${prefix}@${domain}`;
}

/**
 * Gets the support email address.
 * Prefers environment override, falls back to dynamic construction.
 * 
 * @returns Support email address
 */
export function getSupportEmail(): string {
  const envEmail = Deno.env.get('ZEPTOMAIL_FROM_SUPPORT')?.trim();
  if (envEmail) return envEmail;
  
  return buildEmail('support');
}

/**
 * Gets the no-reply email address.
 * Prefers environment override, falls back to dynamic construction.
 * 
 * @returns No-reply email address
 */
export function getNoReplyEmail(): string {
  const envEmail = Deno.env.get('ZEPTOMAIL_FROM_NOREPLY')?.trim();
  if (envEmail) return envEmail;
  
  return buildEmail('noreply');
}

/**
 * Gets the notifications email address.
 * Prefers environment override, falls back to dynamic construction.
 * 
 * @returns Notifications email address
 */
export function getNotificationsEmail(): string {
  const envEmail = Deno.env.get('ZEPTOMAIL_FROM_NOTIFICATIONS')?.trim();
  if (envEmail) return envEmail;
  
  return buildEmail('notifications');
}

/**
 * Gets the privacy email address (for LGPD/GDPR).
 * 
 * @returns Privacy email address
 */
export function getPrivacyEmail(): string {
  return buildEmail('privacy');
}

// ============================================================================
// CACHE MANAGEMENT (for testing)
// ============================================================================

/**
 * Resets the cached domain (useful for testing).
 * @internal
 */
export function _resetEmailDomainCache(): void {
  cachedEmailDomain = null;
}
