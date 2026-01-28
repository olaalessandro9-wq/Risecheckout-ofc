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
  Viewport,
  MemberModule,
} from '../types/builder.types';

// ============================================================================
// CONTEXT
// ============================================================================

export interface BuilderMachineContext {
  productId: string | null;
  
  // Dual-Layout: Separate sections by viewport
  desktopSections: Section[];
  mobileSections: Section[];
  
  // Active editing viewport
  activeViewport: Viewport;
  
  // Mobile sync mode: when true, mobile mirrors desktop automatically
  isMobileSynced: boolean;
  
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
  
  // Originals for comparison (both viewports)
  originalDesktopSections: Section[];
  originalMobileSections: Section[];
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
  | { type: "RECEIVE_DATA"; desktopSections: Section[]; mobileSections: Section[]; settings: MembersAreaBuilderSettings; isMobileSynced: boolean }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SAVE" }
  | { type: "SAVE_SUCCESS"; desktopSections?: Section[]; mobileSections?: Section[] }
  | { type: "SAVE_ERROR"; error: string }
  | { type: "DISCARD_CHANGES" }
  | { type: "REFRESH" }
  
  // Sections CRUD (operates on active viewport)
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
  
  // Viewport Switching (NEW - Dual Layout)
  | { type: "SET_ACTIVE_VIEWPORT"; viewport: Viewport }
  | { type: "COPY_DESKTOP_TO_MOBILE" }
  | { type: "SET_MOBILE_SYNCED"; synced: boolean }
  
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
  desktopSections: Section[];
  mobileSections: Section[];
  settings: MembersAreaBuilderSettings;
  modules: MemberModule[];
  productImageUrl: string | null;
  productName: string | null;
  isMobileSynced: boolean;
}

export interface SaveBuilderInput {
  productId: string | null;
  desktopSections: Section[];
  mobileSections: Section[];
  settings: MembersAreaBuilderSettings;
  originalDesktopSections: Section[];
  originalMobileSections: Section[];
}

export interface SaveBuilderOutput {
  success: boolean;
  updatedDesktopSections?: Section[];
  updatedMobileSections?: Section[];
  error?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SectionCreateInput {
  type: SectionType;
  position?: number;
}
