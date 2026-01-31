/**
 * Buyer Profile Tests - Shared Types and Utilities
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * @module buyer-profile/tests/_shared
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BuyerProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  avatar_url?: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ProfileResponse {
  success: boolean;
  profile?: BuyerProfile;
  error?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockBuyerProfile: BuyerProfile = {
  id: "buyer-uuid-001",
  email: "comprador@teste.com",
  name: "João Comprador",
  phone: "+5511999998888",
  created_at: "2025-01-01T00:00:00Z",
  avatar_url: null,
};

export const mockUpdatePayload: UpdateProfilePayload = {
  name: "João da Silva",
  phone: "+5511888887777",
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates phone format (Brazilian).
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+55\d{10,11}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Validates name (min 2 chars, max 100).
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Sanitizes name input.
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

/**
 * Validates avatar URL.
 */
export function isValidAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Merges update payload with existing profile.
 */
export function mergeProfileUpdate(
  existing: BuyerProfile,
  update: UpdateProfilePayload
): BuyerProfile {
  return {
    ...existing,
    name: update.name !== undefined ? sanitizeName(update.name) : existing.name,
    phone: update.phone !== undefined ? update.phone : existing.phone,
    avatar_url: update.avatar_url !== undefined ? update.avatar_url : existing.avatar_url,
  };
}
