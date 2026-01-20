/**
 * BuilderMachine Types
 * 
 * Type definitions for the Members Area Builder State Machine.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solution 10.0/10
 * @module members-area-builder/machines
 */

import type { 
  Section, 
  SectionSettings,
  SectionType,
  MembersAreaBuilderSettings,
  ViewMode,
  MemberModule,
} from '../types/builder.types';

// ============================================================================
// CONTEXT
// ============================================================================

export interface BuilderMachineContext {
  productId: string | null;
  sections: Section[];
  settings: MembersAreaBuilderSettings;
  
  // Selection
  selectedSectionId: string | null;
  selectedMenuItemId: string | null;
  
  // View
  viewMode: ViewMode;
  isPreviewMode: boolean;
  isMenuCollapsed: boolean;
  
  // Modules
  modules: MemberModule[];
  selectedModuleId: string | null;
  isEditingModule: boolean;
  
  // Originals for comparison
  originalSections: Section[];
  originalSettings: MembersAreaBuilderSettings;
  
  // Errors
  loadError: string | null;
  saveError: string | null;
}

// ============================================================================
// EVENTS
// ============================================================================

export type BuilderMachineEvent =
  // Lifecycle
  | { type: "LOAD"; productId: string }
  | { type: "RECEIVE_DATA"; sections: Section[]; settings: MembersAreaBuilderSettings }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SAVE" }
  | { type: "SAVE_SUCCESS"; sections?: Section[] }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "DISCARD_CHANGES" }
  | { type: "REFRESH" }
  
  // Sections CRUD
  | { type: "ADD_SECTION"; section: Section }
  | { type: "UPDATE_SECTION"; id: string; updates: Partial<Section> }
  | { type: "UPDATE_SECTION_SETTINGS"; id: string; settings: Partial<SectionSettings> }
  | { type: "DELETE_SECTION"; id: string }
  | { type: "REORDER_SECTIONS"; orderedIds: string[] }
  | { type: "DUPLICATE_SECTION"; original: Section; duplicate: Section }
  
  // Selection
  | { type: "SELECT_SECTION"; id: string | null }
  | { type: "SELECT_MENU_ITEM"; id: string | null }
  
  // View
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "TOGGLE_PREVIEW_MODE" }
  | { type: "TOGGLE_MENU_COLLAPSE" }
  
  // Settings
  | { type: "UPDATE_SETTINGS"; settings: Partial<MembersAreaBuilderSettings> }
  
  // Modules
  | { type: "SET_MODULES"; modules: MemberModule[] }
  | { type: "UPDATE_MODULE"; id: string; data: Partial<MemberModule> }
  | { type: "SELECT_MODULE"; id: string | null }
  | { type: "SET_EDITING_MODULE"; isEditing: boolean };

// ============================================================================
// ACTOR INPUT/OUTPUT
// ============================================================================

export interface LoadBuilderInput {
  productId: string | null;
}

export interface LoadBuilderOutput {
  sections: Section[];
  settings: MembersAreaBuilderSettings;
  modules: MemberModule[];
}

export interface SaveBuilderInput {
  productId: string | null;
  sections: Section[];
  settings: MembersAreaBuilderSettings;
  originalSections: Section[];
}

export interface SaveBuilderOutput {
  success: boolean;
  updatedSections?: Section[];
  error?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SectionCreateInput {
  type: SectionType;
  position?: number;
}
