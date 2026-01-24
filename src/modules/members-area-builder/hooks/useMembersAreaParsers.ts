/**
 * Members Area Builder - Data Parsers
 * 
 * Responsible for:
 * - Parsing raw database data into typed structures
 * - Providing safe defaults
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import type { 
  Section, 
  SectionSettings,
  MembersAreaBuilderSettings,
} from '../types/builder.types';
import { DEFAULT_BUILDER_SETTINGS } from '../types/builder.types';

/** Valid section types for type guard */
const VALID_SECTION_TYPES = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'] as const;

/** Type guard for SectionType */
function isSectionType(type: string): type is typeof VALID_SECTION_TYPES[number] {
  return VALID_SECTION_TYPES.includes(type as typeof VALID_SECTION_TYPES[number]);
}

/** Raw database row type for sections */
interface RawSectionRow {
  id: string;
  product_id: string;
  type: string;
  title: string | null;
  position: number;
  settings: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Parse raw database sections into typed Section array
 */
export function parseSections(data: unknown[]): Section[] {
  return (data || []).map((item) => {
    const row = item as RawSectionRow;
    return {
      id: row.id,
      product_id: row.product_id,
      type: isSectionType(row.type) ? row.type : 'text',
      title: row.title,
      position: row.position,
      settings: (row.settings || {}) as unknown as SectionSettings,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Parse raw database settings into typed MembersAreaBuilderSettings
 */
export function parseSettings(data: unknown): MembersAreaBuilderSettings {
  if (!data || typeof data !== 'object') return DEFAULT_BUILDER_SETTINGS;
  
  const partial = data as Partial<MembersAreaBuilderSettings>;
  
  return {
    theme: partial.theme ?? DEFAULT_BUILDER_SETTINGS.theme,
    primary_color: partial.primary_color ?? DEFAULT_BUILDER_SETTINGS.primary_color,
    logo_url: partial.logo_url,
    favicon_url: partial.favicon_url,
    share_image_url: partial.share_image_url,
    show_menu_desktop: partial.show_menu_desktop ?? DEFAULT_BUILDER_SETTINGS.show_menu_desktop,
    show_menu_mobile: partial.show_menu_mobile ?? DEFAULT_BUILDER_SETTINGS.show_menu_mobile,
    menu_items: partial.menu_items ?? DEFAULT_BUILDER_SETTINGS.menu_items,
    sidebar_animation: partial.sidebar_animation ?? DEFAULT_BUILDER_SETTINGS.sidebar_animation,
    login_layout: partial.login_layout ?? DEFAULT_BUILDER_SETTINGS.login_layout,
    login_background_url: partial.login_background_url,
    login_logo_url: partial.login_logo_url,
  };
}
