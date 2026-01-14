/**
 * Members Area Builder - State Management Hook
 * 
 * Responsible for:
 * - Initial state setup
 * - State refs for comparison during save
 * - State wrapper types
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useState, useRef } from 'react';
import type { 
  BuilderState, 
  Section,
  SectionType,
  MembersAreaBuilderSettings,
} from '../types/builder.types';
import { DEFAULT_BUILDER_SETTINGS } from '../types/builder.types';

/** Valid section types for type guard */
export const VALID_SECTION_TYPES: SectionType[] = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'];

/** Type guard for SectionType */
export function isSectionType(type: string): type is SectionType {
  return VALID_SECTION_TYPES.includes(type as SectionType);
}

/** Raw section row from database */
export interface RawSectionRow {
  id: string;
  product_id: string;
  type: string;
  title: string | null;
  position: number;
  settings: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Initial state for the builder */
export const INITIAL_STATE: BuilderState = {
  sections: [],
  settings: DEFAULT_BUILDER_SETTINGS,
  selectedSectionId: null,
  selectedMenuItemId: null,
  viewMode: 'desktop',
  isPreviewMode: false,
  isMenuCollapsed: false,
  isDirty: false,
  isLoading: true,
  isSaving: false,
  modules: [],
  selectedModuleId: null,
  isEditingModule: false,
};

/** Check if ID is temporary (not yet in DB) */
export function isTemporaryId(id: string): boolean {
  return id.startsWith('temp_');
}

/** Hook return type */
export interface UseMembersAreaStateReturn {
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
  originalSectionsRef: React.MutableRefObject<Section[]>;
  originalSettingsRef: React.MutableRefObject<MembersAreaBuilderSettings>;
}

/**
 * State management hook for Members Area Builder
 */
export function useMembersAreaState(): UseMembersAreaStateReturn {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  
  // Store original sections from DB for comparison during save
  const originalSectionsRef = useRef<Section[]>([]);
  const originalSettingsRef = useRef<MembersAreaBuilderSettings>(DEFAULT_BUILDER_SETTINGS);

  return {
    state,
    setState,
    originalSectionsRef,
    originalSettingsRef,
  };
}
