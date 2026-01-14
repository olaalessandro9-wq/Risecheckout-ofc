/**
 * Members Area Builder - Main Orchestrator Hook
 * 
 * Composes smaller hooks for:
 * - State management
 * - Sections CRUD
 * - Persistence (load/save)
 * - View state
 * - Module editing
 * 
 * FLUXO DE SALVAMENTO MANUAL:
 * - Todas as operações (add, update, delete, reorder) alteram APENAS o estado local
 * - O banco de dados só é modificado ao clicar em "Salvar"
 * - isDirty = true quando há alterações não salvas
 * 
 * @see RISE ARCHITECT PROTOCOL - Refactored to ~80 lines (compliance: 300-line limit)
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
  // Core state management
  const {
    state,
    setState,
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
  } = useMembersAreaSections({ productId, state, setState });

  // Persistence (load/save/discard)
  const {
    load,
    save,
    discard,
    loadModules,
  } = useMembersAreaPersistence({
    productId,
    state,
    setState,
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
  } = useMembersAreaView({ setState });

  // Module editing
  const {
    updateModule,
    selectModule,
    setEditingModule,
  } = useMembersAreaModulesEdit({ setState });

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
