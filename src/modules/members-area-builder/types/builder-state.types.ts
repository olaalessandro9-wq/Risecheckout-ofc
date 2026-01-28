/**
 * Members Area Builder - Builder State Types
 * Estado e Ações do Builder
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * @module members-area-builder/types
 */

import type { MemberModule } from '@/modules/members-area/types/module.types';
import type { Section, SectionType } from './section.types';
import type { Viewport, ViewMode } from './viewport.types';
import type { SectionSettings, MembersAreaBuilderSettings } from './settings.types';

// =====================================================
// BUILDER STATE
// =====================================================

export interface BuilderState {
  // Dual-Layout: Separate sections by viewport
  desktopSections: Section[];
  mobileSections: Section[];
  
  // Active editing viewport
  activeViewport: Viewport;
  
  // Mobile sync mode: when true, mobile mirrors desktop automatically
  isMobileSynced: boolean;
  
  // Computed: returns sections for active viewport
  sections: Section[];
  
  settings: MembersAreaBuilderSettings;
  selectedSectionId: string | null;
  selectedMenuItemId: string | null;
  viewMode: ViewMode;
  isPreviewMode: boolean;
  isMenuCollapsed: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  // Modules data for editing
  modules: MemberModule[];
  selectedModuleId: string | null;
  isEditingModule: boolean;
}

// =====================================================
// BUILDER ACTIONS
// =====================================================

export interface BuilderActions {
  // Sections CRUD (local only - no DB calls)
  addSection: (type: SectionType, position?: number) => Promise<Section | null>;
  updateSection: (id: string, updates: Partial<Section>) => Promise<void>;
  updateSectionSettings: (id: string, settings: Partial<SectionSettings>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  duplicateSection: (id: string) => Promise<Section | null>;
  
  // Selection
  selectSection: (id: string | null) => void;
  selectMenuItem: (id: string | null) => void;
  
  // View
  setViewMode: (mode: ViewMode) => void;
  togglePreviewMode: () => void;
  toggleMenuCollapse: () => void;
  
  // Viewport Switching (Dual Layout)
  setActiveViewport: (viewport: Viewport) => void;
  copyDesktopToMobile: () => void;
  setMobileSynced: (synced: boolean) => void;
  
  // Settings (local only)
  updateSettings: (settings: Partial<MembersAreaBuilderSettings>) => Promise<void>;
  
  // Persistence
  save: () => Promise<boolean>;
  load: () => Promise<void>;
  discard: () => void; // Discard unsaved changes
  
  // Modules (for editing individual module covers)
  loadModules: () => Promise<void>;
  updateModule: (id: string, data: Partial<MemberModule>) => Promise<void>;
  selectModule: (id: string | null) => void;
  setEditingModule: (isEditing: boolean) => void;
}
