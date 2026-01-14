/**
 * Members Area Builder - Sections CRUD Hook
 * 
 * Responsible for:
 * - Add, update, delete, reorder, duplicate sections
 * - All operations are LOCAL ONLY (no DB calls)
 * 
 * @see RISE ARCHITECT PROTOCOL - Extracted for 300-line compliance
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
import { getSectionDefaults } from '../registry';

interface UseMembersAreaSectionsProps {
  productId: string | undefined;
  state: BuilderState;
  setState: React.Dispatch<React.SetStateAction<BuilderState>>;
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
  setState,
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
    
    setState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection].sort((a, b) => a.position - b.position),
      selectedSectionId: newSection.id,
      isDirty: true,
    }));
    
    toast.success('Seção adicionada');
    return newSection;
  }, [productId, state.sections.length, state.modules, setState]);

  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s),
      isDirty: true,
    }));
  }, [setState]);

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
  }, [setState]);

  const deleteSection = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id),
      selectedSectionId: prev.selectedSectionId === id ? null : prev.selectedSectionId,
      isDirty: true,
    }));
    
    toast.success('Seção removida');
  }, [setState]);

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
  }, [setState]);

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
  }, [productId, state.sections, setState]);

  return {
    addSection,
    updateSection,
    updateSectionSettings,
    deleteSection,
    reorderSections,
    duplicateSection,
  };
}
