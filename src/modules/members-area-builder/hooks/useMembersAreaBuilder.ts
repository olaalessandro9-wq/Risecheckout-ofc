/**
 * Members Area Builder - Main Orchestrator Hook
 * 
 * Composes smaller hooks for:
 * - State management (Reducer)
 * - Sections CRUD
 * - Persistence (load/save)
 * - View state
 * - Module editing
 * 
 * REFACTORED: Uses useReducer as Single Source of Truth
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - State Management via Reducer
 */

import type { BuilderState, BuilderActions } from '../types/builder.types';
import { useMembersAreaState } from './useMembersAreaState';
import { useMembersAreaSections } from './useMembersAreaSections';
import { useMembersAreaPersistence } from './useMembersAreaPersistence';
import { useMembersAreaView } from './useMembersAreaView';
import { useMembersAreaModulesEdit } from './useMembersAreaModulesEdit';

interface UseMembersAreaBuilderReturn {
  state: BuilderState;
  actions: BuilderActions;
}

/**
 * Main orchestrator hook for Members Area Builder
 */
export function useMembersAreaBuilder(productId: string | undefined): UseMembersAreaBuilderReturn {
  // Core state management via Reducer
  const {
    state,
    dispatch,
    originalSectionsRef,
    originalSettingsRef,
  } = useMembersAreaState();

  // Sections CRUD (local only)
  const {
    addSection,
    updateSection,
    updateSectionSettings,
    deleteSection,
    reorderSections,
    duplicateSection,
  } = useMembersAreaSections({ productId, state, dispatch });

  // Persistence (load/save/discard)
  const {
    load,
    save,
    discard,
    loadModules,
  } = useMembersAreaPersistence({
    productId,
    state,
    dispatch,
    originalSectionsRef,
    originalSettingsRef,
  });

  // View state (selection, modes)
  const {
    selectSection,
    selectMenuItem,
    setViewMode,
    togglePreviewMode,
    toggleMenuCollapse,
    updateSettings,
  } = useMembersAreaView({ dispatch });

  // Module editing
  const {
    updateModule,
    selectModule,
    setEditingModule,
  } = useMembersAreaModulesEdit({ dispatch });

  // Compose all actions
  const actions: BuilderActions = {
    addSection,
    updateSection,
    updateSectionSettings,
    deleteSection,
    reorderSections,
    duplicateSection,
    selectSection,
    selectMenuItem,
    setViewMode,
    togglePreviewMode,
    toggleMenuCollapse,
    updateSettings,
    save,
    load,
    discard,
    loadModules,
    updateModule,
    selectModule,
    setEditingModule,
  };

  return { state, actions };
}
