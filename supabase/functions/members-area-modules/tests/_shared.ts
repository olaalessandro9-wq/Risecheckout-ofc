/**
 * Shared types and utilities for members-area-modules tests
 * RISE Protocol V3 Compliant
 */

// ============================================
// TYPES
// ============================================

export interface MemberSection {
  id: string;
  type: string;
  viewport?: 'desktop' | 'mobile';
  title?: string | null;
  position: number;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

export interface ModuleData {
  title: string;
  description?: string;
  cover_image_url?: string | null;
}

export interface ModuleRequest {
  action: string;
  productId?: string;
  moduleId?: string;
  data?: ModuleData;
  orderedIds?: string[];
  sections?: MemberSection[];
  deletedIds?: string[];
  settings?: Record<string, unknown>;
}

export interface BuilderSettings {
  show_menu_desktop?: boolean;
  show_menu_mobile?: boolean;
  theme?: string;
  banner_size?: string;
  primary_color?: string;
}

export interface ModuleResponse {
  success: boolean;
  modules?: Array<{ id: string; title: string; position: number }>;
  module?: { id: string; title: string };
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const VALID_ACTIONS = [
  "list",
  "create",
  "update",
  "delete",
  "reorder",
  "save-sections",
  "save-builder-settings",
] as const;

export const VALID_SECTION_TYPES = ["modules", "text", "banner", "fixed_header", "cta"] as const;

export const VALID_VIEWPORTS = ["desktop", "mobile"] as const;

// ============================================
// HELPERS
// ============================================

export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number]);
}

export function isValidSectionType(type: string): boolean {
  return VALID_SECTION_TYPES.includes(type as typeof VALID_SECTION_TYPES[number]);
}

export function isValidViewport(viewport: string): boolean {
  return VALID_VIEWPORTS.includes(viewport as typeof VALID_VIEWPORTS[number]);
}

export function normalizePositions<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, index) => ({
    ...item,
    position: index,
  }));
}

export function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}
