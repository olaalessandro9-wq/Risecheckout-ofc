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
import { isSectionType, type RawSectionRow } from './useMembersAreaState';

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
    menu_items: partial.menu_items ?? DEFAULT_BUILDER_SETTINGS.menu_items,
    sidebar_animation: partial.sidebar_animation ?? DEFAULT_BUILDER_SETTINGS.sidebar_animation,
    login_layout: partial.login_layout ?? DEFAULT_BUILDER_SETTINGS.login_layout,
    login_background_url: partial.login_background_url,
    login_logo_url: partial.login_logo_url,
  };
}
