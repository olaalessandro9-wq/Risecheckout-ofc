/**
 * Shared types and utilities for students-invite tests
 * RISE Protocol V3 Compliant
 */

// ============================================
// TYPES
// ============================================

export interface InviteRequest {
  action: string;
  token?: string;
  password?: string;
  order_id?: string;
  customer_email?: string;
  product_id?: string;
  email?: string;
  name?: string;
  group_ids?: string[];
}

export interface ValidationResponse {
  valid: boolean;
  needsPasswordSetup?: boolean;
  buyer_id?: string;
  product_id?: string;
  product_name?: string;
  product_image?: string | null;
  buyer_email?: string;
  buyer_name?: string;
  reason?: string;
}

export interface SuccessResponse {
  success: boolean;
  buyer?: { id: string; email: string; name: string };
  accessUrl?: string;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = [
  "validate-invite-token",
  "use-invite-token",
  "generate-purchase-access",
  "invite",
] as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number]);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function generateToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  return hashToken(password);
}

export function buildAccessUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/setup-access?token=${encodeURIComponent(token)}`;
}
