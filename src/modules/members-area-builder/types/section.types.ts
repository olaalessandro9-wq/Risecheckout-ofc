/**
 * Members Area Builder - Section Types
 * Tipo discriminante e interface Section
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

import type { Viewport } from './viewport.types';
import type { SectionSettings } from './settings.types';

// =====================================================
// SECTION TYPE (Discriminant)
// =====================================================

export type SectionType = 
  | 'fixed_header'  // Always first, cannot be moved/deleted
  | 'banner' 
  | 'modules' 
  | 'courses' 
  | 'continue_watching' 
  | 'text' 
  | 'spacer';

// =====================================================
// SECTION INTERFACE
// =====================================================

export interface Section {
  id: string;
  product_id: string;
  type: SectionType;
  viewport: Viewport; // Identifies which layout this section belongs to
  title: string | null;
  position: number;
  settings: SectionSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
