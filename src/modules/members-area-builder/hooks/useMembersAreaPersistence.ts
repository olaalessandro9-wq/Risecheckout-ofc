/**
 * Members Area Builder - Persistence Hook
 * 
 * Responsible for:
 * - Load data from database
 * - Save all changes to database
 * - Discard changes (restore from original)
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  BuilderState, 
  Section,
  MembersAreaBuilderSettings,
  MemberModule,
} from '../types/builder.types';
import { parseSections, parseSettings } from './useMembersAreaParsers';

interface UseMembersAreaPersistenceProps {
  productId: string | undefined;
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
  originalSectionsRef: React.MutableRefObject<Section[]>;
  originalSettingsRef: React.MutableRefObject<MembersAreaBuilderSettings>;
}

interface UseMembersAreaPersistenceReturn {
  load: () => Promise<void>;
  save: () => Promise<boolean>;
  discard: () => void;
  loadModules: () => Promise<void>;
}

/**
 * Persistence hook for Members Area Builder
 */
export function useMembersAreaPersistence({
  productId,
  state,
  setState,
  originalSectionsRef,
  originalSettingsRef,
}: UseMembersAreaPersistenceProps): UseMembersAreaPersistenceReturn {

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
  }, [productId, setState, originalSectionsRef, originalSettingsRef]);

  useEffect(() => {
    load();
  }, [load]);

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
  }, [productId, state.sections, state.settings, setState, originalSectionsRef, originalSettingsRef]);

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
  }, [setState, originalSectionsRef, originalSettingsRef]);

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
  }, [productId, setState]);

  useEffect(() => {
    if (productId) {
      loadModules();
    }
  }, [productId, loadModules]);

  return {
    load,
    save,
    discard,
    loadModules,
  };
}
