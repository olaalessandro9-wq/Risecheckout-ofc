/**
 * Members Area Builder - State Management Hook
 * 
 * Uses XState State Machine as Single Source of Truth.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 */

import { useEffect, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { toast } from 'sonner';
import { builderMachine } from '../machines';
import { getSectionDefaults } from '../registry';
import type { 
  Section,
  SectionType,
  SectionSettings,
  MembersAreaBuilderSettings,
  ViewMode,
  MemberModule,
  BuilderState,
  BuilderActions,
} from '../types/builder.types';

// ============================================================================
// TYPES
// ============================================================================

/** Raw database row type for sections */
export interface RawSectionRow {
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

/** Create a new section with defaults */
export function createDefaultSection(
  productId: string, 
  type: SectionType, 
  position: number,
  modules: MemberModule[] = []
): Section {
  const defaults = getSectionDefaults(type);
  
  let settings = { type, ...defaults } as SectionSettings;
  
  if (type === 'modules') {
    const currentModuleOrder = modules.map(m => m.id);
    settings = {
      ...settings,
      module_order: currentModuleOrder,
    } as SectionSettings;
  }
  
  return {
    id: `temp_${crypto.randomUUID()}`,
    product_id: productId,
    type,
    title: null,
    position,
    settings,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Valid section types for type guard */
export const VALID_SECTION_TYPES = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'] as const;

/** Type guard for SectionType */
export function isSectionType(type: string): type is typeof VALID_SECTION_TYPES[number] {
  return VALID_SECTION_TYPES.includes(type as typeof VALID_SECTION_TYPES[number]);
}

/** Check if ID is temporary (not yet in DB) */
export function isTemporaryId(id: string): boolean {
  return id.startsWith('temp_');
}

/** Hook return type */
export interface UseMembersAreaStateReturn {
  state: BuilderState;
  actions: BuilderActions;
}

/**
 * State management hook using XState State Machine
 */
export function useMembersAreaState(productId: string | undefined): UseMembersAreaStateReturn {
  const [snapshot, send] = useMachine(builderMachine);

  // Load data when productId changes
  useEffect(() => {
    if (productId) {
      send({ type: 'LOAD', productId });
    }
  }, [productId, send]);

  // Derive BuilderState from machine context
  const context = snapshot.context;
  const state: BuilderState = {
    sections: context.sections,
    settings: context.settings,
    selectedSectionId: context.selectedSectionId,
    selectedMenuItemId: context.selectedMenuItemId,
    viewMode: context.viewMode,
    isPreviewMode: context.isPreviewMode,
    isMenuCollapsed: context.isMenuCollapsed,
    isDirty: snapshot.matches({ ready: 'dirty' }),
    isLoading: snapshot.matches('loading'),
    isSaving: snapshot.matches('saving'),
    modules: context.modules,
    selectedModuleId: context.selectedModuleId,
    isEditingModule: context.isEditingModule,
  };

  // Create actions
  const addSection = useCallback(async (type: SectionType, position?: number): Promise<Section | null> => {
    if (!productId) return null;
    const section = createDefaultSection(productId, type, position ?? state.sections.length, state.modules);
    send({ type: 'ADD_SECTION', section });
    return section;
  }, [productId, state.sections.length, state.modules, send]);

  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    send({ type: 'UPDATE_SECTION', id, updates });
  }, [send]);

  const updateSectionSettings = useCallback(async (id: string, settings: Partial<SectionSettings>) => {
    send({ type: 'UPDATE_SECTION_SETTINGS', id, settings });
  }, [send]);

  const deleteSection = useCallback(async (id: string) => {
    send({ type: 'DELETE_SECTION', id });
  }, [send]);

  const reorderSections = useCallback(async (orderedIds: string[]) => {
    send({ type: 'REORDER_SECTIONS', orderedIds });
  }, [send]);

  const duplicateSection = useCallback(async (id: string): Promise<Section | null> => {
    const original = state.sections.find(s => s.id === id);
    if (!original || !productId) return null;
    
    const duplicate: Section = {
      ...original,
      id: `temp_${crypto.randomUUID()}`,
      position: original.position + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    send({ type: 'DUPLICATE_SECTION', original, duplicate });
    return duplicate;
  }, [state.sections, productId, send]);

  const selectSection = useCallback((id: string | null) => {
    send({ type: 'SELECT_SECTION', id });
  }, [send]);

  const selectMenuItem = useCallback((id: string | null) => {
    send({ type: 'SELECT_MENU_ITEM', id });
  }, [send]);

  const setViewMode = useCallback((mode: ViewMode) => {
    send({ type: 'SET_VIEW_MODE', mode });
  }, [send]);

  const togglePreviewMode = useCallback(() => {
    send({ type: 'TOGGLE_PREVIEW_MODE' });
  }, [send]);

  const toggleMenuCollapse = useCallback(() => {
    send({ type: 'TOGGLE_MENU_COLLAPSE' });
  }, [send]);

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    send({ type: 'UPDATE_SETTINGS', settings });
  }, [send]);

  const save = useCallback(async (): Promise<boolean> => {
    send({ type: 'SAVE' });
    return true; // The machine handles the async
  }, [send]);

  const load = useCallback(async () => {
    if (productId) {
      send({ type: 'LOAD', productId });
    }
  }, [productId, send]);

  const discard = useCallback(() => {
    send({ type: 'DISCARD_CHANGES' });
    toast.info('Alterações descartadas');
  }, [send]);

  const loadModules = useCallback(async () => {
    // Modules are loaded with LOAD event
    if (productId) {
      send({ type: 'REFRESH' });
    }
  }, [productId, send]);

  const updateModule = useCallback(async (id: string, data: Partial<MemberModule>) => {
    send({ type: 'UPDATE_MODULE', id, data });
  }, [send]);

  const selectModule = useCallback((id: string | null) => {
    send({ type: 'SELECT_MODULE', id });
  }, [send]);

  const setEditingModule = useCallback((isEditing: boolean) => {
    send({ type: 'SET_EDITING_MODULE', isEditing });
  }, [send]);

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
