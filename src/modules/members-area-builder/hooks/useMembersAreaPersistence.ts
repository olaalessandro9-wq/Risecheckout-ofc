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
import { api } from '@/lib/api';
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

  /**
   * Load members area data via Edge Function
   * MIGRATED: Uses admin-data Edge Function
   */
  const load = useCallback(async () => {
    if (!productId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await api.call<{ error?: string; sections?: unknown[]; settings?: unknown }>('admin-data', {
        action: 'members-area-data',
        productId,
      });
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      const parsedSections = parseSections(data?.sections || []);
      const parsedSettings = parseSettings(data?.settings);
      
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
    } catch (error: unknown) {
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
      // 1. Get deleted section IDs (in original but not in current, excluding temp IDs)
      const originalIds = new Set(originalSectionsRef.current.map(s => s.id));
      const currentIds = new Set(state.sections.map(s => s.id));
      const deletedIds = [...originalIds].filter(id => !currentIds.has(id));
      
      // 2. Save sections via Edge Function
      const { data: sectionsResult, error: sectionsError } = await api.call<{ success?: boolean; error?: string; insertedIdMap?: Record<string, string> }>('members-area-modules', {
        action: 'save-sections',
        productId,
        sections: state.sections,
        deletedIds,
      });
      
      if (sectionsError || !sectionsResult?.success) {
        throw new Error(sectionsResult?.error || sectionsError?.message || "Erro ao salvar seções");
      }
      
      const insertedIdMap: Map<string, string> = new Map(Object.entries(sectionsResult?.insertedIdMap || {}));
      
      // 3. Save settings via Edge Function
      const { data: settingsResult, error: settingsError } = await api.call<{ success?: boolean; error?: string }>('members-area-modules', {
        action: 'save-builder-settings',
        productId,
        settings: state.settings,
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
    } catch (error: unknown) {
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

  /**
   * Load modules via Edge Function
   * MIGRATED: Uses admin-data Edge Function via api.call
   */
  const loadModules = useCallback(async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await api.call<{ error?: string; modules?: unknown[] }>('admin-data', {
        action: 'members-area-modules',
        productId,
      });
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      setState(prev => ({
        ...prev,
        modules: (data?.modules || []) as MemberModule[],
      }));
    } catch (error: unknown) {
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
