/**
 * Members Area Builder - State Management Hook (Dual-Layout Version)
 * 
 * Uses XState State Machine as Single Source of Truth.
 * Supports independent Desktop/Mobile layouts.
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
  Viewport,
  MemberModule,
  BuilderState,
  BuilderActions,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

/** Create a new section with defaults */
export function createDefaultSection(
  productId: string, 
  type: SectionType, 
  position: number,
  viewport: Viewport,
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
    viewport,
    title: null,
    position,
    settings,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
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
  const activeSections = context.activeViewport === 'desktop' 
    ? context.desktopSections 
    : context.mobileSections;

  const stateValue = snapshot.value;
  const isReady = typeof stateValue === 'object' && 'ready' in stateValue;
  const isDirty = isReady && (stateValue as { ready: string }).ready === 'dirty';
  const isLoading = stateValue === 'loading';
  const isSaving = stateValue === 'saving';

  const state: BuilderState = {
    desktopSections: context.desktopSections,
    mobileSections: context.mobileSections,
    activeViewport: context.activeViewport,
    isMobileSynced: context.isMobileSynced,
    sections: activeSections,
    settings: context.settings,
    selectedSectionId: context.selectedSectionId,
    selectedMenuItemId: context.selectedMenuItemId,
    viewMode: context.viewMode,
    isPreviewMode: context.isPreviewMode,
    isMenuCollapsed: context.isMenuCollapsed,
    isDirty,
    isLoading,
    isSaving,
    modules: context.modules,
    selectedModuleId: context.selectedModuleId,
    isEditingModule: context.isEditingModule,
  };

  // Create actions
  const addSection = useCallback(async (type: SectionType, position?: number): Promise<Section | null> => {
    if (!productId) return null;
    const section = createDefaultSection(
      productId, 
      type, 
      position ?? activeSections.length, 
      context.activeViewport,
      context.modules
    );
    send({ type: 'ADD_SECTION', section });
    return section;
  }, [productId, activeSections.length, context.activeViewport, context.modules, send]);

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
    const original = activeSections.find(s => s.id === id);
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
  }, [activeSections, productId, send]);

  const selectSection = useCallback((id: string | null) => {
    send({ type: 'SELECT_SECTION', id });
  }, [send]);

  const selectMenuItem = useCallback((id: string | null) => {
    send({ type: 'SELECT_MENU_ITEM', id });
  }, [send]);

  const togglePreviewMode = useCallback(() => {
    send({ type: 'TOGGLE_PREVIEW_MODE' });
  }, [send]);

  const toggleMenuCollapse = useCallback(() => {
    send({ type: 'TOGGLE_MENU_COLLAPSE' });
  }, [send]);

  // Viewport actions (NEW)
  const setActiveViewport = useCallback((viewport: Viewport) => {
    send({ type: 'SET_ACTIVE_VIEWPORT', viewport });
  }, [send]);

  const copyDesktopToMobile = useCallback(() => {
    send({ type: 'COPY_DESKTOP_TO_MOBILE' });
    toast.success('Layout do Desktop copiado para Mobile');
  }, [send]);

  const setMobileSynced = useCallback((synced: boolean) => {
    send({ type: 'SET_MOBILE_SYNCED', synced });
    if (synced) {
      toast.info('Mobile sincronizado com Desktop');
    } else {
      toast.info('Edição independente do Mobile ativada');
    }
  }, [send]);

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    send({ type: 'UPDATE_SETTINGS', settings });
  }, [send]);

  const save = useCallback(async (): Promise<boolean> => {
    send({ type: 'SAVE' });
    return true;
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
    togglePreviewMode,
    toggleMenuCollapse,
    setActiveViewport,
    copyDesktopToMobile,
    setMobileSynced,
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
