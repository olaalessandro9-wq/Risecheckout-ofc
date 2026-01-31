/**
 * Shared types and utilities for students-list tests
 * RISE Protocol V3 Compliant
 */

// ============================================
// TYPES
// ============================================

export interface ListRequest {
  action: string;
  product_id?: string;
  buyer_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  access_type?: string;
  status?: string;
  group_id?: string;
}

export interface StudentDetail {
  id: string;
  email: string;
  name: string | null;
  last_login_at: string | null;
  password_hash: string | null;
  access: Array<{ id: string; is_active: boolean }>;
  groups: Array<{ group: { id: string; name: string } }>;
  progress: Array<{ content_id: string; progress_percent: number }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProducerInfo {
  id: string;
  name: string | null;
  email: string | null;
}

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = ["list", "get", "get-producer-info"] as const;

export const VALID_ACCESS_TYPES = ["purchase", "invite", "manual"] as const;

export const VALID_STATUSES = ["active", "inactive", "expired"] as const;

export const MAX_LIMIT = 100;
export const MIN_LIMIT = 1;
export const DEFAULT_LIMIT = 20;

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number]);
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function clampLimit(limit: number): number {
  return Math.max(MIN_LIMIT, Math.min(limit, MAX_LIMIT));
}

export function normalizeSearch(search: string): string {
  return search.trim().toLowerCase();
}

export function escapeSearchPattern(search: string): string {
  return search.replace(/%/g, "\\%");
}

export function mapStatusToBoolean(status: string): boolean | undefined {
  const statusMap: Record<string, boolean> = {
    active: true,
    inactive: false,
  };
  return statusMap[status];
}

export function verifyProductOwnership(productUserId: string, producerId: string): boolean {
  return productUserId === producerId;
}

export function needsPasswordSetup(passwordHash: string | null): boolean {
  return passwordHash === null;
}
