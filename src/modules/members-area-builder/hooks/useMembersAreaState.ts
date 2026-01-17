/**
 * Members Area Builder - State Management Hook
 * 
 * Responsible for:
 * - useReducer as Single Source of Truth
 * - State refs for comparison during save
 * 
 * REFACTORED: Uses useReducer instead of useState
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - State Management via Reducer
 */

import { useReducer, useRef } from 'react';
import type { 
  Section,
  MembersAreaBuilderSettings,
} from '../types/builder.types';
import { DEFAULT_BUILDER_SETTINGS } from '../types/builder.types';
import { 
  builderReducer, 
  INITIAL_BUILDER_STATE,
  type BuilderAction,
} from '../state/builderReducer';

/** Valid section types for type guard */
export const VALID_SECTION_TYPES = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'] as const;

/** Type guard for SectionType */
export function isSectionType(type: string): type is typeof VALID_SECTION_TYPES[number] {
  return VALID_SECTION_TYPES.includes(type as typeof VALID_SECTION_TYPES[number]);
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

/** Check if ID is temporary (not yet in DB) */
export function isTemporaryId(id: string): boolean {
  return id.startsWith('temp_');
}

/** Hook return type */
export interface UseMembersAreaStateReturn {
  state: ReturnType<typeof builderReducer>;
  dispatch: React.Dispatch<BuilderAction>;
  originalSectionsRef: React.MutableRefObject<Section[]>;
  originalSettingsRef: React.MutableRefObject<MembersAreaBuilderSettings>;
}

/**
 * State management hook for Members Area Builder
 * Uses useReducer for Single Source of Truth
 */
export function useMembersAreaState(): UseMembersAreaStateReturn {
  const [state, dispatch] = useReducer(builderReducer, INITIAL_BUILDER_STATE);
  
  // Store original sections from DB for comparison during save
  const originalSectionsRef = useRef<Section[]>([]);
  const originalSettingsRef = useRef<MembersAreaBuilderSettings>(DEFAULT_BUILDER_SETTINGS);

  return {
    state,
    dispatch,
    originalSectionsRef,
    originalSettingsRef,
  };
}
