/**
 * Members Area Builder - Main Hook
 * Gerencia o estado completo do builder
 * 
 * FLUXO DE SALVAMENTO MANUAL:
 * - Todas as operações (add, update, delete, reorder) alteram APENAS o estado local
 * - O banco de dados só é modificado ao clicar em "Salvar"
 * - isDirty = true quando há alterações não salvas
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { 
  BuilderState, 
  BuilderActions, 
  Section, 
  SectionType,
  SectionSettings,
  MembersAreaBuilderSettings,
  ViewMode,
  MemberModule,
} from '../types/builder.types';
import { DEFAULT_BUILDER_SETTINGS } from '../types/builder.types';
import { getSectionDefaults } from '../registry';

interface UseMembersAreaBuilderReturn {
  state: BuilderState;
  actions: BuilderActions;
}

const INITIAL_STATE: BuilderState = {
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

// Type guard for SectionType
const VALID_SECTION_TYPES: SectionType[] = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'];

function isSectionType(type: string): type is SectionType {
  return VALID_SECTION_TYPES.includes(type as SectionType);
}

/** Raw section row from database */
interface RawSectionRow {
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

// Helper to safely parse database data
function parseSections(data: unknown[]): Section[] {
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

function parseSettings(data: unknown): MembersAreaBuilderSettings {
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

// Helper to check if ID is temporary (not yet in DB)
function isTemporaryId(id: string): boolean {
  return id.startsWith('temp_');
}

export function useMembersAreaBuilder(productId: string | undefined): UseMembersAreaBuilderReturn {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);
  
  // Store original sections from DB for comparison during save
  const originalSectionsRef = useRef<Section[]>([]);
  const originalSettingsRef = useRef<MembersAreaBuilderSettings>(DEFAULT_BUILDER_SETTINGS);

  // =====================================================
  // LOAD
  // =====================================================
  
  const load = useCallback(async () => {
    if (!productId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data: sections, error: sectionsError } = await supabase
        .from('product_members_sections')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true });
      
      if (sectionsError) throw sectionsError;
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('members_area_settings')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;
      
      const parsedSections = parseSections(sections || []);
      const parsedSettings = parseSettings(product?.members_area_settings);
      
      // Store originals for comparison
      originalSectionsRef.current = parsedSections;
      originalSettingsRef.current = parsedSettings;
      
      setState(prev => ({
        ...prev,
        sections: parsedSections,
        settings: parsedSettings,
        isLoading: false,
        isDirty: false,
      }));
    } catch (error) {
      console.error('[useMembersAreaBuilder] Load error:', error);
      toast.error('Erro ao carregar configurações');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  // =====================================================
  // SECTION CRUD (LOCAL ONLY - NO DATABASE CALLS)
  // =====================================================

  const addSection = useCallback(async (type: SectionType, position?: number): Promise<Section | null> => {
    if (!productId) return null;
    
    const newPosition = position ?? state.sections.length;
    const defaults = getSectionDefaults(type);
    
    // Build settings - for modules section, inherit current module order
    let settings = { type, ...defaults } as SectionSettings;
    
    if (type === 'modules') {
      // Snapshot current module order from Content tab
      const currentModuleOrder = state.modules.map(m => m.id);
      settings = {
        ...settings,
        module_order: currentModuleOrder,
      } as SectionSettings;
    }
    
    // Generate temporary ID - will be replaced with real DB ID on save
    const newSection: Section = {
      id: `temp_${crypto.randomUUID()}`,
      product_id: productId,
      type,
      title: null,
      position: newPosition,
      settings,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection].sort((a, b) => a.position - b.position),
      selectedSectionId: newSection.id,
      isDirty: true,
    }));
    
    toast.success('Seção adicionada');
    return newSection;
  }, [productId, state.sections.length, state.modules]);

  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
      isDirty: true,
    }));
  }, []);

  const updateSectionSettings = useCallback(async (id: string, settings: Partial<SectionSettings>) => {
    setState(prev => {
      const section = prev.sections.find(s => s.id === id);
      if (!section) return prev;
      
      const mergedSettings = { ...section.settings, ...settings } as SectionSettings;
      
      return {
        ...prev,
        sections: prev.sections.map(s => 
          s.id === id ? { ...s, settings: mergedSettings, updated_at: new Date().toISOString() } : s
        ),
        isDirty: true,
      };
    });
  }, []);

  const deleteSection = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id),
      selectedSectionId: prev.selectedSectionId === id ? null : prev.selectedSectionId,
      isDirty: true,
    }));
    
    toast.success('Seção removida');
  }, []);

  const reorderSections = useCallback(async (orderedIds: string[]) => {
    setState(prev => {
      const sectionMap = new Map(prev.sections.map(s => [s.id, s]));
      const reordered = orderedIds.map((id, index) => ({
        ...sectionMap.get(id)!,
        position: index,
        updated_at: new Date().toISOString(),
      }));
      return { ...prev, sections: reordered, isDirty: true };
    });
  }, []);

  const duplicateSection = useCallback(async (id: string): Promise<Section | null> => {
    const section = state.sections.find(s => s.id === id);
    if (!section || !productId) return null;
    
    const newSection: Section = {
      id: `temp_${crypto.randomUUID()}`,
      product_id: productId,
      type: section.type,
      title: section.title ? `${section.title} (cópia)` : null,
      position: section.position + 1,
      settings: { ...section.settings },
      is_active: section.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setState(prev => {
      // Shift positions of sections after the duplicated one
      const updated = prev.sections.map(s =>
        s.position > section.position ? { ...s, position: s.position + 1 } : s
      );
      return {
        ...prev,
        sections: [...updated, newSection].sort((a, b) => a.position - b.position),
        selectedSectionId: newSection.id,
        isDirty: true,
      };
    });
    
    toast.success('Seção duplicada');
    return newSection;
  }, [productId, state.sections]);

  // =====================================================
  // SELECTION & VIEW
  // =====================================================

  const selectSection = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedSectionId: id, selectedMenuItemId: null }));
  }, []);

  const selectMenuItem = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedMenuItemId: id, selectedSectionId: null }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const togglePreviewMode = useCallback(() => {
    setState(prev => ({ ...prev, isPreviewMode: !prev.isPreviewMode }));
  }, []);

  const toggleMenuCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isMenuCollapsed: !prev.isMenuCollapsed }));
  }, []);

  // =====================================================
  // SETTINGS (LOCAL ONLY)
  // =====================================================

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
      isDirty: true,
    }));
  }, []);

  // =====================================================
  // SAVE - Persist ALL changes to database
  // =====================================================

  const save = useCallback(async (): Promise<boolean> => {
    if (!productId) return false;
    
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      const { getProducerSessionToken } = await import("@/hooks/useProducerAuth");
      const sessionToken = getProducerSessionToken();
      
      // 1. Get deleted section IDs (in original but not in current, excluding temp IDs)
      const originalIds = new Set(originalSectionsRef.current.map(s => s.id));
      const currentIds = new Set(state.sections.map(s => s.id));
      const deletedIds = [...originalIds].filter(id => !currentIds.has(id));
      
      // 2. Save sections via Edge Function
      const { data: sectionsResult, error: sectionsError } = await supabase.functions.invoke('members-area-modules', {
        body: {
          action: 'save-sections',
          productId,
          sections: state.sections,
          deletedIds,
          sessionToken,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });
      
      if (sectionsError || !sectionsResult?.success) {
        throw new Error(sectionsResult?.error || sectionsError?.message || "Erro ao salvar seções");
      }
      
      const insertedIdMap: Map<string, string> = new Map(Object.entries(sectionsResult.insertedIdMap || {}));
      
      // 3. Save settings via Edge Function
      const { data: settingsResult, error: settingsError } = await supabase.functions.invoke('members-area-modules', {
        body: {
          action: 'save-builder-settings',
          productId,
          settings: state.settings,
          sessionToken,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });
      
      if (settingsError || !settingsResult?.success) {
        throw new Error(settingsResult?.error || settingsError?.message || "Erro ao salvar configurações");
      }
      
      // 4. Update local state with real IDs and refresh originals
      setState(prev => {
        const updatedSections = prev.sections.map(s => {
          const realId = insertedIdMap.get(s.id);
          return realId ? { ...s, id: realId } : s;
        });
        
        // Update refs
        originalSectionsRef.current = updatedSections;
        originalSettingsRef.current = prev.settings;
        
        return {
          ...prev,
          sections: updatedSections,
          isDirty: false,
          isSaving: false,
        };
      });
      
      toast.success('Alterações salvas');
      return true;
    } catch (error) {
      console.error('[useMembersAreaBuilder] Save error:', error);
      toast.error('Erro ao salvar');
      setState(prev => ({ ...prev, isSaving: false }));
      return false;
    }
  }, [productId, state.sections, state.settings]);

  // =====================================================
  // DISCARD - Reload from database
  // =====================================================

  const discard = useCallback(() => {
    // Restore from original refs
    setState(prev => ({
      ...prev,
      sections: originalSectionsRef.current,
      settings: originalSettingsRef.current,
      isDirty: false,
      selectedSectionId: null,
    }));
    toast.info('Alterações descartadas');
  }, []);

  // =====================================================
  // MODULES (for individual editing)
  // =====================================================

  const loadModules = useCallback(async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await supabase
        .from('product_member_modules')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        modules: (data || []) as MemberModule[],
      }));
    } catch (error) {
      console.error('[useMembersAreaBuilder] Load modules error:', error);
    }
  }, [productId]);

  const updateModule = useCallback(async (id: string, moduleData: Partial<MemberModule>) => {
    try {
      const { getProducerSessionToken } = await import("@/hooks/useProducerAuth");
      const sessionToken = getProducerSessionToken();
      
      const { data: result, error } = await supabase.functions.invoke('members-area-modules', {
        body: {
          action: 'update',
          moduleId: id,
          data: moduleData,
          sessionToken,
        },
        headers: { 'x-producer-session-token': sessionToken || '' },
      });
      
      if (error || !result?.success) {
        throw new Error(result?.error || error?.message || 'Falha ao atualizar módulo');
      }
      
      setState(prev => ({
        ...prev,
        modules: prev.modules.map(m => m.id === id ? { ...m, ...moduleData } : m),
      }));
      
      toast.success('Módulo atualizado');
    } catch (error) {
      console.error('[useMembersAreaBuilder] Update module error:', error);
      toast.error('Erro ao atualizar módulo');
    }
  }, []);

  const selectModule = useCallback((id: string | null) => {
    setState(prev => ({ 
      ...prev, 
      selectedModuleId: id,
      isEditingModule: id !== null,
    }));
  }, []);

  const setEditingModule = useCallback((isEditing: boolean) => {
    setState(prev => ({ 
      ...prev, 
      isEditingModule: isEditing,
      selectedModuleId: isEditing ? prev.selectedModuleId : null,
    }));
  }, []);

  // Load modules when productId changes
  useEffect(() => {
    if (productId) {
      loadModules();
    }
  }, [productId, loadModules]);

  // =====================================================
  // RETURN
  // =====================================================

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
