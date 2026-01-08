/**
 * Members Area Builder - Main Hook
 * Gerencia o estado completo do builder
 * 
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState, useCallback, useEffect } from 'react';
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
};

// Type guard for SectionType
const VALID_SECTION_TYPES: SectionType[] = ['banner', 'modules', 'courses', 'continue_watching', 'text', 'spacer'];

function isSectionType(type: string): type is SectionType {
  return VALID_SECTION_TYPES.includes(type as SectionType);
}

// Helper to safely parse database data
function parseSections(data: unknown[]): Section[] {
  return (data || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    type: isSectionType(item.type) ? item.type : 'text',
    title: item.title,
    position: item.position,
    settings: (item.settings || {}) as SectionSettings,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
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
    login_layout: partial.login_layout ?? DEFAULT_BUILDER_SETTINGS.login_layout,
    login_background_url: partial.login_background_url,
    login_logo_url: partial.login_logo_url,
  };
}

export function useMembersAreaBuilder(productId: string | undefined): UseMembersAreaBuilderReturn {
  const [state, setState] = useState<BuilderState>(INITIAL_STATE);

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
      
      setState(prev => ({
        ...prev,
        sections: parseSections(sections || []),
        settings: parseSettings(product?.members_area_settings),
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
  // SECTION CRUD
  // =====================================================

  const addSection = useCallback(async (type: SectionType, position?: number): Promise<Section | null> => {
    if (!productId) return null;
    
    try {
      const newPosition = position ?? state.sections.length;
      const defaults = getSectionDefaults(type);
      
      const { data, error } = await supabase
        .from('product_members_sections')
        .insert({
          product_id: productId,
          type,
          title: null,
          position: newPosition,
          settings: defaults as Json,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newSection: Section = {
        id: data.id,
        product_id: data.product_id,
        type: type,
        title: data.title,
        position: data.position,
        settings: (data.settings || {}) as unknown as SectionSettings,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      setState(prev => ({
        ...prev,
        sections: [...prev.sections, newSection].sort((a, b) => a.position - b.position),
        selectedSectionId: newSection.id,
        isDirty: true,
      }));
      
      toast.success('Seção adicionada');
      return newSection;
    } catch (error) {
      console.error('[useMembersAreaBuilder] Add section error:', error);
      toast.error('Erro ao adicionar seção');
      return null;
    }
  }, [productId, state.sections.length]);

  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.settings) {
        dbUpdates.settings = updates.settings as unknown as Json;
      }
      
      const { error } = await supabase
        .from('product_members_sections')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s),
        isDirty: true,
      }));
    } catch (error) {
      console.error('[useMembersAreaBuilder] Update section error:', error);
      toast.error('Erro ao atualizar seção');
    }
  }, []);

  const updateSectionSettings = useCallback(async (id: string, settings: Partial<SectionSettings>) => {
    const section = state.sections.find(s => s.id === id);
    if (!section) return;
    
    const mergedSettings = { ...section.settings, ...settings } as SectionSettings;
    await updateSection(id, { settings: mergedSettings });
  }, [state.sections, updateSection]);

  const deleteSection = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_members_sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== id),
        selectedSectionId: prev.selectedSectionId === id ? null : prev.selectedSectionId,
        isDirty: true,
      }));
      
      toast.success('Seção removida');
    } catch (error) {
      console.error('[useMembersAreaBuilder] Delete section error:', error);
      toast.error('Erro ao remover seção');
    }
  }, []);

  const reorderSections = useCallback(async (orderedIds: string[]) => {
    try {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('product_members_sections')
          .update({ position: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      
      setState(prev => {
        const sectionMap = new Map(prev.sections.map(s => [s.id, s]));
        const reordered = orderedIds.map((id, index) => ({
          ...sectionMap.get(id)!,
          position: index,
        }));
        return { ...prev, sections: reordered, isDirty: true };
      });
    } catch (error) {
      console.error('[useMembersAreaBuilder] Reorder error:', error);
      toast.error('Erro ao reordenar seções');
    }
  }, []);

  const duplicateSection = useCallback(async (id: string): Promise<Section | null> => {
    const section = state.sections.find(s => s.id === id);
    if (!section || !productId) return null;
    
    try {
      const { data, error } = await supabase
        .from('product_members_sections')
        .insert({
          product_id: productId,
          type: section.type,
          title: section.title ? `${section.title} (cópia)` : null,
          position: section.position + 1,
          settings: section.settings as unknown as Json,
          is_active: section.is_active,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newSection: Section = {
        id: data.id,
        product_id: data.product_id,
        type: section.type,
        title: data.title,
        position: data.position,
        settings: (data.settings || {}) as unknown as SectionSettings,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      const sectionsToUpdate = state.sections
        .filter(s => s.position > section.position)
        .map(s => ({ id: s.id, position: s.position + 1 }));
      
      if (sectionsToUpdate.length > 0) {
        await Promise.all(
          sectionsToUpdate.map(({ id, position }) =>
            supabase
              .from('product_members_sections')
              .update({ position })
              .eq('id', id)
          )
        );
      }
      
      setState(prev => {
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
    } catch (error) {
      console.error('[useMembersAreaBuilder] Duplicate error:', error);
      toast.error('Erro ao duplicar seção');
      return null;
    }
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
  // SETTINGS
  // =====================================================

  const updateSettings = useCallback(async (settings: Partial<MembersAreaBuilderSettings>) => {
    if (!productId) return;
    
    const newSettings = { ...state.settings, ...settings };
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ members_area_settings: newSettings as unknown as Json })
        .eq('id', productId);
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        settings: newSettings,
        isDirty: true,
      }));
    } catch (error) {
      console.error('[useMembersAreaBuilder] Update settings error:', error);
      toast.error('Erro ao atualizar configurações');
    }
  }, [productId, state.settings]);

  // =====================================================
  // SAVE
  // =====================================================

  const save = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Settings are saved immediately, so just mark as clean
      setState(prev => ({ ...prev, isDirty: false, isSaving: false }));
      toast.success('Alterações salvas');
      return true;
    } catch (error) {
      console.error('[useMembersAreaBuilder] Save error:', error);
      toast.error('Erro ao salvar');
      setState(prev => ({ ...prev, isSaving: false }));
      return false;
    }
  }, []);

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
  };

  return { state, actions };
}
