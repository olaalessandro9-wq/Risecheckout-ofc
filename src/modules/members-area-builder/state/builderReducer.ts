/**
 * Members Area Builder - Reducer
 * 
 * Single Source of Truth para o estado do Builder
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - State Management via Reducer
 */

import type { 
  BuilderState, 
  Section, 
  SectionSettings,
  MembersAreaBuilderSettings,
  ViewMode,
  MemberModule,
} from '../types/builder.types';
import { DEFAULT_BUILDER_SETTINGS } from '../types/builder.types';

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_BUILDER_STATE: BuilderState = {
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

// ============================================================================
// ACTION TYPES
// ============================================================================

export type BuilderAction =
  // Loading/Saving
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'LOAD_SUCCESS'; sections: Section[]; settings: MembersAreaBuilderSettings }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_SAVED'; sections?: Section[] }
  | { type: 'DISCARD_CHANGES'; original: { sections: Section[]; settings: MembersAreaBuilderSettings } }
  // Sections
  | { type: 'ADD_SECTION'; section: Section }
  | { type: 'UPDATE_SECTION'; id: string; updates: Partial<Section> }
  | { type: 'UPDATE_SECTION_SETTINGS'; id: string; settings: Partial<SectionSettings> }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'REORDER_SECTIONS'; orderedIds: string[] }
  | { type: 'DUPLICATE_SECTION'; original: Section; duplicate: Section }
  // Selection
  | { type: 'SELECT_SECTION'; id: string | null }
  | { type: 'SELECT_MENU_ITEM'; id: string | null }
  // View
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'TOGGLE_PREVIEW_MODE' }
  | { type: 'TOGGLE_MENU_COLLAPSE' }
  // Settings
  | { type: 'UPDATE_SETTINGS'; settings: Partial<MembersAreaBuilderSettings> }
  // Modules
  | { type: 'SET_MODULES'; modules: MemberModule[] }
  | { type: 'UPDATE_MODULE'; id: string; data: Partial<MemberModule> }
  | { type: 'SELECT_MODULE'; id: string | null }
  | { type: 'SET_EDITING_MODULE'; isEditing: boolean };

// ============================================================================
// REDUCER
// ============================================================================

export function builderReducer(
  state: BuilderState,
  action: BuilderAction
): BuilderState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // LOADING/SAVING
    // -------------------------------------------------------------------------
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        sections: action.sections,
        settings: action.settings,
        isLoading: false,
        isDirty: false,
      };

    case 'MARK_DIRTY':
      return { ...state, isDirty: true };

    case 'MARK_SAVED':
      return {
        ...state,
        sections: action.sections ?? state.sections,
        isDirty: false,
        isSaving: false,
      };

    case 'DISCARD_CHANGES':
      return {
        ...state,
        sections: action.original.sections,
        settings: action.original.settings,
        isDirty: false,
        selectedSectionId: null,
      };

    // -------------------------------------------------------------------------
    // SECTIONS
    // -------------------------------------------------------------------------
    case 'ADD_SECTION':
      return {
        ...state,
        sections: [...state.sections, action.section].sort((a, b) => a.position - b.position),
        selectedSectionId: action.section.id,
        isDirty: true,
      };

    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.id
            ? { ...s, ...action.updates, updated_at: new Date().toISOString() }
            : s
        ),
        isDirty: true,
      };

    case 'UPDATE_SECTION_SETTINGS': {
      const section = state.sections.find(s => s.id === action.id);
      if (!section) return state;
      
      const mergedSettings = { ...section.settings, ...action.settings } as SectionSettings;
      
      return {
        ...state,
        sections: state.sections.map(s =>
          s.id === action.id
            ? { ...s, settings: mergedSettings, updated_at: new Date().toISOString() }
            : s
        ),
        isDirty: true,
      };
    }

    case 'DELETE_SECTION':
      return {
        ...state,
        sections: state.sections.filter(s => s.id !== action.id),
        selectedSectionId: state.selectedSectionId === action.id ? null : state.selectedSectionId,
        isDirty: true,
      };

    case 'REORDER_SECTIONS': {
      const sectionMap = new Map(state.sections.map(s => [s.id, s]));
      const reordered = action.orderedIds.map((id, index) => ({
        ...sectionMap.get(id)!,
        position: index,
        updated_at: new Date().toISOString(),
      }));
      return { ...state, sections: reordered, isDirty: true };
    }

    case 'DUPLICATE_SECTION': {
      const updated = state.sections.map(s =>
        s.position > action.original.position ? { ...s, position: s.position + 1 } : s
      );
      return {
        ...state,
        sections: [...updated, action.duplicate].sort((a, b) => a.position - b.position),
        selectedSectionId: action.duplicate.id,
        isDirty: true,
      };
    }

    // -------------------------------------------------------------------------
    // SELECTION
    // -------------------------------------------------------------------------
    case 'SELECT_SECTION':
      return { ...state, selectedSectionId: action.id, selectedMenuItemId: null };

    case 'SELECT_MENU_ITEM':
      return { ...state, selectedMenuItemId: action.id, selectedSectionId: null };

    // -------------------------------------------------------------------------
    // VIEW
    // -------------------------------------------------------------------------
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'TOGGLE_PREVIEW_MODE':
      return { ...state, isPreviewMode: !state.isPreviewMode };

    case 'TOGGLE_MENU_COLLAPSE':
      return { ...state, isMenuCollapsed: !state.isMenuCollapsed };

    // -------------------------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------------------------
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
        isDirty: true,
      };

    // -------------------------------------------------------------------------
    // MODULES
    // -------------------------------------------------------------------------
    case 'SET_MODULES':
      return { ...state, modules: action.modules };

    case 'UPDATE_MODULE':
      return {
        ...state,
        modules: state.modules.map(m =>
          m.id === action.id ? { ...m, ...action.data } : m
        ),
      };

    case 'SELECT_MODULE':
      return {
        ...state,
        selectedModuleId: action.id,
        isEditingModule: action.id !== null,
      };

    case 'SET_EDITING_MODULE':
      return {
        ...state,
        isEditingModule: action.isEditing,
        selectedModuleId: action.isEditing ? state.selectedModuleId : null,
      };

    default:
      return state;
  }
}
