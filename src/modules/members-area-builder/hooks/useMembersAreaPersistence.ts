/**
 * Members Area Builder - Persistence Hook
 * 
 * Responsible for:
 * - Load data from database
 * - Save all changes to database
 * - Discard changes (restore from original)
 * 
 * REFACTORED: Uses dispatch from Reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { toast } from 'sonner';

const log = createLogger("UseMembersAreaPersistence");
import type { 
  BuilderState, 
  Section,
  MembersAreaBuilderSettings,
  MemberModule,
} from '../types/builder.types';
import type { BuilderAction } from '../state/builderReducer';
import { parseSections, parseSettings } from './useMembersAreaParsers';

interface UseMembersAreaPersistenceProps {
  productId: string | undefined;
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
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
  dispatch,
  originalSectionsRef,
  originalSettingsRef,
}: UseMembersAreaPersistenceProps): UseMembersAreaPersistenceReturn {

  /**
   * Load members area data via Edge Function
   */
  const load = useCallback(async () => {
    if (!productId) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    
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
      
      dispatch({ type: 'LOAD_SUCCESS', sections: parsedSections, settings: parsedSettings });
    } catch (error: unknown) {
      log.error('Load error:', error);
      toast.error('Erro ao carregar configurações');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [productId, dispatch, originalSectionsRef, originalSettingsRef]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!productId) return false;
    
    dispatch({ type: 'SET_SAVING', isSaving: true });
    
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
      
      // 4. Update local state with real IDs
      const updatedSections = state.sections.map(s => {
        const realId = insertedIdMap.get(s.id);
        return realId ? { ...s, id: realId } : s;
      });
      
      // Update refs
      originalSectionsRef.current = updatedSections;
      originalSettingsRef.current = state.settings;
      
      dispatch({ type: 'MARK_SAVED', sections: updatedSections });
      
      toast.success('Alterações salvas');
      return true;
    } catch (error: unknown) {
      log.error('Save error:', error);
      toast.error('Erro ao salvar');
      dispatch({ type: 'SET_SAVING', isSaving: false });
      return false;
    }
  }, [productId, state.sections, state.settings, dispatch, originalSectionsRef, originalSettingsRef]);

  const discard = useCallback(() => {
    dispatch({ 
      type: 'DISCARD_CHANGES', 
      original: {
        sections: originalSectionsRef.current,
        settings: originalSettingsRef.current,
      }
    });
    toast.info('Alterações descartadas');
  }, [dispatch, originalSectionsRef, originalSettingsRef]);

  /**
   * Load modules via Edge Function
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
      
      dispatch({ type: 'SET_MODULES', modules: (data?.modules || []) as MemberModule[] });
    } catch (error: unknown) {
      log.error('Load modules error:', error);
    }
  }, [productId, dispatch]);

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
