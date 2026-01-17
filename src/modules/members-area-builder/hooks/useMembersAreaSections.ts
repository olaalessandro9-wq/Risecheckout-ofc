/**
 * Members Area Builder - Sections CRUD Hook
 * 
 * Responsible for:
 * - Add, update, delete, reorder, duplicate sections
 * - All operations are LOCAL ONLY (no DB calls)
 * 
 * REFACTORED: Uses dispatch from Reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Source of Truth
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  BuilderState, 
  Section, 
  SectionType,
  SectionSettings,
  MemberModule,
} from '../types/builder.types';
import type { BuilderAction } from '../state/builderReducer';
import { getSectionDefaults } from '../registry';

interface UseMembersAreaSectionsProps {
  productId: string | undefined;
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

interface UseMembersAreaSectionsReturn {
  addSection: (type: SectionType, position?: number) => Promise<Section | null>;
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>;
  updateSectionSettings: (id: string, settings: Partial<SectionSettings>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  duplicateSection: (id: string) => Promise<Section | null>;
}

/**
 * Sections CRUD hook for Members Area Builder
 */
export function useMembersAreaSections({
  productId,
  state,
  dispatch,
}: UseMembersAreaSectionsProps): UseMembersAreaSectionsReturn {

  const addSection = useCallback(async (type: SectionType, position?: number): Promise<Section | null> => {
    if (!productId) return null;
    
    const newPosition = position ?? state.sections.length;
    const defaults = getSectionDefaults(type);
    
    // Build settings - for modules section, inherit current module order
    let settings = { type, ...defaults } as SectionSettings;
    
    if (type === 'modules') {
      // Snapshot current module order from Content tab
      const currentModuleOrder = state.modules.map((m: MemberModule) => m.id);
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
    
    dispatch({ type: 'ADD_SECTION', section: newSection });
    
    toast.success('Seção adicionada');
    return newSection;
  }, [productId, state.sections.length, state.modules, dispatch]);

  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    dispatch({ type: 'UPDATE_SECTION', id, updates });
  }, [dispatch]);

  const updateSectionSettings = useCallback(async (id: string, settings: Partial<SectionSettings>) => {
    dispatch({ type: 'UPDATE_SECTION_SETTINGS', id, settings });
  }, [dispatch]);

  const deleteSection = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_SECTION', id });
    toast.success('Seção removida');
  }, [dispatch]);

  const reorderSections = useCallback(async (orderedIds: string[]) => {
    dispatch({ type: 'REORDER_SECTIONS', orderedIds });
  }, [dispatch]);

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
    
    dispatch({ type: 'DUPLICATE_SECTION', original: section, duplicate: newSection });
    
    toast.success('Seção duplicada');
    return newSection;
  }, [productId, state.sections, dispatch]);

  return {
    addSection,
    updateSection,
    updateSectionSettings,
    deleteSection,
    reorderSections,
    duplicateSection,
  };
}
