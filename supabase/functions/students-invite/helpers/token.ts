/**
 * Token helpers for students-invite Edge Function
 * RISE V3 Compliant
 */

export function generateToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID();
}
